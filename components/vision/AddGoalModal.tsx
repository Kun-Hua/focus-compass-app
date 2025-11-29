import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface AddGoalModalProps {
    visible: boolean;
    onClose: () => void;
    onAdd: (name: string, category: 'Core' | 'Avoidance') => void;
}

export default function AddGoalModal({ visible, onClose, onAdd }: AddGoalModalProps) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState<'Core' | 'Avoidance'>('Core');

    const handleAdd = () => {
        if (name.trim()) {
            onAdd(name, category);
            setName('');
            setCategory('Core');
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>新增目標</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>目標名稱</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="例如：學測頂標、減重 5 公斤"
                            placeholderTextColor={Colors.text.tertiary}
                            value={name}
                            onChangeText={setName}
                            autoFocus
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>類別</Text>
                        <View style={styles.categoryContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.categoryButton,
                                    category === 'Core' && styles.categoryButtonActive,
                                ]}
                                onPress={() => setCategory('Core')}
                            >
                                <Text
                                    style={[
                                        styles.categoryText,
                                        category === 'Core' && styles.categoryTextActive,
                                    ]}
                                >
                                    核心目標 (Core)
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.categoryButton,
                                    category === 'Avoidance' && styles.categoryButtonActive,
                                ]}
                                onPress={() => setCategory('Avoidance')}
                            >
                                <Text
                                    style={[
                                        styles.categoryText,
                                        category === 'Avoidance' && styles.categoryTextActive,
                                    ]}
                                >
                                    避免清單 (Avoid)
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelText}>取消</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
                            <Text style={styles.addText}>新增</Text>
                        </TouchableOpacity>
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
        alignItems: 'center',
        padding: Spacing.xl,
    },
    container: {
        width: '100%',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
    },
    title: {
        fontSize: Typography.h2.fontSize,
        fontWeight: Typography.h2.fontWeight,
        color: Colors.text.primary,
        marginBottom: Spacing.lg,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.secondary,
        marginBottom: Spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.border.default,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: Typography.body.fontSize,
        color: Colors.text.primary,
    },
    categoryContainer: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    categoryButton: {
        flex: 1,
        paddingVertical: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border.default,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    categoryButtonActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    categoryText: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.secondary,
    },
    categoryTextActive: {
        color: Colors.surface,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: Spacing.md,
        marginTop: Spacing.sm,
    },
    cancelButton: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
    },
    cancelText: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.secondary,
    },
    addButton: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.md,
    },
    addText: {
        fontSize: Typography.body.fontSize,
        color: Colors.surface,
        fontWeight: '600',
    },
});
