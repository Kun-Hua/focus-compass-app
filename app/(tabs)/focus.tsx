import AddTaskSheet from '@/components/focus/AddTaskSheet';
import MonthCalendar from '@/components/focus/MonthCalendar';
import TimeAxisCalendar, { Task } from '@/components/focus/TimeAxisCalendar';
import TimerModeModal from '@/components/focus/TimerModeModal';
import TimerView from '@/components/focus/TimerView';
import ViewSwitcher from '@/components/focus/ViewSwitcher';
import WeekCalendar from '@/components/focus/WeekCalendar';
import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { useAuth } from '@/core/context/AuthContext';
import { focusApi } from '@/core/services/focusApi';
import { goalsApi } from '@/core/services/goalsApi';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ViewMode = 'day' | 'week' | 'month';

export default function FocusScreen() {
    const router = useRouter();
    const [currentView, setCurrentView] = useState<ViewMode>('day');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [timerModalVisible, setTimerModalVisible] = useState(false);
    const [addTaskSheetVisible, setAddTaskSheetVisible] = useState(false);
    const [selectedTime, setSelectedTime] = useState('');

    const [activeSession, setActiveSession] = useState<{
        task: Task;
        mode: 'stopwatch' | 'pomodoro' | 'timelapse';
    } | null>(null);

    const { user } = useAuth();
    const [coreGoals, setCoreGoals] = useState<{ id: string; name: string; color: string }[]>([]);

    // Load goals
    useEffect(() => {
        if (user) {
            loadGoals();
        }
    }, [user]);

    const loadGoals = async () => {
        if (!user) return;
        try {
            const goals = await goalsApi.getCoreGoals(user.id);
            setCoreGoals(goals.map(g => ({
                id: g.goal_id,
                name: g.goal_name,
                color: '#3B82F6', // TODO: Add color to Goal table or logic
            })));
        } catch (error) {
            console.error('Failed to load goals:', error);
        }
    };

    const handleTimerComplete = async (duration: number) => {
        if (!user || !activeSession) return;

        try {
            await focusApi.createSession({
                user_id: user.id,
                goal_id: activeSession.task.goalId,
                duration_minutes: Math.ceil(duration / 60),
                mode: activeSession.mode === 'stopwatch' ? 'Stopwatch' :
                    activeSession.mode === 'timelapse' ? 'Timelapse' : 'Pomodoro',
                honesty_mode: true, // Default to true for now
                interruption_count: 0,
            });
            // Alert.alert('專注完成', '紀錄已儲存！'); // Optional feedback
        } catch (error) {
            console.error('Failed to save session:', error);
        }
    };

    // Mock tasks (Keep mock tasks for now, as we don't have a tasks table yet)
    const [tasks, setTasks] = useState<Task[]>([
        {
            id: '1',
            name: '補習',
            goalId: '1',
            goalName: '學測頂標',
            goalColor: '#3B82F6',
            startTime: '09:00',
            duration: 120,
            isMIT: true,
        },
    ]);

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
    });

    const handleTaskPress = (task: Task) => {
        setSelectedTask(task);
        setTimerModalVisible(true);
    };

    const handleTimeSlotPress = (time: string) => {
        setSelectedTime(time);
        setAddTaskSheetVisible(true);
    };

    const handleSelectTimerMode = (mode: 'stopwatch' | 'pomodoro' | 'timelapse') => {
        setTimerModalVisible(false);
        if (selectedTask) {
            setActiveSession({ task: selectedTask, mode });
        }
    };

    const handleSaveTask = (taskData: { name: string; goalId: string; isMIT: boolean; time: string }) => {
        const selectedGoal = coreGoals.find(g => g.id === taskData.goalId);
        if (!selectedGoal) return;

        const newTask: Task = {
            id: Date.now().toString(),
            name: taskData.name,
            goalId: taskData.goalId,
            goalName: selectedGoal.name,
            goalColor: selectedGoal.color,
            startTime: taskData.time,
            duration: 60,
            isMIT: taskData.isMIT,
        };

        setTasks([...tasks, newTask]);
        setAddTaskSheetVisible(false);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.title}>Focus</Text>
                        <Text style={styles.date}>{currentDate}</Text>
                    </View>
                </View>
                <ViewSwitcher currentView={currentView} onViewChange={setCurrentView} />
            </View>

            {currentView === 'day' && (
                <TimeAxisCalendar
                    tasks={tasks}
                    onTaskPress={handleTaskPress}
                    onTimeSlotPress={handleTimeSlotPress}
                />
            )}

            {currentView === 'week' && (
                <WeekCalendar
                    tasks={tasks}
                    onTaskPress={handleTaskPress}
                    onDatePress={(date) => console.log('Date pressed:', date)}
                />
            )}

            {currentView === 'month' && (
                <MonthCalendar
                    tasks={tasks}
                    onTaskPress={handleTaskPress}
                    onDatePress={(date) => console.log('Date pressed:', date)}
                />
            )}

            <TimerModeModal
                visible={timerModalVisible}
                task={selectedTask}
                onClose={() => setTimerModalVisible(false)}
                onSelectMode={handleSelectTimerMode}
            />

            <AddTaskSheet
                visible={addTaskSheetVisible}
                onClose={() => setAddTaskSheetVisible(false)}
                onSave={handleSaveTask}
                goals={coreGoals}
                selectedTime={selectedTime}
            />

            {activeSession && (
                <TimerView
                    task={activeSession.task}
                    mode={activeSession.mode}
                    onClose={() => setActiveSession(null)}
                    onComplete={handleTimerComplete}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
        gap: Spacing.md,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: Typography.h1.fontSize,
        fontWeight: Typography.h1.fontWeight,
        color: Colors.text.primary,
        lineHeight: Typography.h1.lineHeight,
        marginBottom: 4,
    },
    date: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.secondary,
    },
});
