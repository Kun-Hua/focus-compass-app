import Card from '@/components/ui/Card';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Goal {
    id: string;
    name: string;
    description?: string;
    status: 'core' | 'avoid';
}

interface CoreGoalsListProps {
    coreGoals: Goal[];
    avoidGoals: Goal[];
    onGoalPress?: (goal: Goal) => void;
}

export default function CoreGoalsList({ coreGoals, avoidGoals, onGoalPress }: CoreGoalsListProps) {
    return (
        <View style={styles.container}>
            {/* Core Top 5 Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Core Top 5</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{coreGoals.length}/5 Goals</Text>
                    </View>
                </View>

                <View style={styles.goalsList}>
                    {coreGoals.map((goal, index) => (
                        <GoalCard
                            key={goal.id}
                            goal={goal}
                            index={index}
                            type="core"
                            onPress={() => onGoalPress?.(goal)}
                        />
                    ))}

                    {coreGoals.length < 5 && (
                        <TouchableOpacity style={styles.addButton}>
                            <Text style={styles.addButtonText}>+ Add Goal</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Avoid List Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, styles.avoidTitle]}>Avoid List</Text>
                    <Text style={styles.avoidSubtitle}>Goals to ignore</Text>
                </View>

                <View style={styles.goalsList}>
                    {avoidGoals.map((goal, index) => (
                        <GoalCard
                            key={goal.id}
                            goal={goal}
                            index={index}
                            type="avoid"
                            onPress={() => onGoalPress?.(goal)}
                        />
                    ))}
                </View>
            </View>
        </View>
    );
}

// Goal Card Component
function GoalCard({
    goal,
    index,
    type,
    onPress
}: {
    goal: Goal;
    index: number;
    type: 'core' | 'avoid';
    onPress: () => void;
}) {
    const isCore = type === 'core';
    const iconMap: { [key: string]: string } = {
        'Excel at Work': '💼',
        'Learn Spanish': '🌍',
        'Fitness & Health': '❤️',
        'Start YouTube Channel': '🎥',
        'Learn Photography': '📷',
    };

    return (
        <TouchableOpacity onPress={onPress}>
            <Card
                style={[styles.goalCard, !isCore && styles.avoidGoalCard]}
                borderColor={isCore ? Colors.primary : undefined}
            >
                <View style={styles.goalCardContent}>
                    <View style={styles.dragHandle}>
                        <Text style={styles.dragHandleIcon}>☰</Text>
                    </View>
                    <View style={styles.goalIcon}>
                        <Text style={styles.goalIconText}>{iconMap[goal.name] || '🎯'}</Text>
                    </View>
                    <View style={styles.goalInfo}>
                        <Text style={[styles.goalName, !isCore && styles.avoidGoalName]}>
                            {goal.name}
                        </Text>
                        {goal.description && (
                            <Text style={styles.goalDescription}>{goal.description}</Text>
                        )}
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: Spacing.xxl,
    },
    section: {
        gap: Spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: Typography.h2.fontSize,
        fontWeight: Typography.h2.fontWeight,
        color: Colors.text.primary,
    },
    avoidTitle: {
        color: Colors.error,
    },
    avoidSubtitle: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.tertiary,
    },
    badge: {
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    badgeText: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
        color: Colors.primary,
    },
    goalsList: {
        gap: Spacing.md,
    },
    goalCard: {
        padding: 0,
    },
    avoidGoalCard: {
        opacity: 0.7,
    },
    goalCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    dragHandle: {
        width: 20,
        alignItems: 'center',
    },
    dragHandleIcon: {
        fontSize: 16,
        color: Colors.text.tertiary,
    },
    goalIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    goalIconText: {
        fontSize: 20,
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
    avoidGoalName: {
        color: Colors.text.secondary,
    },
    goalDescription: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.secondary,
    },
    addButton: {
        height: 48,
        borderRadius: BorderRadius.md,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: Colors.border.default,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.text.tertiary,
    },
});
