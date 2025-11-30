import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function WeekCalendar() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>This Week</Text>
            </View>
            <View style={styles.daysContainer}>
                {days.map((day, index) => (
                    <View key={day} style={[styles.dayItem, index === today && styles.dayItemActive]}>
                        <Text style={[styles.dayText, index === today && styles.dayTextActive]}>
                            {day}
                        </Text>
                        <View style={[styles.dot, index === today && styles.dotActive]} />
                    </View>
                ))}
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
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    daysContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayItem: {
        alignItems: 'center',
        padding: 4,
        borderRadius: 8,
    },
    dayItemActive: {
        backgroundColor: Colors.primary + '10',
    },
    dayText: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.secondary,
        marginBottom: 4,
    },
    dayTextActive: {
        color: Colors.primary,
        fontWeight: '600',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border.default,
    },
    dotActive: {
        backgroundColor: Colors.primary,
    },
});
