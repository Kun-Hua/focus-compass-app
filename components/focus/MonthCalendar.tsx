import { Colors } from '@/constants/DesignSystem';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Task } from './TimeAxisCalendar';

/**
 * Props for the MonthCalendar component.
 */
interface MonthCalendarProps {
    /** List of tasks/events for the month */
    tasks: Task[];
    /** Callback when a task is pressed */
    onTaskPress: (task: Task) => void;
    /** Callback when a date cell is pressed */
    onDatePress: (date: Date) => void;
}

// Get screen dimensions for responsive sizing
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// Helper for viewport units
const vw = (value: number) => SCREEN_WIDTH * (value / 100);
const vh = (value: number) => SCREEN_HEIGHT * (value / 100);

export default function MonthCalendar({ tasks, onTaskPress, onDatePress }: MonthCalendarProps) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Build an array representing the calendar grid (7 columns, 5‑6 rows).
    const generateCalendarDays = () => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
        const days: (Date | null)[] = [];
        // Leading empty cells before the 1st of the month.
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }
        // Actual dates.
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(currentYear, currentMonth, i));
        }
        return days;
    };

    const calendarDays = generateCalendarDays();
    const todayStr = today.toDateString();

    // Simple filter – in a real app you would compare the task's date.
    const getTasksForDate = (date: Date) => {
        const dateStr = date.toDateString();
        return tasks.filter(task => dateStr === todayStr);
    };

    const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.navButton}>
                    <Text style={styles.navIcon}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.monthName}>{monthName}</Text>
                <TouchableOpacity style={styles.navButton}>
                    <Text style={styles.navIcon}>›</Text>
                </TouchableOpacity>
            </View>

            {/* Weekday row */}
            <View style={styles.weekdayRow}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                    <View key={idx} style={styles.weekdayCell}>
                        <Text style={styles.weekdayText}>{day}</Text>
                    </View>
                ))}
            </View>

            {/* Calendar grid */}
            <View style={styles.grid}>
                {calendarDays.map((date, idx) => {
                    if (!date) {
                        return <View key={`empty-${idx}`} style={styles.dayCell} />;
                    }
                    const isToday = date.toDateString() === todayStr;
                    const dayTasks = getTasksForDate(date);
                    return (
                        <TouchableOpacity
                            key={idx}
                            style={[styles.dayCell, isToday && styles.todayCell]}
                            onPress={() => onDatePress(date)}
                            activeOpacity={0.7}
                        >
                            {/* Date information – top left */}
                            <View style={styles.dateInfo}>
                                <Text style={styles.dayNumber}>{date.getDate()}</Text>
                                {/* Placeholder for secondary date (e.g., lunar calendar) */}
                                <Text style={styles.lunarText}>Lunar</Text>
                            </View>

                            {/* Events – stacked at the bottom */}
                            <View style={styles.eventsContainer}>
                                {dayTasks.slice(0, 4).map(task => (
                                    <View
                                        key={task.id}
                                        style={[
                                            styles.eventBar,
                                            { backgroundColor: task.goalColor || Colors.primary }
                                        ]}
                                        onTouchEnd={() => onTaskPress(task)}
                                    >
                                        <Text
                                            style={styles.eventBarText}
                                            numberOfLines={1}
                                            ellipsizeMode="tail"
                                        >
                                            {task.name}
                                        </Text>
                                    </View>
                                ))}
                                {dayTasks.length > 4 && (
                                    <Text style={styles.moreEventsText}>+{dayTasks.length - 4}</Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
    },
    navButton: {
        padding: 2,
    },
    navIcon: {
        fontSize: vw(4.5),
        color: Colors.text.primary,
    },
    monthName: {
        fontSize: vw(5),
        fontWeight: '600',
        color: Colors.text.primary,
    },
    weekdayRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
    },
    weekdayCell: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 1,
    },
    weekdayText: {
        fontSize: vw(3.5),
        fontWeight: '600',
        color: Colors.text.tertiary,
    },
    grid: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: `${100 / 7}%`,
        minHeight: vh(12),
        borderWidth: 1,
        borderColor: Colors.border.default,
        backgroundColor: Colors.surface,
        padding: 2,
        overflow: 'hidden',
    },
    todayCell: {
        borderColor: Colors.primary,
        borderWidth: 2,
    },
    dateInfo: {
        alignItems: 'flex-start',
        marginBottom: 2,
    },
    dayNumber: {
        fontSize: vw(4),
        fontWeight: '700',
        color: Colors.text.primary,
    },
    lunarText: {
        fontSize: vw(2.5),
        color: Colors.text.tertiary,
    },
    eventsContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    eventBar: {
        height: vh(2.8),
        marginBottom: 2,
        borderRadius: 4,
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    eventBarText: {
        color: '#FFFFFF',
        fontSize: vw(2.8),
        fontWeight: '500',
    },
    moreEventsText: {
        fontSize: vw(2.5),
        color: Colors.text.tertiary,
        textAlign: 'right',
        marginTop: 1,
    },
});
