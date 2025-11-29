import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Task } from './TimeAxisCalendar';

type TimerMode = 'stopwatch' | 'pomodoro' | 'timelapse';

interface TimerModeModalProps {
    visible: boolean;
    task: Task | null;
    onClose: () => void;
    onSelectMode: (mode: TimerMode) => void;
}

export default function TimerModeModal({ visible, task, onClose, onSelectMode }: TimerModeModalProps) {
    if (!task) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.taskInfo}>
                            {task.isMIT && <Text style={styles.mitStar}>⭐</Text>}
                            <Text style={styles.taskName} numberOfLines={2}>
                                {task.name}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Goal Badge */}
                    <View style={[styles.goalBadge, { backgroundColor: `${task.goalColor}20` }]}>
                        <View style={[styles.goalDot, { backgroundColor: task.goalColor }]} />
                        <Text style={styles.goalText}>{task.goalName}</Text>
                    </View>

                    {/* Mode Selection */}
                    <Text style={styles.sectionTitle}>Select Timer Mode</Text>

                    <View style={styles.modesContainer}>
                        <TouchableOpacity
                            style={styles.modeButton}
                            onPress={() => onSelectMode('stopwatch')}
                        >
                            <Text style={styles.modeIcon}>⏱️</Text>
                            <Text style={styles.modeTitle}>Stopwatch</Text>
                            <Text style={styles.modeDesc}>Count up from 0</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modeButton}
                            onPress={() => onSelectMode('pomodoro')}
                        >
                            <Text style={styles.modeIcon}>🍅</Text>
                            <Text style={styles.modeTitle}>Pomodoro</Text>
                            <Text style={styles.modeDesc}>25 min sessions</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modeButton}
                            onPress={() => onSelectMode('timelapse')}
                        >
                            <Text style={styles.modeIcon}>⏳</Text>
                            <Text style={styles.modeTitle}>Timelapse</Text>
                            <Text style={styles.modeDesc}>Custom duration</Text>
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
    modal: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.xl,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: Spacing.lg,
    },
    taskInfo: {
        flex: 1,
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    mitStar: {
        fontSize: 20,
    },
    taskName: {
        flex: 1,
        fontSize: Typography.h2.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    closeButton: {
        padding: Spacing.sm,
        marginTop: -Spacing.sm,
        marginRight: -Spacing.sm,
    },
    closeIcon: {
        fontSize: 24,
        color: Colors.text.tertiary,
    },
    goalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        marginBottom: Spacing.xl,
        gap: Spacing.sm,
    },
    goalDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    goalText: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    sectionTitle: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
        color: Colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: Spacing.md,
    },
    modesContainer: {
        gap: Spacing.md,
    },
    modeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.sm,
        borderWidth: 2,
        borderColor: Colors.border.default,
        gap: Spacing.md,
    },
    modeIcon: {
        fontSize: 28,
    },
    modeTitle: {
        flex: 1,
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    modeDesc: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.secondary,
    },
});
