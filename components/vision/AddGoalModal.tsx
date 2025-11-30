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

interface AddGoalModalProps {
    visible: boolean;
    onClose: () => void;
    onAdd: (goal: { name: string; description?: string; type: 'core' | 'avoid' }) => void;
}

export default function AddGoalModal({ visible, onClose, onAdd }: AddGoalModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'core' | 'avoid'>('core');

    const handleSave = () => {
        if (!name.trim()) return;
        onAdd({
            name: name.trim(),
            description: description.trim() || undefined,
            type,
        });
        setName('');
        setDescription('');
        setType('core');
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
                        <Text style={styles.title}>New Goal</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Goal Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="What do you want to achieve?"
                                placeholderTextColor={Colors.text.tertiary}
                                value={name}
                                onChangeText={setName}
                                autoFocus
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Description (Optional)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Add some details..."
                                placeholderTextColor={Colors.text.tertiary}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Goal Type</Text>
                            <View style={styles.typeContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.typeButton,
                                        type === 'core' && styles.typeButtonActive,
                                    ]}
                                    onPress={() => setType('core')}
                                >
                                    <Text
                                        style={[
                                            styles.typeButtonText,
                                            type === 'core' && styles.typeButtonTextActive,
                                        ]}
                                    >
                                        Core Goal
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.typeButton,
                                        type === 'avoid' && styles.typeButtonActive,
                                    ]}
                                    onPress={() => setType('avoid')}
                                >
                                    <Text
                                        style={[
                                            styles.typeButtonText,
                                            type === 'avoid' && styles.typeButtonTextActive,
                                        ]}
                                    >
                                        Avoidance Goal
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveButton, !name && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={!name}
                        >
                            <Text style={styles.saveButtonText}>Create Goal</Text>
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
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    typeContainer: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    typeButton: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border.default,
        alignItems: 'center',
    },
    typeButtonActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    typeButtonText: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.secondary,
    },
    typeButtonTextActive: {
        color: Colors.surface,
        fontWeight: '600',
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
