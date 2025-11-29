import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Task } from './TimeAxisCalendar';

interface WeekCalendarProps {
    tasks: Task[];
    onTaskPress: (task: Task) => void;
    onDatePress: (date: Date) => void;
}

export default function WeekCalendar({ tasks, onTaskPress, onDatePress }: WeekCalendarProps) {
    const scrollViewRef = useRef<ScrollView>(null);

    // 獲取本週的 7 天
    const getWeekDays = () => {
        const today = new Date();
        const currentDay = today.getDay(); // 0 = Sunday
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + mondayOffset + i);
            days.push(date);
        }
        return days;
    };

    const weekDays = getWeekDays();
    const today = new Date().toDateString();
    const todayIndex = weekDays.findIndex(day => day.toDateString() === today);

    // 自動滾動到今天
    useEffect(() => {
        if (todayIndex >= 0 && scrollViewRef.current) {
            // 延遲一點讓組件渲染完成
            setTimeout(() => {
                const scrollPosition = Math.max(0, (todayIndex - 1) * (130)); // 130 = width + gap
                scrollViewRef.current?.scrollTo({ x: scrollPosition, animated: true });
            }, 100);
        }
    }, [todayIndex]);

    const getTasksForDate = (date: Date) => {
        const dateStr = date.toDateString();
        return tasks.filter(task => {
            // 簡化比對：假設所有 tasks 都是今天的
            return dateStr === today;
        });
    };

    return (
        <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
        >
            {weekDays.map((date, index) => {
                const isToday = date.toDateString() === today;
                const dayTasks = getTasksForDate(date);
                const weekdayShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index];

                return (
                    <View
                        key={index}
                        style={[styles.dayColumn, isToday && styles.todayColumn]}
                    >
                        {/* Header */}
                        <View style={styles.dayHeader}>
                            <Text style={[styles.weekday, isToday && styles.todayText]}>{weekdayShort}</Text>
                            <View style={[styles.dateCircle, isToday && styles.todayCircle]}>
                                <Text style={[styles.dateNumber, isToday && styles.todayDateNumber]}>
                                    {date.getDate()}
                                </Text>
                            </View>
                        </View>

                        {/* Tasks */}
                        <ScrollView style={styles.tasksScrollView} showsVerticalScrollIndicator={false}>
                            <View style={styles.tasksContainer}>
                                {dayTasks.length > 0 ? (
                                    dayTasks.map((task) => (
                                        <TouchableOpacity
                                            key={task.id}
                                            style={[styles.taskCard, { borderLeftColor: task.goalColor, borderLeftWidth: 3 }]}
                                            onPress={() => onTaskPress(task)}
                                        >
                                            <Text style={styles.taskTime}>{task.startTime}</Text>
                                            <Text style={styles.taskName} numberOfLines={2}>
                                                {task.name}
                                            </Text>
                                            {task.isMIT && <Text style={styles.mitStar}>⭐</Text>}
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <TouchableOpacity
                                        style={styles.emptyDay}
                                        onPress={() => onDatePress(date)}
                                    >
                                        <Text style={styles.addIcon}>+</Text>
                                        <Text style={styles.emptyText}>Add task</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </ScrollView>
                    </View>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.lg,
        gap: 10,
    },
    dayColumn: {
        width: 120,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    todayColumn: {
        borderColor: Colors.primary,
        borderWidth: 2,
        backgroundColor: Colors.primaryLight,
    },
    dayHeader: {
        alignItems: 'center',
        marginBottom: Spacing.md,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
    },
    weekday: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.secondary,
        marginBottom: 4,
        fontWeight: '600',
    },
    todayText: {
        color: Colors.primary,
        fontWeight: '700',
    },
    dateCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    todayCircle: {
        backgroundColor: Colors.primary,
    },
    dateNumber: {
        fontSize: Typography.body.fontSize,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    todayDateNumber: {
        color: Colors.surface,
    },
    tasksScrollView: {
        flex: 1,
    },
    tasksContainer: {
        gap: Spacing.sm,
    },
    taskCard: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.sm,
        padding: Spacing.sm,
    },
    taskTime: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.tertiary,
        marginBottom: 2,
    },
    taskName: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 2,
    },
    mitStar: {
        fontSize: 12,
    },
    emptyDay: {
        paddingVertical: Spacing.xl,
        alignItems: 'center',
    },
    addIcon: {
        fontSize: 32,
        color: Colors.text.tertiary,
        marginBottom: 4,
    },
    emptyText: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.tertiary,
    },
});
