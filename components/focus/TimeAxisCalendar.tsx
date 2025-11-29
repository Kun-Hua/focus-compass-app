import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface Task {
    id: string;
    name: string;
    goalId: string;
    goalName: string;
    goalColor: string;
    startTime: string;
    duration: number;
    isMIT: boolean;
}

interface TimeAxisCalendarProps {
    tasks: Task[];
    onTaskPress: (task: Task) => void;
    onTimeSlotPress: (time: string) => void;
}

export default function TimeAxisCalendar({ tasks, onTaskPress, onTimeSlotPress }: TimeAxisCalendarProps) {
    // Generate time slots from 6 AM to 11 PM
    const timeSlots = [];
    for (let hour = 6; hour <= 23; hour++) {
        timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    }

    // Group tasks by time slot
    const getTasksForTime = (time: string) => {
        return tasks.filter(task => task.startTime === time);
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {timeSlots.map((time) => {
                const timeTasks = getTasksForTime(time);
                const hasAnyTask = timeTasks.length > 0;

                return (
                    <View key={time} style={styles.timeSlot}>
                        {/* Time Label */}
                        <View style={styles.timeLabel}>
                            <Text style={styles.timeText}>{time}</Text>
                        </View>

                        {/* Task Area */}
                        <TouchableOpacity
                            style={styles.taskArea}
                            onPress={() => !hasAnyTask && onTimeSlotPress(time)}
                            activeOpacity={hasAnyTask ? 1 : 0.7}
                        >
                            {hasAnyTask ? (
                                <View style={styles.tasksContainer}>
                                    {timeTasks.map((task) => (
                                        <TouchableOpacity
                                            key={task.id}
                                            style={[
                                                styles.taskCard,
                                                { borderLeftColor: task.goalColor, borderLeftWidth: 4 },
                                            ]}
                                            onPress={() => onTaskPress(task)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.taskHeader}>
                                                <Text style={styles.taskName} numberOfLines={1}>
                                                    {task.name}
                                                </Text>
                                                {task.isMIT && <Text style={styles.mitStar}>⭐</Text>}
                                            </View>
                                            <Text style={styles.goalName} numberOfLines={1}>
                                                {task.goalName}
                                            </Text>
                                            <Text style={styles.duration}>{task.duration} min</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : (
                                <View style={styles.emptySlot}>
                                    <Text style={styles.addTaskHint}>+</Text>
                                </View>
                            )}
                        </TouchableOpacity>
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
    timeSlot: {
        flexDirection: 'row',
        minHeight: 60,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
    },
    timeLabel: {
        width: 60,
        paddingTop: Spacing.sm,
        paddingRight: Spacing.sm,
    },
    timeText: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.tertiary,
        textAlign: 'right',
    },
    taskArea: {
        flex: 1,
        paddingVertical: Spacing.sm,
        paddingLeft: Spacing.md,
    },
    tasksContainer: {
        gap: Spacing.sm,
    },
    taskCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.sm,
        padding: Spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    taskHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    taskName: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
        flex: 1,
    },
    mitStar: {
        fontSize: 14,
        marginLeft: Spacing.sm,
    },
    goalName: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.secondary,
        marginBottom: 2,
    },
    duration: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.tertiary,
    },
    emptySlot: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 50,
    },
    addTaskHint: {
        fontSize: 24,
        color: Colors.border.default,
    },
});
