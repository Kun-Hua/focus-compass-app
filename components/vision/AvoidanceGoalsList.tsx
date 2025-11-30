import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface UIGoal {
    id: string;
    name: string;
    description?: string;
    status: 'core' | 'avoid';
}

interface AvoidanceGoalsListProps {
    avoidGoals: UIGoal[];
    onGoalPress: (goal: UIGoal) => void;
}

export default function AvoidanceGoalsList({
    avoidGoals,
    onGoalPress,
}: AvoidanceGoalsListProps) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Avoidance Goals</Text>
            {avoidGoals.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No avoidance goals yet.</Text>
                </View>
            ) : (
                avoidGoals.map((goal) => (
                    <TouchableOpacity
                        key={goal.id}
                        style={styles.goalContainer}
                        onPress={() => onGoalPress(goal)}
                    >
                        <View style={styles.goalInfo}>
                            <Text style={styles.goalName}>{goal.name}</Text>
                            {goal.description && (
                                <Text style={styles.goalDescription}>{goal.description}</Text>
                            )}
                        </View>
                        <Text style={styles.avoidIcon}>🚫</Text>
                    </TouchableOpacity>
                ))
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: Spacing.md,
    },
    goalContainer: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border.default,
        padding: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
    },
    goalInfo: {
        flex: 1,
    },
    goalName: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    goalDescription: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.secondary,
    },
    avoidIcon: {
        fontSize: 20,
        marginLeft: Spacing.md,
    },
    emptyContainer: {
        padding: Spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.tertiary,
        textAlign: 'center',
    },
});
