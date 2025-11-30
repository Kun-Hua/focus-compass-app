import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface WeeklyStreakProps {
    streak: number;
    onTrack: boolean;
}

export default function WeeklyStreak({ streak, onTrack }: WeeklyStreakProps) {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Text style={styles.icon}>🔥</Text>
            </View>
            <View style={styles.content}>
                <Text style={styles.streakNumber}>{streak} days</Text>
                <Text style={[styles.status, onTrack ? styles.onTrack : styles.atRisk]}>
                    {onTrack ? 'On Track' : 'At Risk'}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        backgroundColor: Colors.surface,
        padding: Spacing.lg,
        borderRadius: 12,
        marginBottom: Spacing.lg,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.warning + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        fontSize: 24,
    },
    content: {
        flex: 1,
    },
    streakNumber: {
        fontSize: Typography.h2.fontSize,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    status: {
        fontSize: Typography.small.fontSize,
        fontWeight: '600',
    },
    onTrack: {
        color: Colors.success,
    },
    atRisk: {
        color: Colors.error,
    },
});
