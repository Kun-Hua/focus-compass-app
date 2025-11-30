import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface GoalSelectorProps {
    goals: Array<{ id: string; name: string; color?: string }>;
    selectedGoalId: string | null;
    onSelect: (goalId: string) => void;
}

export default function GoalSelector({ goals, selectedGoalId, onSelect }: GoalSelectorProps) {
    if (goals.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No goals found. Add a goal in Vision tab first.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Select Goal</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {goals.map((goal) => (
                    <TouchableOpacity
                        key={goal.id}
                        style={[
                            styles.chip,
                            selectedGoalId === goal.id && styles.chipSelected,
                            { borderColor: goal.color || Colors.primary }
                        ]}
                        onPress={() => onSelect(goal.id)}
                    >
                        <Text
                            style={[
                                styles.chipText,
                                selectedGoalId === goal.id && styles.chipTextSelected,
                                { color: selectedGoalId === goal.id ? Colors.surface : (goal.color || Colors.primary) }
                            ]}
                        >
                            {goal.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: Typography.small.fontSize,
        fontWeight: '600',
        color: Colors.text.secondary,
        marginBottom: Spacing.sm,
    },
    scrollContent: {
        paddingRight: Spacing.xl,
    },
    chip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: Spacing.sm,
        backgroundColor: Colors.surface,
    },
    chipSelected: {
        backgroundColor: Colors.primary, // Will be overridden by inline style
    },
    chipText: {
        fontSize: Typography.body.fontSize,
        fontWeight: '500',
    },
    chipTextSelected: {
        color: Colors.surface,
    },
    emptyContainer: {
        padding: Spacing.md,
        alignItems: 'center',
    },
    emptyText: {
        color: Colors.text.tertiary,
        fontSize: Typography.small.fontSize,
    },
});
