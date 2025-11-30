import { Colors, Typography } from '@/constants/DesignSystem';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

interface Task {
    id: string;
    title: string;
    goalName: string;
    startTime: string; // HH:mm
    duration: number; // minutes
    isMIT?: boolean;
    color?: string;
}

interface TimeAxisCalendarProps {
    tasks: Task[];
}

export default function TimeAxisCalendar({ tasks }: TimeAxisCalendarProps) {
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const getTaskStyle = (task: Task) => {
        const [h, m] = task.startTime.split(':').map(Number);
        const startMinutes = h * 60 + m;
        const top = startMinutes * 1; // 1px per minute
        const height = task.duration * 1;

        return {
            top,
            height,
            backgroundColor: (task.color || Colors.primary) + '20', // 20% opacity
            borderLeftColor: task.color || Colors.primary,
        };
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.timelineContainer}>
                    {/* Time Labels */}
                    <View style={styles.timeLabels}>
                        {hours.map((hour) => (
                            <View key={hour} style={styles.timeLabelContainer}>
                                <Text style={styles.timeLabel}>
                                    {hour.toString().padStart(2, '0')}:00
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Grid Lines */}
                    <View style={styles.gridContainer}>
                        {hours.map((hour) => (
                            <View key={hour} style={styles.gridLine} />
                        ))}

                        {/* Tasks */}
                        {tasks.map((task) => (
                            <View
                                key={task.id}
                                style={[styles.taskItem, getTaskStyle(task)]}
                            >
                                <View style={styles.taskHeader}>
                                    <Text style={styles.taskTitle} numberOfLines={1}>
                                        {task.title}
                                    </Text>
                                    {task.isMIT && <Text style={styles.mitStar}>★</Text>}
                                </View>
                                <Text style={styles.goalName} numberOfLines={1}>
                                    {task.goalName}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        overflow: 'hidden',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        height: 24 * 60, // 24 hours * 60 minutes * 1px/min
    },
    timelineContainer: {
        flexDirection: 'row',
        height: '100%',
    },
    timeLabels: {
        width: 50,
        borderRightWidth: 1,
        borderRightColor: Colors.border.default,
    },
    timeLabelContainer: {
        height: 60, // 1 hour
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 4,
    },
    timeLabel: {
        fontSize: 10,
        color: Colors.text.tertiary,
    },
    gridContainer: {
        flex: 1,
        position: 'relative',
    },
    gridLine: {
        height: 60,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default + '40', // lighter border
    },
    taskItem: {
        position: 'absolute',
        left: 4,
        right: 4,
        borderRadius: 4,
        borderLeftWidth: 4,
        padding: 4,
        justifyContent: 'center',
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    taskTitle: {
        fontSize: Typography.small.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
        flex: 1,
    },
    mitStar: {
        color: Colors.warning,
        fontSize: 12,
        marginLeft: 4,
    },
    goalName: {
        fontSize: 10,
        color: Colors.text.secondary,
    },
});
