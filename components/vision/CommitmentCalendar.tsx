import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Task {
    id: string;
    name: string;
    goalColor: string;
    isMIT?: boolean;
}

interface CalendarDay {
    date: number;
    isToday: boolean;
    tasks: Task[];
}

interface CommitmentCalendarProps {
    month: number;
    year: number;
    days: CalendarDay[];
    onDatePress: (date: number) => void;
    onMonthChange: (direction: 'prev' | 'next') => void;
}

export default function CommitmentCalendar({
    month,
    year,
    days,
    onDatePress,
    onMonthChange,
}: CommitmentCalendarProps) {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <View style={styles.container}>
            {/* Header with Month/Year Selector */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => onMonthChange('prev')} style={styles.navButton}>
                    <Text style={styles.navIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.monthYear}>
                    {monthNames[month]} {year}
                </Text>
                <TouchableOpacity onPress={() => onMonthChange('next')} style={styles.navButton}>
                    <Text style={styles.navIcon}>→</Text>
                </TouchableOpacity>
            </View>

            {/* Weekday Labels */}
            <View style={styles.weekdayRow}>
                {weekdays.map((day) => (
                    <View key={day} style={styles.weekdayCell}>
                        <Text style={styles.weekdayText}>{day}</Text>
                    </View>
                ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.grid}>
                {days.map((day, index) => (
                    <CalendarCell
                        key={index}
                        day={day}
                        onPress={() => onDatePress(day.date)}
                    />
                ))}
            </View>
        </View>
    );
}

// Calendar Cell Component
function CalendarCell({ day, onPress }: { day: CalendarDay; onPress: () => void }) {
    const hasMIT = day.tasks.some((task) => task.isMIT);
    const visibleTasks = day.tasks.slice(0, 3);
    const extraTasksCount = Math.max(0, day.tasks.length - 3);

    return (
        <TouchableOpacity
            style={[
                styles.cell,
                day.isToday && styles.cellToday,
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Date Number */}
            <Text style={[styles.dateNumber, day.isToday && styles.dateNumberToday]}>
                {day.date}
            </Text>

            {/* MIT Star */}
            {hasMIT && (
                <View style={styles.mitStar}>
                    <Text style={styles.mitStarIcon}>⭐</Text>
                </View>
            )}

            {/* Task Dots */}
            {day.tasks.length > 0 && (
                <View style={styles.taskDots}>
                    {visibleTasks.map((task, index) => (
                        <View
                            key={task.id}
                            style={[
                                styles.taskDot,
                                { backgroundColor: task.goalColor },
                            ]}
                        />
                    ))}
                    {extraTasksCount > 0 && (
                        <Text style={styles.extraTasksText}>+{extraTasksCount}</Text>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    navButton: {
        padding: Spacing.sm,
    },
    navIcon: {
        fontSize: 20,
        color: Colors.text.primary,
    },
    monthYear: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    weekdayRow: {
        flexDirection: 'row',
        marginBottom: Spacing.sm,
    },
    weekdayCell: {
        flex: 1,
        alignItems: 'center',
    },
    weekdayText: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.tertiary,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 2,
    },
    cell: {
        width: '13.5%',
        aspectRatio: 1,
        backgroundColor: Colors.background,
        borderRadius: 4,
        padding: 4,
        position: 'relative',
    },
    cellToday: {
        backgroundColor: Colors.primaryLight,
    },
    dateNumber: {
        fontSize: 14,
        fontWeight: '400',
        color: Colors.text.primary,
    },
    dateNumberToday: {
        fontWeight: '700',
        color: Colors.primary,
    },
    mitStar: {
        position: 'absolute',
        top: 2,
        right: 2,
    },
    mitStarIcon: {
        fontSize: 12,
    },
    taskDots: {
        position: 'absolute',
        bottom: 4,
        left: 4,
        right: 4,
        flexDirection: 'row',
        gap: 2,
        alignItems: 'center',
    },
    taskDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    extraTasksText: {
        fontSize: 8,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
});
