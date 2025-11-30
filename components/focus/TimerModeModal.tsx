import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TimerModeModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectMode: (mode: 'Pomodoro' | 'Stopwatch' | 'Timelapse') => void;
    currentMode: 'Pomodoro' | 'Stopwatch' | 'Timelapse';
}

export default function TimerModeModal({
    visible,
    onClose,
    onSelectMode,
    currentMode,
}: TimerModeModalProps) {
    const modes = [
        { id: 'Pomodoro', label: 'Pomodoro', icon: '⏱️', desc: '25m focus, 5m break' },
        { id: 'Stopwatch', label: 'Stopwatch', icon: '⏱️', desc: 'Count up timer' },
        { id: 'Timelapse', label: 'Timelapse', icon: '📷', desc: 'Record your session' },
    ] as const;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Select Timer Mode</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {modes.map((mode) => (
                        <TouchableOpacity
                            key={mode.id}
                            style={[
                                styles.modeItem,
                                currentMode === mode.id && styles.modeItemActive,
                            ]}
                            onPress={() => {
                                onSelectMode(mode.id);
                                onClose();
                            }}
                        >
                            <Text style={styles.modeIcon}>{mode.icon}</Text>
                            <View style={styles.modeInfo}>
                                <Text style={[
                                    styles.modeLabel,
                                    currentMode === mode.id && styles.modeLabelActive
                                ]}>
                                    {mode.label}
                                </Text>
                                <Text style={styles.modeDesc}>{mode.desc}</Text>
                            </View>
                            {currentMode === mode.id && (
                                <Text style={styles.checkIcon}>✓</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
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
    modalContent: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    closeIcon: {
        fontSize: 20,
        color: Colors.text.secondary,
        padding: 4,
    },
    modeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    modeItemActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '10',
    },
    modeIcon: {
        fontSize: 24,
        marginRight: Spacing.md,
    },
    modeInfo: {
        flex: 1,
    },
    modeLabel: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    modeLabelActive: {
        color: Colors.primary,
    },
    modeDesc: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.secondary,
    },
    checkIcon: {
        fontSize: 20,
        color: Colors.primary,
        fontWeight: 'bold',
    },
});
