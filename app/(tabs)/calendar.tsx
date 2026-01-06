import AddTodoModal from '@/components/calendar/AddTodoModal';
import CalendarView from '@/components/calendar/CalendarView';
import MonthlyView from '@/components/calendar/MonthlyView';
import TodoList from '@/components/calendar/TodoList';
import WeeklyView from '@/components/calendar/WeeklyView';
import InterruptionModal from '@/components/focus/InterruptionModal';
import PomodoroSettingsModal, { PomodoroSettings } from '@/components/focus/PomodoroSettingsModal';
import TimerModeModal from '@/components/focus/TimerModeModal';
import TimerView from '@/components/focus/TimerView';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { useAuth } from '@/contexts/AuthContext';
import { focusApi, FocusSessionLog } from '@/services/focusApi';
import { Todo, todosApi } from '@/services/todosApi';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Use legacy API for Expo Go compatibility
import * as FileSystem from 'expo-file-system/legacy';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SETTINGS_STORAGE_KEY = 'focus_pomodoro_settings';

export default function CalendarScreen() {
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState<'Day' | 'Week' | 'Month'>('Day');

    // Day view state
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [todos, setTodos] = useState<Todo[]>([]);
    const [history, setHistory] = useState<FocusSessionLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Week view state (Sunday as first day)
    const [currentWeek, setCurrentWeek] = useState(() => {
        const today = new Date();
        const day = today.getDay(); // 0=Sunday, 1=Monday, etc.
        const diff = today.getDate() - day; // Sunday of current week
        return new Date(today.setDate(diff));
    });

    // Month view state
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Active Focus State
    const [activeTodo, setActiveTodo] = useState<Todo | null>(null);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [timerMode, setTimerMode] = useState<'Pomodoro' | 'Stopwatch' | 'Timelapse'>('Stopwatch');
    const [sessionDuration, setSessionDuration] = useState(0);

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [addModalDate, setAddModalDate] = useState<Date>(new Date());
    const [addModalStartTime, setAddModalStartTime] = useState<Date | undefined>();
    const [addModalEndTime, setAddModalEndTime] = useState<Date | undefined>();
    const [showModeModal, setShowModeModal] = useState(false);
    const [showInterruption, setShowInterruption] = useState(false);
    const [showPomodoroSettings, setShowPomodoroSettings] = useState(false);
    const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>({
        focusMinutes: 25,
        breakMinutes: 5,
        totalRounds: 4,
        soundName: 'Default',
    });

    // Load Data based on current view
    const loadData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            if (viewMode === 'Day') {
                const [fetchedTodos, fetchedHistory] = await Promise.all([
                    todosApi.getTodosByDate(user.id, selectedDate),
                    focusApi.getSessionsByDateRange(
                        user.id,
                        new Date(selectedDate.setHours(0, 0, 0, 0)),
                        new Date(selectedDate.setHours(23, 59, 59, 999))
                    )
                ]);
                setTodos(fetchedTodos);
                setHistory(fetchedHistory);
            }
            // Week and Month views load their own data internally
        } catch (err) {
            console.error('Failed to load calendar data', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user, selectedDate, viewMode]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Load settings persistence (same as focus.tsx)
    useEffect(() => {
        const loadSettings = async () => {
            console.log('[CalendarScreen] DEBUG: Loading settings from AsyncStorage');
            try {
                const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    console.log('[CalendarScreen] DEBUG: Found settings:', JSON.stringify(parsed));
                    setPomodoroSettings(prev => ({ ...prev, ...parsed }));
                } else {
                    console.log('[CalendarScreen] DEBUG: No stored settings found.');
                }
            } catch (e) {
                console.error('[CalendarScreen] ERROR: Failed to load settings:', e);
            }
        };
        loadSettings();
    }, []);

    // Actions
    const handleAddTodo = async (data: {
        title: string;
        goalId: string | null;
        dueDate: Date;
        startTime?: Date | null;
        endTime?: Date | null;
        isAllDay: boolean;
    }) => {
        if (!user) return;
        try {
            await todosApi.create({
                userId: user.id,
                title: data.title,
                goalId: data.goalId,
                dueDate: data.dueDate,
                startTime: data.startTime,
                endTime: data.endTime,
                isAllDay: data.isAllDay,
            });
            loadData(); // Refresh current view
        } catch (err: any) {
            Alert.alert('Error', err.message);
        }
    };

    const handleToggleTodo = async (id: string, currentStatus: boolean) => {
        try {
            setTodos(prev => prev.map(t => t.todo_id === id ? { ...t, completed: !currentStatus } : t));
            await todosApi.toggleComplete(id, currentStatus);
        } catch (err) {
            console.error(err);
            loadData();
        }
    };

    const handleDeleteTodo = async (id: string) => {
        try {
            setTodos(prev => prev.filter(t => t.todo_id !== id));
            await todosApi.delete(id);
        } catch (err) {
            console.error(err);
            loadData();
        }
    };

    // Focus Flow
    const handleStartFocusRequest = (todo: Todo) => {
        setActiveTodo(todo);
        setShowModeModal(true);
    };

    const handleModeSelect = (mode: any) => {
        setTimerMode(mode);
        setShowModeModal(false);

        if (mode === 'Pomodoro') {
            // Open settings for Pomodoro before starting
            setTimeout(() => setShowPomodoroSettings(true), 100);
        } else {
            // Start immediately for others
            setTimeout(() => setIsTimerActive(true), 100);
        }
    };

    const handleTimerComplete = (duration: number) => {
        setSessionDuration(duration);
        setIsTimerActive(false);
        setShowInterruption(true);
    };

    const handleSaveSession = async (data: { interruptionReason: string | null; interruptionCount: number }) => {
        if (!user || !activeTodo) return;
        try {
            await focusApi.create({
                user_id: user.id,
                goal_id: activeTodo.goal_id || '',
                duration_seconds: sessionDuration,
                interruption_reason: data.interruptionReason,
                interruption_count: data.interruptionCount,
                mode: timerMode,
            });
            setShowInterruption(false);
            Alert.alert('Nice work!', 'Session recorded.');
            loadData();
        } catch (err: any) {
            Alert.alert('Error saving', err.message);
        }
    };

    // Modal helpers
    const openAddModal = (date: Date, startTime?: Date, endTime?: Date) => {
        setAddModalDate(date);
        setAddModalStartTime(startTime);
        setAddModalEndTime(endTime);
        setShowAddModal(true);
    };

    // Full Screen Timer
    if (isTimerActive && activeTodo) {
        return (
            <SafeAreaView style={styles.timerContainer}>
                <TimerView
                    mode={timerMode}
                    taskName={activeTodo.title}
                    goalColor={Colors.primary}
                    onComplete={handleTimerComplete}
                    onCancel={() => setIsTimerActive(false)}
                    pomodoroSettings={pomodoroSettings}
                />
            </SafeAreaView>
        );
    }

    // Render Content Based on View Mode
    const renderContent = () => {
        if (viewMode === 'Week') {
            return (
                <WeeklyView
                    currentWeek={currentWeek}
                    onWeekChange={setCurrentWeek}
                    onAddTodo={openAddModal}
                    onTodoPress={handleStartFocusRequest}
                />
            );
        }

        if (viewMode === 'Month') {
            return (
                <MonthlyView
                    currentMonth={currentMonth}
                    onMonthChange={setCurrentMonth}
                    onAddTodo={(date) => openAddModal(date)}
                    onTodoPress={handleStartFocusRequest}
                />
            );
        }

        // Day View (Default)
        return (
            <>
                <CalendarView
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                />

                <ScrollView
                    contentContainerStyle={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
                >
                    {loading ? (
                        <ActivityIndicator style={{ marginTop: 50 }} />
                    ) : (
                        <>
                            <TodoList
                                todos={todos}
                                onToggle={handleToggleTodo}
                                onStartFocus={handleStartFocusRequest}
                                onDelete={handleDeleteTodo}
                            />


                        </>
                    )}
                </ScrollView>
            </>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Calendar</Text>
                <TouchableOpacity onPress={() => openAddModal(viewMode === 'Day' ? selectedDate : viewMode === 'Week' ? currentWeek : currentMonth)}>
                    <Ionicons name="add-circle" size={32} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Segmented Control */}
            <View style={styles.segmentContainer}>
                {['Day', 'Week', 'Month'].map((mode) => (
                    <TouchableOpacity
                        key={mode}
                        style={[styles.segmentButton, viewMode === mode && styles.segmentButtonActive]}
                        onPress={() => setViewMode(mode as any)}
                    >
                        <Text style={[styles.segmentText, viewMode === mode && styles.segmentTextActive]}>
                            {mode}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {renderContent()}

            {/* Modals */}
            <AddTodoModal
                visible={showAddModal}
                userId={user?.id || ''}
                defaultDate={addModalDate}
                defaultStartTime={addModalStartTime}
                defaultEndTime={addModalEndTime}
                onClose={() => setShowAddModal(false)}
                onSave={handleAddTodo}
            />

            <TimerModeModal
                visible={showModeModal}
                currentMode={timerMode}
                onSelectMode={handleModeSelect}
                onClose={() => setShowModeModal(false)}
            />

            <InterruptionModal
                visible={showInterruption}
                durationSeconds={sessionDuration}
                goalName={activeTodo?.title || 'Unknown Task'}
                onSave={handleSaveSession}
                onCancel={() => setShowInterruption(false)}
            />

            <PomodoroSettingsModal
                visible={showPomodoroSettings}
                settings={pomodoroSettings}
                onClose={() => setShowPomodoroSettings(false)}
                onSave={async (newSettings) => {
                    console.log('[CalendarScreen] DEBUG: onSave called with:', JSON.stringify(newSettings));

                    let validSettings = { ...newSettings };

                    // Copy file to permanent storage if needed
                    if (newSettings.soundUri && newSettings.soundUri.startsWith('file://')) {
                        try {
                            // @ts-ignore
                            const docDir = FileSystem.documentDirectory;
                            if (docDir) {
                                const fileName = newSettings.soundUri.split('/').pop() || `alarm_${Date.now()}.mp3`;
                                const permanentUri = docDir + fileName;

                                if (newSettings.soundUri !== permanentUri) {
                                    console.log('[CalendarScreen] DEBUG: Copying file to permanent storage...');
                                    await FileSystem.copyAsync({
                                        from: newSettings.soundUri,
                                        to: permanentUri
                                    }).then(() => {
                                        validSettings.soundUri = permanentUri;
                                        console.log('[CalendarScreen] DEBUG: File copied successfully');
                                    }).catch(() => {
                                        validSettings.soundUri = permanentUri;
                                    });
                                }
                            }
                        } catch (err) {
                            console.error('[CalendarScreen] ERROR: File copy failed:', err);
                        }
                    }

                    setPomodoroSettings(validSettings);

                    // Persist to AsyncStorage
                    AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(validSettings))
                        .then(() => {
                            console.log('[CalendarScreen] DEBUG: Settings saved to AsyncStorage');
                        })
                        .catch(err => {
                            console.error('[CalendarScreen] ERROR: AsyncStorage save failed:', err);
                        });

                    setTimeout(() => setIsTimerActive(true), 500);
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    headerTitle: {
        fontSize: Typography.h2.fontSize,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    segmentContainer: {
        flexDirection: 'row',
        marginHorizontal: Spacing.lg,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: 4,
        marginBottom: Spacing.md,
    },
    segmentButton: {
        flex: 1,
        paddingVertical: Spacing.sm,
        alignItems: 'center',
        borderRadius: BorderRadius.sm,
    },
    segmentButtonActive: {
        backgroundColor: Colors.background,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 2,
    },
    segmentText: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.secondary,
        fontWeight: '500',
    },
    segmentTextActive: {
        color: Colors.text.primary,
        fontWeight: '600',
    },
    content: {
        paddingBottom: 100,
    },
    timerContainer: {
        flex: 1,
        backgroundColor: Colors.background,
    },
});


