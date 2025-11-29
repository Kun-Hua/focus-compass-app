import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Goal {
    id: string;
    name: string;
    color: string;
}

interface AddTaskSheetProps {
    visible: boolean;
    onClose: () => void;
    onSave: (task: { name: string; goalId: string; isMIT: boolean; time: string }) => void;
    goals: Goal[];
    selectedTime: string;
}

export default function AddTaskSheet({ visible, onClose, onSave, goals, selectedTime }: AddTaskSheetProps) {
    const [taskName, setTaskName] = useState('');
    const [selectedGoalId, setSelectedGoalId] = useState(goals[0]?.id || '');
    const [isMIT, setIsMIT] = useState(false);

    const handleSave = () => {
        if (taskName.trim()) {
            onSave({
                name: taskName.trim(),
                goalId: selectedGoalId,
                isMIT,
                time: selectedTime,
            });
            // Reset form
            setTaskName('');
            setSelectedGoalId(goals[0]?.id || '');
            setIsMIT(false);
            onClose();
        }
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
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Add Task</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Time Display */}
                        <View style={styles.timeDisplay}>
                            <Text style={styles.timeLabel}>Time</Text>
                            <Text style={styles.timeValue}>{selectedTime}</Text>
                        </View>

                        {/* Task Name Input */}
                        <View style={styles.inputSection}>
                            <Text style={styles.label}>Task Name*</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 補習、Meeting、Gym"
                                value={taskName}
                                onChangeText={setTaskName}
                                autoFocus
                                placeholderTextColor={Colors.text.tertiary}
                            />
                        </View>

                        {/* Goal Selection */}
                        <View style={styles.inputSection}>
                            <Text style={styles.label}>Goal*</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.goalsContainer}>
                                    {goals.map((goal) => (
                                        <TouchableOpacity
                                            key={goal.id}
                                            style={[
                                                styles.goalOption,
                                                selectedGoalId === goal.id && styles.goalOptionActive,
                                                { borderColor: goal.color },
                                            ]}
                                            onPress={() => setSelectedGoalId(goal.id)}
                                        >
                                            <View style={[styles.goalDot, { backgroundColor: goal.color }]} />
                                            <Text
                                                style={[
                                                    styles.goalOptionText,
                                                    selectedGoalId === goal.id && styles.goalOptionTextActive,
                                                ]}
                                            >
                                                {goal.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>

                        {/* MIT Toggle */}
                        <TouchableOpacity
                            style={styles.mitToggle}
                            onPress={() => setIsMIT(!isMIT)}
                        >
                            <View style={styles.mitLeft}>
                                <Text style={styles.mitIcon}>⭐</Text>
                                <Text style={styles.mitLabel}>Mark as MIT (Most Important Task)</Text>
                            </View>
                            <View style={[styles.toggle, isMIT && styles.toggleActive]}>
                                <View style={[styles.toggleKnob, isMIT && styles.toggleKnobActive]} />
                            </View>
                        </TouchableOpacity>
                    </ScrollView>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[styles.saveButton, !taskName.trim() && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={!taskName.trim()}
                    >
                        <Text style={styles.saveButtonText}>Add Task</Text>
                    </TouchableOpacity>
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
        backgroundColor: Colors.surface,
        borderTopLeftRadius: BorderRadius.md * 2,
        borderTopRightRadius: BorderRadius.md * 2,
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
        fontSize: Typography.h2.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    closeIcon: {
        fontSize: 28,
        color: Colors.text.tertiary,
    },
    timeDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        backgroundColor: Colors.primaryLight,
        borderRadius: BorderRadius.sm,
        marginBottom: Spacing.xl,
    },
    timeLabel: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.secondary,
        marginRight: Spacing.md,
    },
    timeValue: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.primary,
    },
    inputSection: {
        marginBottom: Spacing.xl,
    },
    label: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
        color: Colors.text.secondary,
        marginBottom: Spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border.default,
        borderRadius: BorderRadius.sm,
        padding: Spacing.lg,
        fontSize: Typography.body.fontSize,
        color: Colors.text.primary,
    },
    goalsContainer: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    goalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.full,
        borderWidth: 2,
        backgroundColor: Colors.background,
        gap: Spacing.sm,
    },
    goalOptionActive: {
        backgroundColor: Colors.surface,
    },
    goalDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    goalOptionText: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    goalOptionTextActive: {
        color: Colors.text.primary,
    },
    mitToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.lg,
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.sm,
        marginBottom: Spacing.xl,
    },
    mitLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        flex: 1,
    },
    mitIcon: {
        fontSize: 20,
    },
    mitLabel: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    toggle: {
        width: 48,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.border.default,
        padding: 2,
        justifyContent: 'center',
    },
    toggleActive: {
        backgroundColor: Colors.primary,
    },
    toggleKnob: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.surface,
    },
    toggleKnobActive: {
        alignSelf: 'flex-end',
    },
    saveButton: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.sm,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: Colors.border.default,
    },
    saveButtonText: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.surface,
    },
});
