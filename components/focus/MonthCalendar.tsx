import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MonthCalendarProps {
    currentDate: Date;
    onMonthChange: (date: Date) => void;
}

export default function MonthCalendar({ currentDate, onMonthChange }: MonthCalendarProps) {
    const safeDate = currentDate || new Date();
    const monthName = safeDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const handlePrevMonth = () => {
        const newDate = new Date(safeDate);
        newDate.setMonth(newDate.getMonth() - 1);
        onMonthChange(newDate);
    };

    const handleNextMonth = () => {
        const newDate = new Date(safeDate);
        newDate.setMonth(newDate.getMonth() + 1);
        onMonthChange(newDate);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
                    <Text style={styles.navIcon}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.monthName}>{monthName}</Text>
                <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
                    <Text style={styles.navIcon}>›</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>Calendar View Coming Soon</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    monthName: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    navButton: {
        padding: Spacing.sm,
    },
    navIcon: {
        fontSize: 24,
        color: Colors.primary,
        fontWeight: 'bold',
    },
    placeholder: {
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.background,
        borderRadius: 8,
    },
    placeholderText: {
        color: Colors.text.tertiary,
    },
});
