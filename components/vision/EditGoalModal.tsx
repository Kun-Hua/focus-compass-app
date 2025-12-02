import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { goalPlansApi } from '@/services/goalPlansApi';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface EditGoalModalProps {
    visible: boolean;
    goal: { id: string; name: string; description?: string } | null;
    userId: string | null;
    onClose: () => void;
    onSave: (goalId: string, updates: { name: string; description?: string }) => Promise<void>;
    onDelete: (goalId: string) => Promise<void>;
}

export default function EditGoalModal({ visible, goal, userId, onClose, onSave, onDelete }: EditGoalModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [annualGoal, setAnnualGoal] = useState('');
    const [quarterlyGoal, setQuarterlyGoal] = useState('');
    const [monthlyGoal, setMonthlyGoal] = useState('');
    const [weeklyGoal, setWeeklyGoal] = useState('');
    const [weeklyCommitmentHours, setWeeklyCommitmentHours] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadGoalData = async () => {
            if (goal && userId) {
                setName(goal.name);
                setDescription(goal.description || '');

                // Load goal plan data
                try {
                    const plans = await goalPlansApi.getAll(userId);
                    const plan = plans.find((p: any) => p.goal_id === goal.id);
                    if (plan) {
                        setAnnualGoal(plan.annual_goal || '');
                        setQuarterlyGoal(plan.quarterly_goal || '');
                        setMonthlyGoal(plan.monthly_goal || '');
                        setWeeklyGoal(plan.weekly_goal || '');
                        setWeeklyCommitmentHours(plan.weekly_commitment_hours?.toString() || '');
                    } else {
                        // Reset plan fields if no plan exists
                        setAnnualGoal('');
                        setQuarterlyGoal('');
                        setMonthlyGoal('');
                        setWeeklyGoal('');
                        setWeeklyCommitmentHours('');
                    }
                } catch (error) {
                    console.error('Failed to load goal plan:', error);
                }
            }
        };
        loadGoalData();
    }, [goal, userId]);

    const handleSave = async () => {
        if (!name.trim() || !goal || !userId) return;
        setLoading(true);
        try {
            // Save goal name and description
            await onSave(goal.id, { name, description });

            // Save goal plan data
            const hours = parseFloat(weeklyCommitmentHours) || 0;
            await goalPlansApi.upsert(goal.id, userId, {
                annual_goal: annualGoal,
                quarterly_goal: quarterlyGoal,
                monthly_goal: monthlyGoal,
                weekly_goal: weeklyGoal,
                weekly_commitment_hours: hours,
            });

            onClose();
        } catch (error) {
            console.error('Failed to save goal:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!goal) return;
        setLoading(true);
        try {
            await onDelete(goal.id);
            onClose();
        } catch (error) {
            console.error('Failed to delete goal:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Edit Goal</Text>

                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Goal Name</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter goal name"
                                placeholderTextColor={Colors.text.tertiary}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Description (Optional)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Enter description"
                                placeholderTextColor={Colors.text.tertiary}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Annual Goal (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={annualGoal}
                                onChangeText={setAnnualGoal}
                                placeholder="e.g., Master React Native"
                                placeholderTextColor={Colors.text.tertiary}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Quarterly Goal (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={quarterlyGoal}
                                onChangeText={setQuarterlyGoal}
                                placeholder="e.g., Complete 3 projects"
                                placeholderTextColor={Colors.text.tertiary}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Monthly Goal (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={monthlyGoal}
                                onChangeText={setMonthlyGoal}
                                placeholder="e.g., Build 1 feature"
                                placeholderTextColor={Colors.text.tertiary}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Weekly Goal (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={weeklyGoal}
                                onChangeText={setWeeklyGoal}
                                placeholder="e.g., Study 10 hours"
                                placeholderTextColor={Colors.text.tertiary}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Weekly Commitment Hours (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={weeklyCommitmentHours}
                                onChangeText={setWeeklyCommitmentHours}
                                placeholder="e.g., 10"
                                placeholderTextColor={Colors.text.tertiary}
                                keyboardType="numeric"
                            />
                        </View>
                    </ScrollView>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.deleteButton]}
                            onPress={handleDelete}
                            disabled={loading}
                        >
                            <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>

                        <View style={styles.rightActions}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={onClose}
                                disabled={loading}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.saveButton]}
                                onPress={handleSave}
                                disabled={loading || !name.trim()}
                            >
                                {loading ? (
                                    <ActivityIndicator color={Colors.surface} size="small" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    container: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: Spacing.xl,
        maxHeight: '80%',
    },
    scrollView: {
        maxHeight: 400,
    },
    title: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: Spacing.xl,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.secondary,
        marginBottom: Spacing.xs,
    },
    input: {
        backgroundColor: Colors.background,
        borderRadius: 8,
        padding: Spacing.md,
        fontSize: Typography.body.fontSize,
        color: Colors.text.primary,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: Spacing.md,
    },
    rightActions: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    button: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: Colors.background,
    },
    cancelButtonText: {
        color: Colors.text.primary,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: Colors.primary,
    },
    saveButtonText: {
        color: Colors.surface,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: Colors.error + '20',
    },
    deleteButtonText: {
        color: Colors.error,
        fontWeight: '600',
    },
});
