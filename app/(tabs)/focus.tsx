import InterruptionModal from '@/components/focus/InterruptionModal';
import PomodoroSettingsModal, { PomodoroSettings } from '@/components/focus/PomodoroSettingsModal';
import TimelapseHistoryModal from '@/components/focus/TimelapseHistoryModal';
import TimerModeModal from '@/components/focus/TimerModeModal';
import TimerView from '@/components/focus/TimerView';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { useAuth } from '@/contexts/AuthContext';
import { focusApi } from '@/services/focusApi';
import { goalsApi } from '@/services/goalsApi';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Use legacy API for Expo Go compatibility
import * as FileSystem from 'expo-file-system/legacy';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDuration } from '../../utils/time';

const SETTINGS_STORAGE_KEY = 'focus_pomodoro_settings';

interface Goal {
    id: string;
    name: string;
    color?: string;
}

type TimerMode = 'Pomodoro' | 'Stopwatch' | 'Timelapse';

export default function FocusScreen() {
    const { user } = useAuth();
    console.log('[FocusScreen] Rendering, user:', user?.id);

    // Goals state
    const [goals, setGoals] = useState<Goal[]>([]);
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [loadingGoals, setLoadingGoals] = useState(true);

    // Timer state
    const [timerMode, setTimerMode] = useState<TimerMode>('Stopwatch');
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [sessionDuration, setSessionDuration] = useState(0);
    const [sessionVideoUri, setSessionVideoUri] = useState<string | null>(null);

    // Honesty mode


    // Modals
    const [showModeModal, setShowModeModal] = useState(false);
    const [showInterruptionModal, setShowInterruptionModal] = useState(false);
    const [showPomodoroSettings, setShowPomodoroSettings] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    // Pomodoro settings
    const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>({
        focusMinutes: 25,
        breakMinutes: 5,
        totalRounds: 4,
        soundName: 'Default',
    });

    // Load settings persistence
    useEffect(() => {
        const loadSettings = async () => {
            console.log('[FocusScreen] ╔═══════════════════════════════════════════════════╗');
            console.log('[FocusScreen] ║          LOADING SETTINGS ON MOUNT                ║');
            console.log('[FocusScreen] ╚═══════════════════════════════════════════════════╝');
            console.log('[FocusScreen] DEBUG: Storage key:', SETTINGS_STORAGE_KEY);

            // FileSystem diagnostics
            try {
                // @ts-ignore
                const docDir = FileSystem.documentDirectory;
                console.log('[FocusScreen] DEBUG: FileSystem.documentDirectory:', docDir);
                if (docDir) {
                    const files = await FileSystem.readDirectoryAsync(docDir);
                    console.log('[FocusScreen] DEBUG: Files in documentDirectory:', JSON.stringify(files));
                    console.log('[FocusScreen] DEBUG: Total files in document directory:', files.length);
                } else {
                    console.warn('[FocusScreen] WARNING: documentDirectory is NULL');
                }
            } catch (fsErr) {
                console.error('[FocusScreen] ERROR: FileSystem diagnostic failed:', fsErr);
            }

            console.log('[FocusScreen] DEBUG: Reading from AsyncStorage...');
            try {
                const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
                console.log('[FocusScreen] DEBUG: AsyncStorage raw result:', stored);
                console.log('[FocusScreen] DEBUG: Data type:', typeof stored);
                console.log('[FocusScreen] DEBUG: Data length:', stored?.length || 0);

                if (stored) {
                    console.log('[FocusScreen] DEBUG: ✅ Found stored settings, parsing...');
                    const parsed = JSON.parse(stored);
                    console.log('[FocusScreen] DEBUG: Parsed settings object:');
                    console.log('[FocusScreen] DEBUG:   - focusMinutes:', parsed.focusMinutes);
                    console.log('[FocusScreen] DEBUG:   - breakMinutes:', parsed.breakMinutes);
                    console.log('[FocusScreen] DEBUG:   - totalRounds:', parsed.totalRounds);
                    console.log('[FocusScreen] DEBUG:   - soundUri:', parsed.soundUri || '(undefined)');
                    console.log('[FocusScreen] DEBUG:   - soundName:', parsed.soundName || '(undefined)');

                    // Check if soundUri file exists
                    if (parsed.soundUri && parsed.soundUri.startsWith('file://')) {
                        console.log('[FocusScreen] DEBUG: Checking if sound file exists...');
                        try {
                            const fileInfo = await FileSystem.getInfoAsync(parsed.soundUri);
                            console.log('[FocusScreen] DEBUG: File info:', JSON.stringify(fileInfo));
                            if (fileInfo.exists) {
                                console.log('[FocusScreen] DEBUG: ✅ Sound file EXISTS at:', parsed.soundUri);
                                console.log('[FocusScreen] DEBUG: File size:', fileInfo.size, 'bytes');
                            } else {
                                console.warn('[FocusScreen] WARNING: ❌ Sound file DOES NOT EXIST at:', parsed.soundUri);
                            }
                        } catch (fileCheckErr) {
                            console.error('[FocusScreen] ERROR: Failed to check file existence:', fileCheckErr);
                        }
                    }

                    console.log('[FocusScreen] DEBUG: Applying settings to state...');
                    setPomodoroSettings(prev => {
                        const newSettings = { ...prev, ...parsed };
                        console.log('[FocusScreen] DEBUG: Previous state:', JSON.stringify(prev));
                        console.log('[FocusScreen] DEBUG: New state after merge:', JSON.stringify(newSettings));
                        return newSettings;
                    });
                    console.log('[FocusScreen] DEBUG: ✅ Settings applied to state');
                } else {
                    console.log('[FocusScreen] DEBUG: ⚠️ No stored settings found in AsyncStorage');
                    console.log('[FocusScreen] DEBUG: Will use default settings');
                }
            } catch (e) {
                console.error('[FocusScreen] ERROR: ❌ Failed to load settings:', e);
                console.error('[FocusScreen] ERROR: Error type:', typeof e);
                console.error('[FocusScreen] ERROR: Error message:', (e as Error)?.message);
            }
            console.log('[FocusScreen] ═══════════════════════════════════════════════════');
        };
        loadSettings();
    }, []);

    const handleSaveSettings = async (newSettings: PomodoroSettings) => {
        console.log('[FocusScreen] ╔═══════════════════════════════════════════════════╗');
        console.log('[FocusScreen] ║       HANDLE SAVE SETTINGS TRIGGERED              ║');
        console.log('[FocusScreen] ╚═══════════════════════════════════════════════════╝');
        console.log('[FocusScreen] DEBUG: Received settings from modal:');
        console.log('[FocusScreen] DEBUG:   - focusMinutes:', newSettings.focusMinutes);
        console.log('[FocusScreen] DEBUG:   - breakMinutes:', newSettings.breakMinutes);
        console.log('[FocusScreen] DEBUG:   - totalRounds:', newSettings.totalRounds);
        console.log('[FocusScreen] DEBUG:   - soundUri:', newSettings.soundUri || '(undefined)');
        console.log('[FocusScreen] DEBUG:   - soundName:', newSettings.soundName || '(undefined)');

        let validSettings = { ...newSettings };

        // 1. Process Sound URI: Copy cached/temporary files to document storage for persistence
        // This handles both file:// (from DocumentPicker cache) and content:// (Android content URIs)
        if (newSettings.soundUri &&
            (newSettings.soundUri.startsWith('file://') || newSettings.soundUri.startsWith('content://'))) {
            console.log('[FocusScreen] DEBUG: 📁 FILE PERSISTENCE NEEDED - Processing sound file...');
            try {
                // @ts-ignore
                const docDir = FileSystem.documentDirectory;
                console.log('[FocusScreen] DEBUG: FileSystem.documentDirectory is:', docDir);

                if (!docDir) {
                    console.warn('[FocusScreen] WARNING: documentDirectory is null, cannot persist custom audio file.');
                } else {
                    // Extract filename or create timestamp-based one
                    const fileName = newSettings.soundUri.split('/').pop()?.split('?')[0] || `alarm_${Date.now()}.mp3`;
                    const permanentUri = docDir + fileName;

                    console.log(`[FocusScreen] DEBUG: Source URI: ${newSettings.soundUri}`);
                    console.log(`[FocusScreen] DEBUG: Permanent URI: ${permanentUri}`);

                    // Only copy if source is different from destination
                    if (newSettings.soundUri !== permanentUri) {
                        console.log('[FocusScreen] DEBUG: Copying file to permanent storage...');
                        try {
                            await FileSystem.copyAsync({
                                from: newSettings.soundUri,
                                to: permanentUri
                            });
                            console.log('[FocusScreen] DEBUG: ✅ Copy SUCCESS');
                            // Verify the copy
                            const fileInfo = await FileSystem.getInfoAsync(permanentUri);
                            console.log('[FocusScreen] DEBUG: Verified - File exists:', fileInfo.exists);
                            if (fileInfo.exists && !fileInfo.isDirectory) {
                                console.log('[FocusScreen] DEBUG: Verified - File size:', fileInfo.size);
                            }
                            validSettings.soundUri = permanentUri;
                        } catch (copyErr: any) {
                            console.log('[FocusScreen] DEBUG: Copy failed. Error:', copyErr.message);

                            // If file already exists, try to delete and retry
                            if (copyErr.message?.includes('already exists') || copyErr.message?.includes('File exists')) {
                                console.log('[FocusScreen] DEBUG: File exists, deleting and retrying...');
                                try {
                                    await FileSystem.deleteAsync(permanentUri, { idempotent: true });
                                    await FileSystem.copyAsync({
                                        from: newSettings.soundUri,
                                        to: permanentUri
                                    });
                                    console.log('[FocusScreen] DEBUG: Retry copy SUCCESS');
                                    validSettings.soundUri = permanentUri;
                                } catch (retryErr: any) {
                                    console.error('[FocusScreen] DEBUG: Retry failed:', retryErr.message);
                                    // Use permanent URI anyway, assuming it already exists
                                    validSettings.soundUri = permanentUri;
                                }
                            } else {
                                // For other errors, try to use the permanent path anyway
                                validSettings.soundUri = permanentUri;
                            }
                        }
                    } else {
                        console.log('[FocusScreen] DEBUG: File already in permanent storage, no copy needed');
                    }
                }
            } catch (err) {
                console.error('[FocusScreen] ERROR in file persistence logic:', err);
            }
        }

        console.log('[FocusScreen] ───────────────────────────────────────────────────');
        console.log('[FocusScreen] DEBUG: Final validSettings:');
        console.log('[FocusScreen] DEBUG:   - soundUri:', validSettings.soundUri || '(undefined)');
        console.log('[FocusScreen] DEBUG:   - soundName:', validSettings.soundName || '(undefined)');
        console.log('[FocusScreen] DEBUG: Updating React state...');
        setPomodoroSettings(validSettings);
        console.log('[FocusScreen] DEBUG: ✅ State updated');

        console.log('[FocusScreen] ───────────────────────────────────────────────────');
        console.log('[FocusScreen] DEBUG: 💾 SAVING TO ASYNCSTORAGE');
        console.log('[FocusScreen] DEBUG: Storage key:', SETTINGS_STORAGE_KEY);
        const jsonToSave = JSON.stringify(validSettings);
        console.log('[FocusScreen] DEBUG: JSON to save:', jsonToSave);
        console.log('[FocusScreen] DEBUG: JSON length:', jsonToSave.length, 'chars');
        AsyncStorage.setItem(SETTINGS_STORAGE_KEY, jsonToSave)
            .then(() => {
                console.log('[FocusScreen] DEBUG: ✅✅✅ AsyncStorage SAVE SUCCESS ✅✅✅');
                // Verify by immediate reading (just for debug)
                AsyncStorage.getItem(SETTINGS_STORAGE_KEY).then(val => {
                    console.log('[FocusScreen] DEBUG: Immediate verification read:', val);
                    if (val === jsonToSave) {
                        console.log('[FocusScreen] DEBUG: ✅ Verification PASSED');
                    } else {
                        console.error('[FocusScreen] ERROR: ❌ Verification FAILED - mismatch');
                    }
                });
            })
            .catch(err => {
                console.error('[FocusScreen] ERROR: ❌❌❌ AsyncStorage SAVE FAILED ❌❌❌');
                console.error('[FocusScreen] ERROR:', err);
            });
        console.log('[FocusScreen] ═══════════════════════════════════════════════════');
    };

    // Load goals on mount
    const loadGoals = useCallback(async () => {
        if (!user) {
            console.log('[FocusScreen] loadGoals: No user, skipping');
            return;
        }

        console.log('[FocusScreen] loadGoals: Starting fetch for user', user.id);
        setLoadingGoals(true);
        try {
            const coreGoals = await goalsApi.getCoreGoals(user.id);
            console.log('[FocusScreen] loadGoals: Fetched core goals', coreGoals.length);

            const mappedGoals: Goal[] = coreGoals.map((g) => ({
                id: g.goal_id,
                name: g.goal_name,
                color: Colors.primary,
            }));

            // Set goals securely
            setGoals(mappedGoals);

            // Auto-select first goal if none selected
            setSelectedGoal(current => {
                if (mappedGoals.length > 0 && !current) {
                    console.log('[FocusScreen] loadGoals: Auto-selecting first goal', mappedGoals[0].name);
                    return mappedGoals[0];
                }
                return current;
            });

        } catch (err: any) {
            console.error('[FocusScreen] Failed to load goals:', err);
            Alert.alert('Load Failed', err.message || 'Unable to load goals');
        } finally {
            setLoadingGoals(false);
        }
    }, [user]);

    useEffect(() => {
        console.log('[FocusScreen] useEffect: Calling loadGoals');
        loadGoals();
    }, [loadGoals]);

    // Handle timer completion
    const handleTimerComplete = (durationSeconds: number, videoUri?: string | null) => {
        console.log('[FocusScreen] handleTimerComplete:', durationSeconds, videoUri);
        setSessionDuration(durationSeconds);
        setSessionVideoUri(videoUri || null);
        setIsTimerActive(false);
        setShowInterruptionModal(true);
    };

    // Handle timer cancel
    const handleTimerCancel = () => {
        console.log('[FocusScreen] handleTimerCancel');
        setIsTimerActive(false);
        setSessionDuration(0);
    };

    // Handle session save
    const handleSessionSave = async (data: { interruptionReason: string | null; interruptionCount: number }) => {
        console.log('[FocusScreen] handleSessionSave:', data);
        if (!user || !selectedGoal) {
            console.warn('[FocusScreen] handleSessionSave: Missing user or selectedGoal');
            return;
        }

        try {
            const durationSeconds = sessionDuration;
            let videoPath: string | null = null;

            // Upload video if present
            if (sessionVideoUri) {
                console.log('[FocusScreen] Uploading video...', sessionVideoUri);
                // Ideally show a progress indicator here, but for now we'll just block
                videoPath = await focusApi.uploadVideo(user.id, sessionVideoUri);
            }

            console.log('[FocusScreen] Saving focus session:', {
                durationSeconds,
                goalId: selectedGoal.id,
                videoPath
            });

            await focusApi.create({
                user_id: user.id,
                goal_id: selectedGoal.id,
                duration_seconds: durationSeconds,
                interruption_reason: data.interruptionReason,
                interruption_count: data.interruptionCount,
                mode: timerMode,
                video_path: videoPath,
            });

            setShowInterruptionModal(false);
            setSessionDuration(0);
            setSessionVideoUri(null);

            Alert.alert('Session Saved', `${formatDuration(durationSeconds)} recorded!${videoPath ? ' Video uploaded.' : ''}`);
        } catch (err: any) {
            console.error('[FocusScreen] Failed to save session:', err);
            Alert.alert('Save Failed', err.message || 'Unable to save focus record');
        }
    };

    // Start focus session
    const handleStartFocus = () => {
        console.log('[FocusScreen] handleStartFocus');
        if (!selectedGoal) {
            Alert.alert('Select a Goal', 'Please select a goal before starting');
            return;
        }
        setIsTimerActive(true);
    };

    // Render loading state
    if (!user) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <Text style={styles.messageText}>Please sign in to use Focus</Text>
            </SafeAreaView>
        );
    }

    // Render timer view when active
    if (isTimerActive) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <TimerView
                    mode={timerMode}
                    taskName={selectedGoal?.name || 'Focusing'}
                    goalColor={selectedGoal?.color || Colors.primary}
                    onComplete={handleTimerComplete}
                    onCancel={handleTimerCancel}
                    pomodoroSettings={pomodoroSettings}
                />

                <InterruptionModal
                    visible={showInterruptionModal}
                    durationSeconds={sessionDuration}
                    goalName={selectedGoal?.name || ''}
                    onSave={handleSessionSave}
                    onCancel={() => setShowInterruptionModal(false)}
                />
            </SafeAreaView>
        );
    }

    // Render main focus setup screen
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Focus</Text>
                    <View style={styles.headerControls}>
                        <TouchableOpacity onPress={() => setShowHistoryModal(true)} style={styles.iconButton}>
                            <Ionicons name="time-outline" size={24} color={Colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowModeModal(true)}>
                            <Text style={styles.modeButton}>{timerMode} ▾</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Goal Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Goal</Text>
                    {loadingGoals ? (
                        <ActivityIndicator color={Colors.primary} />
                    ) : goals.length === 0 ? (
                        <View style={styles.emptyGoals}>
                            <Text style={styles.emptyText}>No goals yet</Text>
                            <Text style={styles.emptySubtext}>Add goals in Vision page first</Text>
                        </View>
                    ) : (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.goalsContainer}
                        >
                            {goals.map((goal) => (
                                <TouchableOpacity
                                    key={goal.id}
                                    style={[
                                        styles.goalChip,
                                        selectedGoal?.id === goal.id && styles.goalChipSelected,
                                    ]}
                                    onPress={() => setSelectedGoal(goal)}
                                >
                                    <Text
                                        style={[
                                            styles.goalChipText,
                                            selectedGoal?.id === goal.id && styles.goalChipTextSelected,
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {goal.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>



                {/* Timer Mode Info */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.modeInfoCard}
                        onPress={() => timerMode === 'Pomodoro' && setShowPomodoroSettings(true)}
                    >
                        <Text style={styles.modeInfoIcon}>
                            {timerMode === 'Pomodoro' ? '🍅' : timerMode === 'Timelapse' ? '📷' : '⏱️'}
                        </Text>
                        <View style={styles.modeInfoText}>
                            <Text style={styles.modeInfoTitle}>{timerMode}</Text>
                            <Text style={styles.modeInfoDesc}>
                                {timerMode === 'Pomodoro'
                                    ? `${pomodoroSettings.focusMinutes}m focus, ${pomodoroSettings.breakMinutes}m break, ${pomodoroSettings.totalRounds} rounds`
                                    : timerMode === 'Timelapse'
                                        ? 'Record your work session'
                                        : 'Free timer for deep work'}
                            </Text>
                            {timerMode === 'Pomodoro' && (
                                <Text style={styles.tapHint}>👆 Tap to customize</Text>
                            )}
                        </View>
                        {timerMode === 'Pomodoro' && (
                            <Text style={styles.settingsIcon}>⚙️</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Start Button */}
                <TouchableOpacity
                    style={[styles.startButton, !selectedGoal && styles.startButtonDisabled]}
                    onPress={handleStartFocus}
                    disabled={!selectedGoal}
                >
                    <Text style={styles.startButtonText}>Start Focus</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Timer Mode Modal */}
            <TimerModeModal
                visible={showModeModal}
                onClose={() => setShowModeModal(false)}
                onSelectMode={setTimerMode}
                currentMode={timerMode}
            />

            {/* Interruption Modal (shown after timer ends) */}
            <InterruptionModal
                visible={showInterruptionModal}
                durationSeconds={sessionDuration}
                goalName={selectedGoal?.name || ''}
                onSave={handleSessionSave}
                onCancel={() => setShowInterruptionModal(false)}
            />

            {/* Pomodoro Settings Modal */}
            <PomodoroSettingsModal
                visible={showPomodoroSettings}
                settings={pomodoroSettings}
                onClose={() => setShowPomodoroSettings(false)}
                onSave={(newSettings) => {
                    console.log('[FocusScreen] onSave prop called from Modal');
                    handleSaveSettings(newSettings);
                }}
            />

            {/* Timelapse History Modal */}
            <TimelapseHistoryModal
                visible={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    centerContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    messageText: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.secondary,
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xxl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    title: {
        fontSize: Typography.h1.fontSize,
        fontWeight: Typography.h1.fontWeight,
        color: Colors.text.primary,
    },
    headerControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    iconButton: {
        padding: Spacing.sm,
    },
    modeButton: {
        fontSize: Typography.body.fontSize,
        color: Colors.primary,
        fontWeight: '600',
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: Typography.small.fontSize,
        fontWeight: '600',
        color: Colors.text.secondary,
        marginBottom: Spacing.md,
    },
    goalsContainer: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    goalChip: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.border.default,
        backgroundColor: Colors.surface,
        maxWidth: 150,
    },
    goalChipSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary,
    },
    goalChipText: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.primary,
    },
    goalChipTextSelected: {
        color: Colors.surface,
        fontWeight: '600',
    },
    emptyGoals: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.secondary,
    },
    emptySubtext: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.tertiary,
        marginTop: Spacing.xs,
    },
    modeInfoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
    },
    modeInfoIcon: {
        fontSize: 32,
        marginRight: Spacing.md,
    },
    modeInfoText: {
        flex: 1,
    },
    modeInfoTitle: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    modeInfoDesc: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    settingsIcon: {
        fontSize: 20,
        marginLeft: Spacing.sm,
    },
    tapHint: {
        fontSize: Typography.small.fontSize,
        color: Colors.primary,
        marginTop: 4,
        fontWeight: '600',
    },
    startButton: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.full,
        paddingVertical: Spacing.lg,
        alignItems: 'center',
        marginTop: Spacing.lg,
    },
    startButtonDisabled: {
        opacity: 0.5,
    },
    startButtonText: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.surface,
    },
});


