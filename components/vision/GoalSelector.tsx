import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Goal {
    id: string;
    name: string;
    description?: string;
    status: 'core' | 'avoid';
}

interface GoalSelectorProps {
    coreGoals: Goal[];
    selectedGoalId: string | null;
    onSelect: (goalId: string) => void;
}

export default function GoalSelector({ coreGoals, selectedGoalId, onSelect }: GoalSelectorProps) {
    // Icon mapping for goals
    const iconMap: { [key: string]: string } = {
        'Excel at Work': '💼',
        'Learn Spanish': '🌍',
        'Fitness & Health': '❤️',
        '學測頂標': '📚',
        'Default': '🎯',
    };

    const getIcon = (goalName: string) => {
        return iconMap[goalName] || iconMap['Default'];
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>選擇目標進行拆解</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {coreGoals.map((goal) => {
                    const isSelected = goal.id === selectedGoalId;
                    return (
                        <TouchableOpacity
                            key={goal.id}
                            style={[styles.goalCard, isSelected && styles.goalCardSelected]}
                            onPress={() => onSelect(goal.id)}
                        >
                            <Text style={styles.goalIcon}>{getIcon(goal.name)}</Text>
                            <Text
                                style={[styles.goalName, isSelected && styles.goalNameSelected]}
                                numberOfLines={2}
                            >
                                {goal.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
        color: Colors.text.secondary,
        marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.md,
    },
    scrollContent: {
        paddingHorizontal: Spacing.md,
        gap: Spacing.md,
    },
    goalCard: {
        width: 120,
        height: 100,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border.default,
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    goalCardSelected: {
        borderWidth: 2,
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLight,
    },
    goalIcon: {
        fontSize: 32,
    },
    goalName: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
        textAlign: 'center',
    },
    goalNameSelected: {
        color: Colors.primary,
    },
});
