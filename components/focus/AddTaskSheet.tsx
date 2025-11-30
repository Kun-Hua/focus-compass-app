import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Goal {
    id: string;
    name: string;
    color?: string;
}

interface AddTaskSheetProps {
    visible: boolean;
    onClose: () => void;
    onAdd: (task: { title: string; goalId: string; estimatedMinutes?: number }) => void;
    goals: Goal[];
}

export default function AddTaskSheet({ visible, onClose, onAdd, goals }: AddTaskSheetProps) {
    const [title, setTitle] = useState('');
    const [selectedGoalId, setSelectedGoalId] = useState<string>('');
    const [estimatedMinutes, setEstimatedMinutes] = useState('');

    const handleSave = () => {
        if (!title.trim()) return;
        if (!selectedGoalId && goals.length > 0) {
            // Select first goal by default if none selected
            setSelectedGoalId(goals[0].id);
        }

        onAdd({
            title: title.trim(),
            goalId: selectedGoalId || (goals.length > 0 ? goals[0].id : ''),
            estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : undefined,
        });

        // Reset form
        setTitle('');
        setEstimatedMinutes('');
        setSelectedGoalId('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>New Task</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Task Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="What do you want to focus on?"
                                placeholderTextColor={Colors.text.tertiary}
                                value={title}
                                onChangeText={setTitle}
                                autoFocus
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Link to Goal</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.goalsContainer}
                            >
                                {goals.map((goal) => (
                                    <TouchableOpacity
                                        key={goal.id}
                                        style={[
                                            styles.goalChip,
                                            selectedGoalId === goal.id && styles.goalChipSelected,
                                            { borderColor: goal.color || Colors.primary }
                                        ]}
                                        onPress={() => setSelectedGoalId(goal.id)}
                                    >
                                        <Text
                                            style={[
                                                styles.goalChipText,
                                                selectedGoalId === goal.id && styles.goalChipTextSelected,
                                                { color: selectedGoalId === goal.id ? Colors.surface : (goal.color || Colors.primary) }
                                            ]}
                                        >
                                            {goal.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Duration (minutes)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="25"
                                placeholderTextColor={Colors.text.tertiary}
                                value={estimatedMinutes}
                                onChangeText={setEstimatedMinutes}
                                keyboardType="numeric"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.saveButton, !title && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={!title}
                        >
                            <Text style={styles.saveButtonText}>Add Task</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: BorderRadius.lg,
        borderTopRightRadius: BorderRadius.lg,
        padding: Spacing.xl,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    title: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    closeIcon: {
        fontSize: 24,
        color: Colors.text.secondary,
        padding: Spacing.xs,
    },
    formGroup: {
        marginBottom: Spacing.xl,
    },
    label: {
        fontSize: Typography.small.fontSize,
        fontWeight: '600',
        color: Colors.text.secondary,
        marginBottom: Spacing.sm,
    },
    input: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: Typography.body.fontSize,
        color: Colors.text.primary,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    goalsContainer: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    goalChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        marginRight: Spacing.sm,
    },
    goalChipSelected: {
        backgroundColor: Colors.primary, // Will be overridden by inline style
    },
    goalChipText: {
        fontSize: Typography.small.fontSize,
        fontWeight: '600',
    },
    goalChipTextSelected: {
        color: Colors.surface,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveButtonText: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.surface,
    },
});
