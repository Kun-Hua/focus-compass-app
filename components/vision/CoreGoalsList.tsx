import GoalBreakdown from '@/components/vision/GoalBreakdown';
import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface UIGoal {
    id: string;
    name: string;
    description?: string;
    status: 'core' | 'avoid';
}

interface GoalPlan {
    goalId: string;
    annualGoal: string;
    quarterlyGoal: string;
    monthlyGoal: string;
    weeklyGoal: string;
    weeklyCommitmentHours: number;
}

interface CoreGoalsListProps {
    coreGoals: UIGoal[];
    goalBreakdowns: Map<string, GoalPlan>;
    onGoalPress: (goal: UIGoal) => void;
    onBreakdownUpdate: (goalId: string, breakdown: GoalPlan) => void;
}

export default function CoreGoalsList({
    coreGoals,
    goalBreakdowns,
    onGoalPress,
    onBreakdownUpdate,
}: CoreGoalsListProps) {
    const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

    const toggleGoal = (goalId: string) => {
        setExpandedGoalId(expandedGoalId === goalId ? null : goalId);
    };

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Core Goals</Text>
            {coreGoals.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No core goals yet. Add one to get started!</Text>
                </View>
            ) : (
                coreGoals.map((goal) => (
                    <View key={goal.id} style={styles.goalContainer}>
                        <TouchableOpacity
                            style={styles.goalHeader}
                            onPress={() => toggleGoal(goal.id)}
                        >
                            <View style={styles.goalInfo}>
                                <Text style={styles.goalName}>{goal.name}</Text>
                                {goal.description && (
                                    <Text style={styles.goalDescription}>{goal.description}</Text>
                                )}
                            </View>
                            <Text style={styles.expandIcon}>
                                {expandedGoalId === goal.id ? '▼' : '▶'}
                            </Text>
                        </TouchableOpacity>

                        {expandedGoalId === goal.id && (
                            <GoalBreakdown
                                goal={goal}
                                breakdown={goalBreakdowns.get(goal.id)}
                                onUpdate={(breakdown) => onBreakdownUpdate(goal.id, breakdown)}
                            />
                        )}
                    </View>
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
        overflow: 'hidden',
    },
    goalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
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
    expandIcon: {
        fontSize: 12,
        color: Colors.text.tertiary,
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
