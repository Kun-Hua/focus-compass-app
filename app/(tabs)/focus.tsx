import InterruptionModal from '@/components/focus/InterruptionModal';
import PomodoroSettingsModal, { PomodoroSettings } from '@/components/focus/PomodoroSettingsModal';
import TimerModeModal from '@/components/focus/TimerModeModal';
import TimerView from '@/components/focus/TimerView';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { useAuth } from '@/contexts/AuthContext';
import { focusApi } from '@/services/focusApi';
import { goalsApi } from '@/services/goalsApi';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

    // Honesty mode
    const [honestyMode, setHonestyMode] = useState(false);

    // Modals
    const [showModeModal, setShowModeModal] = useState(false);
    const [showInterruptionModal, setShowInterruptionModal] = useState(false);
    const [showPomodoroSettings, setShowPomodoroSettings] = useState(false);

    // Pomodoro settings
    const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>({
        focusMinutes: 25,
        breakMinutes: 5,
        totalRounds: 4,
    });

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
            // We use functional update or check current state
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
    }, [user]); // Removed selectedGoal from dependencies to prevent loops

    useEffect(() => {
        console.log('[FocusScreen] useEffect: Calling loadGoals');
        loadGoals();
    }, [loadGoals]);

    // Handle timer completion
    const handleTimerComplete = (durationSeconds: number) => {
        console.log('[FocusScreen] handleTimerComplete:', durationSeconds);
        setSessionDuration(durationSeconds);
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
            const durationMinutes = Math.floor(sessionDuration / 60);
            console.log('[FocusScreen] Saving focus session:', {
                durationMinutes,
                honestyMode,
                goalId: selectedGoal.id
            });

            await focusApi.create({
                user_id: user.id,
                goal_id: selectedGoal.id,
                duration_minutes: durationMinutes,
                honesty_mode: honestyMode,
                interruption_reason: data.interruptionReason,
                interruption_count: data.interruptionCount,
            });

            setShowInterruptionModal(false);
            setSessionDuration(0);

            Alert.alert('Session Saved', `${durationMinutes} minutes recorded!`);
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
                    honestyMode={honestyMode}
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
                    <TouchableOpacity onPress={() => setShowModeModal(true)}>
                        <Text style={styles.modeButton}>{timerMode} ▾</Text>
                    </TouchableOpacity>
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

                {/* Honesty Mode Toggle */}
                <View style={styles.section}>
                    <View style={styles.honestyRow}>
                        <View style={styles.honestyInfo}>
                            <Text style={styles.honestyLabel}>
                                {honestyMode ? '🛡️ Honesty Mode' : '🔓 Standard Mode'}
                            </Text>
                            <Text style={styles.honestyDesc}>
                                {honestyMode
                                    ? 'High accountability, counts as net investment'
                                    : 'Counts as total time only'}
                            </Text>
                        </View>
                        <Switch
                            value={honestyMode}
                            onValueChange={setHonestyMode}
                            trackColor={{ false: Colors.border.default, true: Colors.primary }}
                            thumbColor={Colors.surface}
                        />
                    </View>
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
                honestyMode={honestyMode}
                onSave={handleSessionSave}
                onCancel={() => setShowInterruptionModal(false)}
            />

            {/* Pomodoro Settings Modal */}
            <PomodoroSettingsModal
                visible={showPomodoroSettings}
                settings={pomodoroSettings}
                onClose={() => setShowPomodoroSettings(false)}
                onSave={setPomodoroSettings}
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
    honestyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
    },
    honestyInfo: {
        flex: 1,
        marginRight: Spacing.md,
    },
    honestyLabel: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    honestyDesc: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.secondary,
        marginTop: 2,
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
