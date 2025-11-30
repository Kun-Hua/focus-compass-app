import Card from '@/components/ui/Card';
import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

interface UIGoal {
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
    goal: UIGoal;
    breakdown?: GoalPlan;
    onUpdate: (breakdown: GoalPlan) => void;
}

export default function GoalBreakdown({ goal, breakdown, onUpdate }: GoalBreakdownProps) {
    const [localPlan, setLocalPlan] = useState<GoalPlan>({
        goalId: goal.id,
        annualGoal: '',
        quarterlyGoal: '',
        monthlyGoal: '',
        weeklyGoal: '',
        weeklyCommitmentHours: 0,
    });

    useEffect(() => {
        if (breakdown) {
            setLocalPlan(breakdown);
        }
    }, [breakdown]);

    const handleChange = (field: keyof GoalPlan, value: string | number) => {
        const newPlan = { ...localPlan, [field]: value };
        setLocalPlan(newPlan);
        onUpdate(newPlan);
    };

    return (
        <View style={styles.container}>
            <Card style={styles.card}>
                <View style={styles.row}>
                    <View style={styles.column}>
                        <Text style={styles.label}>Annual Goal</Text>
                        <TextInput
                            style={styles.input}
                            value={localPlan.annualGoal}
                            onChangeText={(text) => handleChange('annualGoal', text)}
                            placeholder="What to achieve this year?"
                            placeholderTextColor={Colors.text.tertiary}
                            multiline
                        />
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                    <View style={styles.column}>
                        <Text style={styles.label}>Quarterly Goal</Text>
                        <TextInput
                            style={styles.input}
                            value={localPlan.quarterlyGoal}
                            onChangeText={(text) => handleChange('quarterlyGoal', text)}
                            placeholder="This quarter?"
                            placeholderTextColor={Colors.text.tertiary}
                            multiline
                        />
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                    <View style={styles.column}>
                        <Text style={styles.label}>Monthly Goal</Text>
                        <TextInput
                            style={styles.input}
                            value={localPlan.monthlyGoal}
                            onChangeText={(text) => handleChange('monthlyGoal', text)}
                            placeholder="This month?"
                            placeholderTextColor={Colors.text.tertiary}
                            multiline
                        />
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                    <View style={styles.column}>
                        <Text style={styles.label}>Weekly Goal</Text>
                        <TextInput
                            style={styles.input}
                            value={localPlan.weeklyGoal}
                            onChangeText={(text) => handleChange('weeklyGoal', text)}
                            placeholder="This week?"
                            placeholderTextColor={Colors.text.tertiary}
                            multiline
                        />
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                    <View style={styles.column}>
                        <Text style={styles.label}>Weekly Hours</Text>
                        <TextInput
                            style={styles.input}
                            value={localPlan.weeklyCommitmentHours.toString()}
                            onChangeText={(text) => {
                                const hours = parseFloat(text);
                                if (!isNaN(hours)) {
                                    handleChange('weeklyCommitmentHours', hours);
                                } else if (text === '') {
                                    handleChange('weeklyCommitmentHours', 0);
                                }
                            }}
                            placeholder="0"
                            placeholderTextColor={Colors.text.tertiary}
                            keyboardType="numeric"
                        />
                    </View>
                </View>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Spacing.md,
    },
    card: {
        padding: Spacing.md,
        backgroundColor: Colors.background,
    },
    row: {
        flexDirection: 'row',
        marginBottom: Spacing.sm,
    },
    column: {
        flex: 1,
    },
    label: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.secondary,
        marginBottom: 4,
        fontWeight: '600',
    },
    input: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.primary,
        padding: 0,
        minHeight: 24,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border.default,
        marginVertical: Spacing.md,
    },
});
