import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    onComplete: (duration: number) => void;
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
    const [isRecordingVideo, setIsRecordingVideo] = useState(false);
    const [recordedVideoUri, setRecordedVideoUri] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

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

        if (isActive) {
            interval = setInterval(() => {
                setTotalElapsedSeconds((prev) => prev + 1);

                if (mode === 'Pomodoro') {
                    setPhaseSecondsRemaining((prev) => {
                        if (prev <= 1) {
                            if (pomodoroPhase === 'focus') {
                                if (currentRound >= pomodoroSettings.totalRounds) {
                                    setIsActive(false);
                                    onComplete(totalElapsedSeconds + 1);
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
    }, [isActive, mode, pomodoroPhase, currentRound, pomodoroSettings, totalElapsedSeconds, onComplete]);

    // Request permissions for timelapse
    useEffect(() => {
        if (mode === 'Timelapse') {
            const requestPermissions = async () => {
                console.log('[Timelapse] Requesting permissions. Current camera permission:', permission);
                if (!permission?.granted) {
                    console.log('[Timelapse] Camera permission not granted. Requesting camera permission...');
                    try {
                        const camResult = await requestPermission();
                        console.log('[Timelapse] Camera permission result:', camResult);
                    } catch (err) {
                        console.error('[Timelapse] Camera permission request error:', err);
                    }
                }

                if (!microphonePermission?.granted) {
                    console.log('[Timelapse] Microphone permission not granted. Requesting...');
                    try {
                        const micResult = await requestMicrophonePermission();
                        console.log('[Timelapse] Microphone permission result:', micResult);
                    } catch (err) {
                        console.error('[Timelapse] Microphone permission request error:', err);
                    }
                }
                try {
                    // Request write-only permission to avoid asking for Audio read permissions
                    // capable of triggering 'undeclared permission' errors in Expo Go
                    const { status } = await MediaLibrary.requestPermissionsAsync(true);
                    console.log('[Timelapse] Media library permission status:', status);
                    setMediaPermissionGranted(status === 'granted');
                } catch (err) {
                    console.error('[Timelapse] Media library permission not available:', err);
                    setMediaPermissionGranted(false);
                }
            };
            requestPermissions();
        }
    }, [mode, permission]);

    // Start video recording
    const startVideoRecording = useCallback(async () => {
        console.log('[Timelapse] startVideoRecording called');
        console.log('[Timelapse] Platform.OS:', Platform.OS); // CRITICAL: Check if this says 'android' or 'web'

        if (!cameraRef.current || !permission?.granted) {
            console.error('[Timelapse] Cannot start recording. Camera or permission missing. permission?.granted =', permission?.granted);
            Alert.alert('Error', 'Camera not available');
            return;
        }

        try {
            console.log('[Timelapse] Starting video recording...');
            setIsRecordingVideo(true);
            const video = await cameraRef.current.recordAsync({
                maxDuration: 3600,
            });
            console.log('[Timelapse] recordAsync result:', video);
            if (video?.uri) {
                console.log('[Timelapse] Video recorded. URI:', video.uri);
                setRecordedVideoUri(video.uri);
            }
        } catch (err) {
            console.error('[Timelapse] Video recording error:', err);
            setIsRecordingVideo(false);
        }
    }, [permission]);

    // Stop video recording
    const stopVideoRecording = useCallback(async () => {
        console.log('[Timelapse] stopVideoRecording called. isRecordingVideo =', isRecordingVideo, 'Camera ref exists:', !!cameraRef.current);
        if (cameraRef.current && isRecordingVideo) {
            try {
                console.log('[Timelapse] Stopping video recording...');
                await cameraRef.current.stopRecording();
                console.log('[Timelapse] stopRecording completed');
                setIsRecordingVideo(false);
            } catch (err) {
                console.error('[Timelapse] Stop recording error:', err);
            }
        }
    }, [isRecordingVideo]);

    const toggleTimer = useCallback(() => {
        console.log('[Timer] toggleTimer called. mode =', mode, 'isActive =', isActive);
        if (mode === 'Timelapse' && !isActive) {
            console.log('[Timelapse] Starting timelapse recording from toggleTimer');
            startVideoRecording();
        }
        if (mode === 'Timelapse' && isActive) {
            console.log('[Timelapse] Pausing timer (recording state will be handled by stop/alert flow)');
        }
        setIsActive(!isActive);
    }, [mode, isActive, startVideoRecording]);

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
        console.log('[Timer] handleStop called. mode =', mode, 'totalElapsedSeconds =', totalElapsedSeconds, 'recordedVideoUri =', recordedVideoUri);
        setIsActive(false);

        if (mode === 'Timelapse') {
            await stopVideoRecording();

            setTimeout(() => {
                console.log('[Timelapse] Stop timeout fired. recordedVideoUri =', recordedVideoUri);
                if (recordedVideoUri) {
                    Alert.alert(
                        'Save Video',
                        `Recording complete (${formatTime(totalElapsedSeconds)}). Save to gallery?`,
                        [
                            { text: 'Discard', style: 'destructive', onPress: () => onComplete(totalElapsedSeconds) },
                            {
                                text: 'Save',
                                onPress: async () => {
                                    console.log('[Timelapse] Save pressed in alert. About to call saveVideo. URI =', recordedVideoUri);
                                    await saveVideo();
                                    onComplete(totalElapsedSeconds);
                                }
                            },
                        ]
                    );
                } else {
                    onComplete(totalElapsedSeconds);
                }
            }, 500);
        } else {
            onComplete(totalElapsedSeconds);
        }
    }, [mode, recordedVideoUri, totalElapsedSeconds, onComplete, stopVideoRecording]);

    const saveVideo = async () => {
        console.log('[Timelapse] saveVideo called. recordedVideoUri =', recordedVideoUri, 'mediaPermissionGranted =', mediaPermissionGranted);
        if (!recordedVideoUri) {
            console.error('[Timelapse] saveVideo called but recordedVideoUri is null');
            Alert.alert('Error', 'No video recorded');
            return;
        }

        setIsSaving(true);

        try {
            if (mediaPermissionGranted) {
                console.log('[Timelapse] Saving video to media library. URI =', recordedVideoUri);
                await MediaLibrary.saveToLibraryAsync(recordedVideoUri);
                console.log('[Timelapse] Video saved to gallery successfully');
                Alert.alert('Saved!', `Video saved to gallery!\n\nTip: Use a video editor to speed up ${formatTime(totalElapsedSeconds)} to create timelapse effect.`);
            } else {
                console.warn('[Timelapse] Cannot save video: media permission not granted');
                Alert.alert('Permission Required', 'Grant media library permission to save videos.');
            }
        } catch (err) {
            console.error('[Timelapse] Save video error:', err);
            Alert.alert('Error', `Failed to save video: ${err}`);
        } finally {
            setIsSaving(false);
        }
    };

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
                    <CameraView
                        ref={cameraRef}
                        style={styles.camera}
                        facing="front"
                        mode="video"
                        mute={true}
                    />
                    {isRecordingVideo && (
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
                    <Text style={styles.timelapseLabel}>Recording Time</Text>
                    <Text style={styles.timelapseValue}>{formatTime(totalElapsedSeconds)}</Text>
                </View>
                <Text style={styles.timelapseHint}>
                    {isRecordingVideo ? '🔴 Recording video...' : '📹 Ready to record'}
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
                    style={[styles.button, styles.stopButton]}
                    onPress={handleStop}
                >
                    <Text style={[styles.buttonText, styles.stopButtonText]}>
                        Stop
                    </Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelButtonText}>Cancel Session</Text>
            </TouchableOpacity>

            {isSaving && (
                <View style={styles.savingOverlay}>
                    <View style={styles.savingCard}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.savingText}>Saving video...</Text>
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
    cameraWrapper: {
        position: 'relative',
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
});
