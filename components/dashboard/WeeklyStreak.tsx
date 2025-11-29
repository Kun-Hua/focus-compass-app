import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface WeeklyStreakProps {
    streakWeeks: number;
    onTrack: boolean;
}

export default function WeeklyStreak({ streakWeeks, onTrack }: WeeklyStreakProps) {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Text style={styles.icon}>🔥</Text>
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.title}>{streakWeeks} Week Streak</Text>
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
        marginBottom: Spacing.lg,
        paddingHorizontal: 4,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF7ED', // Orange 50
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        fontSize: 20,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    status: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
    },
    onTrack: {
        color: Colors.success,
    },
    atRisk: {
        color: Colors.warning,
    },
});
