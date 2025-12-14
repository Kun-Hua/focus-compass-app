import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
// Use legacy API to avoid deprecation errors in Expo SDK 52+
// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatDuration } from '../../utils/time';
import {
    calculateVideoDuration,
    cleanupFrames,
    getFrameFilename,
    getFramesDirectory,
    getOutputVideoPath,
    synthesizeVideo
} from '../../utils/timelapse';

// Pomodoro settings interface
export interface PomodoroSettings {
    focusMinutes: number;
    breakMinutes: number;
    totalRounds: number;
}

// Default Pomodoro settings
const DEFAULT_POMODORO: PomodoroSettings = {
    focusMinutes: 25,
    breakMinutes: 5,
    totalRounds: 4,
};

interface TimerViewProps {
    mode: 'Pomodoro' | 'Stopwatch' | 'Timelapse';
    taskName: string;
    goalColor: string;
    onComplete: (duration: number, videoUri?: string | null) => void;
    onCancel: () => void;
    pomodoroSettings?: PomodoroSettings;
}

export default function TimerView({
    mode,
    taskName,
    goalColor,
    onComplete,
    onCancel,
    pomodoroSettings = DEFAULT_POMODORO,
}: TimerViewProps) {
    // Common state
    const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isSessionComplete, setIsSessionComplete] = useState(false);

    // Pomodoro state
    const [pomodoroPhase, setPomodoroPhase] = useState<'focus' | 'break'>('focus');
    const [currentRound, setCurrentRound] = useState(1);
    const [phaseSecondsRemaining, setPhaseSecondsRemaining] = useState(
        pomodoroSettings.focusMinutes * 60
    );

    // Timelapse state
    const [permission, requestPermission] = useCameraPermissions();
    const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
    const [mediaPermissionGranted, setMediaPermissionGranted] = useState(false);
    const cameraRef = useRef<CameraView>(null);

    // Frame capture state (TRUE TIMELAPSE)
    const [isCapturing, setIsCapturing] = useState(false);
    const [frameCount, setFrameCount] = useState(0); // Kept for logic if needed, but not updated in loop to avoid flicker
    const frameCountRef = useRef(0);
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [synthesisProgress, setSynthesisProgress] = useState('');
    const framesDirRef = useRef<string | null>(null);
    const captureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [recordedVideoUri, setRecordedVideoUri] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isStopLocked, setIsStopLocked] = useState(false); // Safety lock state
    // Frame processing lock to prevent race conditions
    const isProcessingFrameRef = useRef(false);
    const isCapturingRef = useRef(false);
    const captureFrameRef = useRef<(() => void) | null>(null);
    const isActiveRef = useRef(false);
    const sessionStartTimeRef = useRef(0);

    // Reset Pomodoro when settings change
    useEffect(() => {
        if (mode === 'Pomodoro') {
            setPhaseSecondsRemaining(pomodoroSettings.focusMinutes * 60);
            setPomodoroPhase('focus');
            setCurrentRound(1);
        }
    }, [mode, pomodoroSettings]);

    // Main timer effect
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        if (isActive && !isSessionComplete) {
            interval = setInterval(() => {
                setTotalElapsedSeconds((prev) => prev + 1);

                if (mode === 'Pomodoro') {
                    setPhaseSecondsRemaining((prev) => {
                        if (prev <= 1) {
                            if (pomodoroPhase === 'focus') {
                                if (currentRound >= pomodoroSettings.totalRounds) {
                                    handleStop(); // Auto-stop at end of session
                                    return 0;
                                }
                                setPomodoroPhase('break');
                                return pomodoroSettings.breakMinutes * 60;
                            } else {
                                setPomodoroPhase('focus');
                                setCurrentRound((r) => r + 1);
                                return pomodoroSettings.focusMinutes * 60;
                            }
                        }
                        return prev - 1;
                    });
                }
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isActive, isSessionComplete, mode, pomodoroPhase, currentRound, pomodoroSettings]);

    // Request permissions for timelapse
    useEffect(() => {
        if (mode === 'Timelapse') {
            const requestPermissions = async () => {
                if (!permission?.granted) await requestPermission();
                // Microphone not needed for photo capture, but keep for compatibility
                try {
                    const { status } = await MediaLibrary.requestPermissionsAsync(true);
                    setMediaPermissionGranted(status === 'granted');
                } catch (err) {
                    console.error('[Timelapse] Media library permission error:', err);
                }
            };
            requestPermissions();
        }
    }, [mode, permission]);

    // Helper: Ensure video is local (downloads if remote)
    const ensureLocalVideo = async (uri: string): Promise<string> => {
        if (uri.startsWith('http')) {
            const timestamp = Date.now();
            const localPath = `${FileSystem.cacheDirectory}timelapse_share_${timestamp}.mp4`;
            // Check if already downloaded? For simplicity, re-download if needed or trust previous logic
            // Actually, best to just download to a temp location for sharing/saving
            const { uri: downloadedUri } = await FileSystem.downloadAsync(uri, localPath);
            return downloadedUri;
        }
        return uri;
    };

    // Capture a single frame using Camera API (Fix for "Recording in progress" error)
    const captureFrame = useCallback(async () => {
        console.log(`[Timelapse] captureFrame called. isCapturing=${isCapturingRef.current}, hasCamera=${!!cameraRef.current}`);
        if (!cameraRef.current || !framesDirRef.current || !isCapturingRef.current) return;

        isProcessingFrameRef.current = true;
        try {
            console.log('[Timelapse] Starting recordAsync...');
            // Use manual stop timeout as backup for maxDuration logic
            const recordingPromise = cameraRef.current.recordAsync({
                maxDuration: 0.5,
            });

            // Force stop after short delay to ensure loop continues
            setTimeout(() => {
                if (cameraRef.current) {
                    try {
                        console.log('[Timelapse] Forcing stopRecording...');
                        cameraRef.current.stopRecording();
                    } catch (e) {
                        console.log('[Timelapse] Stop error:', e);
                    }
                }
            }, 600);

            const video = await recordingPromise;
            console.log(`[Timelapse] recordAsync done. URI: ${video?.uri}`);

            if (video?.uri) {
                const currentCount = frameCountRef.current;

                // Save video file (mp4) - backend will extract first frame
                const frameName = getFrameFilename(currentCount).replace('.jpg', '.mp4');
                const destPath = `${framesDirRef.current}${frameName}`;

                await FileSystem.moveAsync({
                    from: video.uri,
                    to: destPath,
                });
                console.log(`[Timelapse] Saved frame ${currentCount} to ${destPath}`);

                frameCountRef.current = currentCount + 1;
            }
        } catch (err: any) {
            console.error('[Timelapse] Capture error:', err);
            // Ignore "Recording in progress" errors and just retry next loop
        } finally {
            isProcessingFrameRef.current = false;
            console.log(`[Timelapse] Finally block. isCapturingRef=${isCapturingRef.current}`);
            // Schedule next frame ONLY after this one finishes
            if (isCapturingRef.current) {
                // Adjust interval based on how long capture took
                // For simplicity, just wait fixed interval
                const nextDelay = 3500; // 4s total (0.5s capture + 3.5s wait)
                console.log(`[Timelapse] Scheduling next frame in ${nextDelay}ms`);

                captureIntervalRef.current = setTimeout(() => {
                    if (captureFrameRef.current) {
                        captureFrameRef.current();
                    }
                }, nextDelay);
            } else {
                console.log(`[Timelapse] NOT scheduling next frame (isCapturing=false)`);
            }
        }
    }, []); // remove isCapturing dependency to avoid closure issues, rely on refs

    // Store latest captureFrame in ref
    useEffect(() => {
        captureFrameRef.current = captureFrame;
    }, [captureFrame]);

    // Start frame capture
    const startFrameCapture = useCallback(async () => {
        if (!cameraRef.current || !permission?.granted) {
            Alert.alert('Error', 'Camera not available');
            return;
        }

        const dir = await getFramesDirectory();
        framesDirRef.current = dir;
        frameCountRef.current = 0;
        setFrameCount(0);
        isProcessingFrameRef.current = false;

        setIsCapturing(true); // State update is async

        // We need a ref to track "active" state immediately for the loop
        // Reuse captureIntervalRef as a "timer handle"
    }, [permission]);

    // Effect to trigger loop when isCapturing becomes true
    useEffect(() => {
        console.log(`[Timelapse] useEffect [isCapturing] triggered: ${isCapturing}`);

        // Only update ref to true, not false
        // Setting to false is handled by stopFrameCapture after waiting for pending frames
        if (isCapturing) {
            isCapturingRef.current = true;
            if (captureFrameRef.current) {
                captureFrameRef.current();
            }
        }

        return () => {
            if (captureIntervalRef.current) {
                clearTimeout(captureIntervalRef.current);
            }
        };
    }, [isCapturing]); // Only depend on isCapturing state, not captureFrame function

    const stopFrameCapture = useCallback(() => {
        console.log('[Timelapse] ⚠️ stopFrameCapture called');
        setIsCapturing(false);
        isCapturingRef.current = false; // Immediately stop the loop

        if (captureIntervalRef.current) {
            clearTimeout(captureIntervalRef.current);
            captureIntervalRef.current = null;
        }
        // Force stop recording if stuck
        if (cameraRef.current) {
            try {
                cameraRef.current.stopRecording();
            } catch (e) { /* ignore */ }
        }
    }, []);

    const toggleTimer = useCallback(() => {
        console.log(`[Timelapse] 🔘 toggleTimer called. mode=${mode}, isActive=${isActive}`);
        if (mode === 'Timelapse' && !isActive) {
            console.log('[Timelapse] ▶️ Starting frame capture...');
            startFrameCapture();
        } else if (mode === 'Timelapse' && isActive) {
            console.log('[Timelapse] ⏸️ Pause attempt blocked (Timelapse cannot pause)');
            Alert.alert('Timelapse', 'Cannot pause timelapse. Press Stop to finish and create video.');
            return;
        }
        const newIsActive = !isActive;
        console.log(`[Timelapse] Setting isActive to: ${newIsActive}`);
        isActiveRef.current = newIsActive; // Update ref immediately

        if (newIsActive) {
            sessionStartTimeRef.current = Date.now();
            // Engage Safety Lock: Disable stop button for 3 seconds
            setIsStopLocked(true);
            setTimeout(() => {
                setIsStopLocked(false);
                console.log('[Timelapse] 🔓 Safety lock released - Stop button enabled');
            }, 3000);
        }

        setIsActive(newIsActive);
    }, [mode, isActive, startFrameCapture]);

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStop = useCallback(async () => {
        console.log('[Timelapse] ⏹️ handleStop called');

        // Guard: Don't allow stop if timer isn't active (use ref for immediate check)
        if (!isActiveRef.current) {
            console.log('[Timelapse] ⚠️ handleStop BLOCKED - timer not active yet');
            return;
        }

        // Safety Lock: Prevent accidental stops within first 2 seconds
        if (mode === 'Timelapse' && Date.now() - sessionStartTimeRef.current < 2000) {
            console.log('[Timelapse] ⚠️ handleStop BLOCKED - safety lock (too soon)');
            Alert.alert('Hold on', 'Recording just started. Please wait a moment before stopping.');
            return;
        }

        isActiveRef.current = false; // Update ref immediately
        setIsActive(false);

        if (mode === 'Timelapse') {
            stopFrameCapture();

            // Wait for any pending frame processing to complete
            // This prevents race condition where Stop is pressed while recording
            let attempts = 0;
            while (isProcessingFrameRef.current && attempts < 50) {
                console.log('[Timelapse] Waiting for pending frame...');
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            // Synthesize video from frames
            const finalFrameCount = frameCountRef.current;

            if (finalFrameCount > 0 && framesDirRef.current) {
                setIsSynthesizing(true);
                setSynthesisProgress('Preparing frames...');

                try {
                    const outputPath = getOutputVideoPath();
                    setSynthesisProgress(`Creating video from ${finalFrameCount} frames...`);

                    const videoUri = await synthesizeVideo(
                        framesDirRef.current,
                        outputPath,
                        (progress) => setSynthesisProgress(`Processing: ${Math.round(progress * 100)}%`)
                    );

                    if (videoUri) {
                        setRecordedVideoUri(videoUri);
                        const videoDuration = calculateVideoDuration(finalFrameCount);
                        setSynthesisProgress('Complete!');
                    } else {
                        // In Expo Go, synthesis will fail because FFmpeg is not available.
                        // We check if we actually captured frames to distinguish between "camera failed" vs "library missing".
                        console.log(`[Timelapse] Synthesis returned null. Total frames captured: ${finalFrameCount}`);

                        if (finalFrameCount > 0) {
                            Alert.alert(
                                'Preview Mode (Expo Go)',
                                `Captured ${finalFrameCount} frames successfully!\n\nTo create the actual video file, you need to use a Development Build because the video processing library (FFmpeg) contains native code not included in Expo Go.\n\nRun "npx expo run:android" to test the full video generation.`
                            );
                        } else {
                            Alert.alert('Error', 'No frames were captured. Please check camera permissions.');
                        }
                    }

                    // Cleanup frames
                    await cleanupFrames();
                } catch (error: any) {
                    setIsSynthesizing(false);
                    console.error('[Timelapse] Synthesis error caught in component:', error);

                    if (error?.message?.includes('null') || error?.name === 'TypeError') {
                        Alert.alert(
                            'Development Build Required',
                            'Video processing requires native libraries. Please use a Development Build.'
                        );
                    } else {
                        Alert.alert('Error', 'Failed to create timelapse video');
                    }
                } finally {
                    setIsSynthesizing(false);
                }
            }

            setIsSessionComplete(true);
        } else {
            setIsSessionComplete(true);
        }
    }, [mode, stopFrameCapture]);

    const saveVideo = async () => {
        if (!recordedVideoUri) return;

        setIsSaving(true);
        try {
            setSynthesisProgress('Downloading...');
            const uriToSave = await ensureLocalVideo(recordedVideoUri);

            if (mediaPermissionGranted) {
                await MediaLibrary.saveToLibraryAsync(uriToSave);
                setIsSaved(true);
                Alert.alert('Saved!', 'Video successfully saved to your Photos album.');
            } else {
                Alert.alert('Permission Required', 'Please enable photo library permissions in settings.');
                const { status } = await MediaLibrary.requestPermissionsAsync();
                if (status === 'granted') {
                    setMediaPermissionGranted(true);
                    // Try again
                    await MediaLibrary.saveToLibraryAsync(uriToSave);
                    setIsSaved(true);
                    Alert.alert('Saved!', 'Video successfully saved to your Photos album.');
                }
            }
        } catch (err: any) {
            Alert.alert('Error', `Failed to save video: ${err.message}`);
            console.error(err);
        } finally {
            setIsSaving(false);
            setSynthesisProgress('');
        }
    };

    const shareVideo = async () => {
        if (!recordedVideoUri) return;

        // Native Share Sheet (IG/FB compatible)
        if (!(await Sharing.isAvailableAsync())) {
            Alert.alert('Error', 'Sharing is not available on this device');
            return;
        }

        try {
            setSynthesisProgress('Preparing Share...');
            // Ensure we have a local file for native sharing (best for IG/FB Stories)
            const uriToShare = await ensureLocalVideo(recordedVideoUri);

            await Sharing.shareAsync(uriToShare, {
                mimeType: 'video/mp4',
                dialogTitle: 'Share your focus session',
                UTI: 'public.movie' // iOS specific
            });
        } catch (error: any) {
            Alert.alert('Error', `Share failed: ${error.message}`);
        } finally {
            setSynthesisProgress('');
        }
    };

    const handleFinish = () => {
        // Pass totalElapsedSeconds (Real Duration) not video duration
        onComplete(totalElapsedSeconds, recordedVideoUri);
    };

    // Render Session Summary (Post-Session)
    if (isSessionComplete) {
        return (
            <View style={styles.container}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Session Complete!</Text>
                    <Text style={styles.summaryDuration}>{formatDuration(totalElapsedSeconds)}</Text>
                    <Text style={styles.summaryTask}>{taskName}</Text>

                    {mode === 'Timelapse' && recordedVideoUri && (
                        <View style={styles.videoActions}>
                            <Text style={styles.videoHint}>
                                📹 Timelapse recorded
                            </Text>

                            <TouchableOpacity
                                style={[styles.actionButton, isSaved && styles.actionButtonDisabled]}
                                onPress={saveVideo}
                                disabled={isSaved}
                            >
                                <Ionicons name={isSaved ? "checkmark-circle" : "download-outline"} size={24} color={Colors.surface} />
                                <Text style={styles.actionButtonText}>
                                    {isSaved ? 'Saved to Album' : 'Save Video'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.secondaryButton} onPress={shareVideo}>
                                <Ionicons name="share-outline" size={24} color={Colors.primary} />
                                <Text style={styles.secondaryButtonText}>Share (IG/FB)</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
                        <Text style={styles.finishButtonText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Render Pomodoro mode
    const renderPomodoro = () => (
        <View style={[styles.ring, { borderColor: pomodoroPhase === 'focus' ? goalColor : Colors.success }]}>
            <View style={styles.innerRing}>
                <Text style={styles.timerText}>{formatTime(phaseSecondsRemaining)}</Text>
                <Text style={[styles.phaseText, { color: pomodoroPhase === 'focus' ? goalColor : Colors.success }]}>
                    {pomodoroPhase === 'focus' ? '🍅 Focus' : '☕ Break'}
                </Text>
                <Text style={styles.roundText}>
                    Round {currentRound} / {pomodoroSettings.totalRounds}
                </Text>
            </View>
        </View>
    );

    // Render Stopwatch mode
    const renderStopwatch = () => (
        <View style={[styles.ring, { borderColor: goalColor }]}>
            <View style={styles.innerRing}>
                <Text style={styles.timerText}>{formatTime(totalElapsedSeconds)}</Text>
                <Text style={styles.modeText}>Stopwatch</Text>
            </View>
        </View>
    );

    // Render Timelapse mode
    const renderTimelapse = () => (
        <View style={styles.timelapseContainer}>
            {permission?.granted ? (
                <View style={styles.cameraWrapper}>
                    {/* Removed ViewShot wrapper since we use direct Camera API now */}
                    <CameraView
                        ref={cameraRef}
                        style={styles.camera}
                        facing="front"
                        mode="video"
                        mute={true}
                    />

                    {/* Recording indicator only */}
                    {isCapturing && (
                        <View style={styles.recordingIndicator}>
                            <View style={styles.recordingDot} />
                            <Text style={styles.recordingText}>REC</Text>
                        </View>
                    )}
                </View>
            ) : (
                <View style={[styles.camera, styles.cameraPlaceholder]}>
                    <Text style={styles.cameraPlaceholderText}>📷</Text>
                    <Text style={styles.cameraPlaceholderSubtext}>Camera permission required</Text>
                </View>
            )}
            <View style={styles.timelapseInfo}>
                <View style={styles.timelapseRow}>
                    <Text style={styles.timelapseLabel}>Focus Time</Text>
                    <Text style={styles.timelapseValue}>{formatTime(totalElapsedSeconds)}</Text>
                </View>
                {/* Frame count hidden as requested */}
                <Text style={styles.timelapseHint}>
                    {isCapturing
                        ? 'Focusing...'
                        : '📹 Press Start to begin'}
                </Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {mode === 'Pomodoro' && renderPomodoro()}
            {mode === 'Stopwatch' && renderStopwatch()}
            {mode === 'Timelapse' && renderTimelapse()}

            <View style={styles.infoContainer}>
                <Text style={styles.taskName} numberOfLines={2}>
                    {taskName}
                </Text>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity style={styles.button} onPress={toggleTimer}>
                    <Text style={styles.buttonText}>
                        {isActive ? 'Pause' : 'Start'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.button,
                        styles.stopButton,
                        (!isActive || isStopLocked) && styles.buttonDisabled
                    ]}
                    onPress={handleStop}
                    disabled={!isActive || isStopLocked}
                >
                    <Text style={[styles.buttonText, styles.stopButtonText]}>
                        {isStopLocked ? 'Wait...' : 'Stop'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Cancel Session button removed - use Stop to properly end session */}

            {isSaving && (
                <View style={styles.savingOverlay}>
                    <View style={styles.savingCard}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.savingText}>Saving video...</Text>
                    </View>
                </View>
            )}

            {isSynthesizing && (
                <View style={styles.savingOverlay}>
                    <View style={styles.savingCard}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.savingText}>Creating Timelapse</Text>
                        <Text style={styles.synthesisProgress}>{synthesisProgress}</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    // Summary Styles
    summaryCard: {
        width: '100%',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xxl,
        alignItems: 'center',
        gap: Spacing.lg,
    },
    summaryTitle: {
        fontSize: Typography.h2.fontSize,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    summaryDuration: {
        fontSize: 48,
        fontWeight: '700',
        color: Colors.primary,
        fontVariant: ['tabular-nums'],
    },
    summaryTask: {
        fontSize: Typography.h3.fontSize,
        color: Colors.text.secondary,
        marginBottom: Spacing.lg,
    },
    videoActions: {
        width: '100%',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    videoHint: {
        textAlign: 'center',
        color: Colors.text.tertiary,
        marginBottom: Spacing.sm,
    },
    actionButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.full,
        gap: Spacing.sm,
        width: '100%',
    },
    actionButtonDisabled: {
        backgroundColor: Colors.success,
    },
    actionButtonText: {
        color: Colors.surface,
        fontWeight: '600',
        fontSize: Typography.body.fontSize,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.primary,
        gap: Spacing.sm,
        width: '100%',
    },
    secondaryButtonText: {
        color: Colors.primary,
        fontWeight: '600',
        fontSize: Typography.body.fontSize,
    },
    finishButton: {
        marginTop: Spacing.md,
        padding: Spacing.md,
    },
    finishButtonText: {
        color: Colors.text.tertiary,
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
    },
    // ... Existing styles ...
    cameraWrapper: {
        position: 'relative',
    },
    cameraOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.15)', // Subtle dark overlay to reduce flash
        pointerEvents: 'none',
    },
    camera: {
        width: 280,
        height: 280,
        borderRadius: 20,
        overflow: 'hidden',
    },
    recordingIndicator: {
        position: 'absolute',
        top: Spacing.md,
        right: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF0000',
        marginRight: 4,
    },
    recordingText: {
        color: '#FF0000',
        fontSize: 12,
        fontWeight: '700',
    },
    cameraPlaceholder: {
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.border.default,
        borderStyle: 'dashed',
    },
    cameraPlaceholderText: {
        fontSize: 48,
    },
    cameraPlaceholderSubtext: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.tertiary,
        marginTop: Spacing.sm,
    },
    ring: {
        width: 300,
        height: 300,
        borderRadius: 150,
        borderWidth: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
    },
    innerRing: {
        alignItems: 'center',
    },
    timerText: {
        fontSize: 56,
        fontWeight: '700',
        color: Colors.text.primary,
        fontVariant: ['tabular-nums'],
    },
    modeText: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.secondary,
        marginTop: Spacing.sm,
    },
    phaseText: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '600',
        marginTop: Spacing.sm,
    },
    roundText: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.tertiary,
        marginTop: Spacing.xs,
    },
    timelapseContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    timelapseInfo: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        marginTop: Spacing.lg,
        width: 280,
    },
    timelapseRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    timelapseLabel: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.secondary,
    },
    timelapseValue: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '700',
        color: Colors.text.primary,
        fontVariant: ['tabular-nums'],
    },
    timelapseHint: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.tertiary,
        textAlign: 'center',
        marginTop: Spacing.sm,
    },
    infoContainer: {
        marginBottom: Spacing.xxl,
        alignItems: 'center',
    },
    taskName: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
        textAlign: 'center',
    },
    controls: {
        flexDirection: 'row',
        gap: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    button: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.primary,
        minWidth: 120,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.surface,
    },
    stopButton: {
        backgroundColor: Colors.surface,
        borderWidth: 2,
        borderColor: Colors.error,
    },
    buttonDisabled: {
        opacity: 0.3,
    },
    stopButtonText: {
        color: Colors.error,
    },
    cancelButton: {
        padding: Spacing.md,
    },
    cancelButtonText: {
        color: Colors.text.tertiary,
        fontSize: Typography.body.fontSize,
    },
    savingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    savingCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xxl,
        alignItems: 'center',
        gap: Spacing.md,
    },
    savingText: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
        marginTop: Spacing.md,
    },
    synthesisProgress: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.secondary,
        marginTop: Spacing.sm,
    },
});
