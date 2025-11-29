import Card from '@/components/ui/Card';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

interface Goal {
    id: string;
    name: string;
    description?: string;
    status: 'core' | 'avoid';
}

export interface GoalPlan {
    goalId: string;
    annualGoal: string;
    quarterlyGoal: string;
    monthlyGoal: string;
    weeklyGoal: string;
    weeklyCommitmentHours: number;
}

interface GoalBreakdownProps {
    goal: Goal;
    breakdown?: GoalPlan;
    onUpdate: (goalId: string, breakdown: GoalPlan) => void;
}

export default function GoalBreakdown({ goal, breakdown, onUpdate }: GoalBreakdownProps) {
    const [annualGoal, setAnnualGoal] = useState(breakdown?.annualGoal || '');
    const [quarterlyGoal, setQuarterlyGoal] = useState(breakdown?.quarterlyGoal || '');
    const [monthlyGoal, setMonthlyGoal] = useState(breakdown?.monthlyGoal || '');
    const [weeklyGoal, setWeeklyGoal] = useState(breakdown?.weeklyGoal || '');
    const [weeklyCommitmentHours, setWeeklyCommitmentHours] = useState(
        breakdown?.weeklyCommitmentHours?.toString() || ''
    );

    // Sync state when breakdown or goal changes
    useEffect(() => {
        setAnnualGoal(breakdown?.annualGoal || '');
        setQuarterlyGoal(breakdown?.quarterlyGoal || '');
        setMonthlyGoal(breakdown?.monthlyGoal || '');
        setWeeklyGoal(breakdown?.weeklyGoal || '');
        setWeeklyCommitmentHours(breakdown?.weeklyCommitmentHours?.toString() || '');
    }, [breakdown, goal.id]);

    const handleUpdate = (field: keyof GoalPlan, value: string) => {
        const updatedBreakdown: GoalPlan = {
            goalId: goal.id,
            annualGoal: field === 'annualGoal' ? value : annualGoal,
            quarterlyGoal: field === 'quarterlyGoal' ? value : quarterlyGoal,
            monthlyGoal: field === 'monthlyGoal' ? value : monthlyGoal,
            weeklyGoal: field === 'weeklyGoal' ? value : weeklyGoal,
            weeklyCommitmentHours:
                field === 'weeklyCommitmentHours'
                    ? parseFloat(value) || 0
                    : parseFloat(weeklyCommitmentHours) || 0,
        };
        onUpdate(goal.id, updatedBreakdown);
    };

    const annualForecast = (parseFloat(weeklyCommitmentHours) || 0) * 52;

    return (
        <Card style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{goal.name}</Text>
                <Text style={styles.subtitle}>目標階梯拆解</Text>
            </View>

            {/* Annual Goal */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>年度目標</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="例如：達成 XXX 成就..."
                    placeholderTextColor={Colors.text.tertiary}
                    value={annualGoal}
                    onChangeText={(text) => {
                        setAnnualGoal(text);
                        handleUpdate('annualGoal', text);
                    }}
                    multiline
                    numberOfLines={3}
                />
            </View>

            {/* Quarterly Goal */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>季度目標</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="例如：本季完成 XXX..."
                    placeholderTextColor={Colors.text.tertiary}
                    value={quarterlyGoal}
                    onChangeText={(text) => {
                        setQuarterlyGoal(text);
                        handleUpdate('quarterlyGoal', text);
                    }}
                    multiline
                    numberOfLines={3}
                />
            </View>

            {/* Monthly Goal */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>月度目標</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="例如：本月達成 XXX..."
                    placeholderTextColor={Colors.text.tertiary}
                    value={monthlyGoal}
                    onChangeText={(text) => {
                        setMonthlyGoal(text);
                        handleUpdate('monthlyGoal', text);
                    }}
                    multiline
                    numberOfLines={3}
                />
            </View>

            {/* Weekly Goal */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>週目標</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="例如：本週完成 XXX..."
                    placeholderTextColor={Colors.text.tertiary}
                    value={weeklyGoal}
                    onChangeText={(text) => {
                        setWeeklyGoal(text);
                        handleUpdate('weeklyGoal', text);
                    }}
                    multiline
                    numberOfLines={3}
                />
            </View>

            {/* Weekly Commitment Hours */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>週承諾時數</Text>
                <View style={styles.commitmentRow}>
                    <TextInput
                        style={styles.numberInput}
                        placeholder="0"
                        placeholderTextColor={Colors.text.tertiary}
                        value={weeklyCommitmentHours}
                        onChangeText={(text) => {
                            setWeeklyCommitmentHours(text);
                            handleUpdate('weeklyCommitmentHours', text);
                        }}
                        keyboardType="decimal-pad"
                    />
                    <Text style={styles.unit}>小時/週</Text>
                </View>
                {annualForecast > 0 && (
                    <View style={styles.forecastContainer}>
                        <Text style={styles.forecastLabel}>年度時間複利：</Text>
                        <Text style={styles.forecastValue}>≈ {annualForecast.toFixed(0)} 小時/年</Text>
                    </View>
                )}
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Spacing.lg,
        gap: Spacing.lg,
    },
    header: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
        paddingBottom: Spacing.md,
    },
    title: {
        fontSize: Typography.h2.fontSize,
        fontWeight: Typography.h2.fontWeight,
        color: Colors.text.primary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.secondary,
    },
    inputGroup: {
        gap: Spacing.sm,
    },
    label: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    textInput: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border.default,
        borderRadius: BorderRadius.sm,
        padding: Spacing.md,
        fontSize: Typography.body.fontSize,
        color: Colors.text.primary,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    commitmentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    numberInput: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border.default,
        borderRadius: BorderRadius.sm,
        padding: Spacing.md,
        fontSize: Typography.body.fontSize,
        color: Colors.text.primary,
        width: 100,
        textAlign: 'center',
    },
    unit: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.secondary,
    },
    forecastContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primaryLight,
        padding: Spacing.md,
        borderRadius: BorderRadius.sm,
        marginTop: Spacing.sm,
    },
    forecastLabel: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.secondary,
        marginRight: Spacing.sm,
    },
    forecastValue: {
        fontSize: Typography.body.fontSize,
        fontWeight: '700',
        color: Colors.primary,
    },
});
