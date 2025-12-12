import AddTodoModal from '@/components/calendar/AddTodoModal';
import CalendarView from '@/components/calendar/CalendarView';
import FocusHistory from '@/components/calendar/FocusHistory';
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
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
        setTimeout(() => setIsTimerActive(true), 100);
    };

    const handleTimerComplete = (duration: number) => {
        setSessionDuration(duration);
        setIsTimerActive(false);
        setShowInterruption(true);
    };

    const handleSaveSession = async (data: { interruptionReason: string | null; interruptionCount: number }) => {
        if (!user || !activeTodo) return;
        try {
            const minutes = Math.floor(sessionDuration / 60);
            await focusApi.create({
                user_id: user.id,
                goal_id: activeTodo.goal_id || '',
                duration_minutes: minutes,
                honesty_mode: false,
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

                            <FocusHistory sessions={history} />
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
                honestyMode={false}
                onSave={handleSaveSession}
                onCancel={() => setShowInterruption(false)}
            />

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
    timerContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.background,
    },
    headerTitle: {
        fontSize: Typography.h2.fontSize,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    segmentContainer: {
        flexDirection: 'row',
        marginHorizontal: Spacing.lg,
        padding: 4,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border.default,
        marginBottom: Spacing.sm,
    },
    segmentButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: BorderRadius.md,
    },
    segmentButtonActive: {
        backgroundColor: Colors.primary,
    },
    segmentText: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.secondary,
        fontWeight: '600',
    },
    segmentTextActive: {
        color: '#FFFFFF',
    },
    content: {
        paddingHorizontal: Spacing.md,
        paddingBottom: 100,
    },
});
