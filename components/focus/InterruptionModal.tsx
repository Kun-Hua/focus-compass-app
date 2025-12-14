import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { formatDuration } from '../../utils/time';

const INTERRUPTION_REASONS = [
    { id: 'social_media', label: '社群媒體', icon: '📱' },
    { id: 'notification', label: '通知', icon: '🔔' },
    { id: 'colleague', label: '同事', icon: '👥' },
    { id: 'family', label: '家人', icon: '👪' },
    { id: 'fatigue', label: '疲勞', icon: '😴' },
    { id: 'hunger', label: '飢餓', icon: '🍽️' },
    { id: 'daydreaming', label: '放空', icon: '💭' },
    { id: 'other', label: '其他', icon: '❓' },
];

interface InterruptionModalProps {
    visible: boolean;
    durationSeconds: number;
    goalName: string;
    honestyMode: boolean;
    onSave: (data: { interruptionReason: string | null; interruptionCount: number }) => void;
    onCancel: () => void;
}

export default function InterruptionModal({
    visible,
    durationSeconds,
    goalName,
    honestyMode,
    onSave,
    onCancel,
}: InterruptionModalProps) {
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [count, setCount] = useState(0);

    // ... inside component ...
    // Remove local formatDuration definition
    // const formatDuration ... (removed)

    const handlePerfectSession = () => {
        onSave({ interruptionReason: null, interruptionCount: 0 });
        resetState();
    };

    const handleSave = () => {
        onSave({ interruptionReason: selectedReason, interruptionCount: count });
        resetState();
    };

    const resetState = () => {
        setSelectedReason(null);
        setCount(0);
    };

    const incrementCount = () => setCount((prev) => prev + 1);
    const decrementCount = () => setCount((prev) => Math.max(0, prev - 1));

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <View style={styles.header}>
                        <Text style={styles.title}>專注結束</Text>
                        <TouchableOpacity onPress={onCancel}>
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Session Summary */}
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryDuration}>{formatDuration(durationSeconds)}</Text>
                            <Text style={styles.summaryGoal}>{goalName}</Text>
                            {honestyMode && (
                                <View style={styles.honestyBadge}>
                                    <Text style={styles.honestyBadgeText}>🛡️ Honesty Mode</Text>
                                </View>
                            )}
                        </View>

                        {/* Perfect Session Button */}
                        <TouchableOpacity style={styles.perfectButton} onPress={handlePerfectSession}>
                            <Text style={styles.perfectButtonIcon}>✨</Text>
                            <Text style={styles.perfectButtonText}>完美專注 (0 次中斷)</Text>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>或記錄中斷</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Interruption Reasons Grid */}
                        <Text style={styles.sectionTitle}>中斷原因</Text>
                        <View style={styles.reasonsGrid}>
                            {INTERRUPTION_REASONS.map((reason) => (
                                <TouchableOpacity
                                    key={reason.id}
                                    style={[
                                        styles.reasonChip,
                                        selectedReason === reason.id && styles.reasonChipSelected,
                                    ]}
                                    onPress={() => setSelectedReason(reason.id)}
                                >
                                    <Text style={styles.reasonIcon}>{reason.icon}</Text>
                                    <Text
                                        style={[
                                            styles.reasonLabel,
                                            selectedReason === reason.id && styles.reasonLabelSelected,
                                        ]}
                                    >
                                        {reason.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Interruption Count */}
                        <Text style={styles.sectionTitle}>中斷次數</Text>
                        <View style={styles.counterContainer}>
                            <TouchableOpacity
                                style={[styles.counterButton, count === 0 && styles.counterButtonDisabled]}
                                onPress={decrementCount}
                                disabled={count === 0}
                            >
                                <Text style={styles.counterButtonText}>−</Text>
                            </TouchableOpacity>
                            <Text style={styles.counterValue}>{count}</Text>
                            <TouchableOpacity style={styles.counterButton} onPress={incrementCount}>
                                <Text style={styles.counterButtonText}>+</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>儲存紀錄</Text>
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
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    modal: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        maxHeight: '85%',
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
    summaryCard: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    summaryDuration: {
        fontSize: 48,
        fontWeight: '700',
        color: Colors.text.primary,
        fontVariant: ['tabular-nums'],
    },
    summaryGoal: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.secondary,
        marginTop: Spacing.xs,
    },
    honestyBadge: {
        backgroundColor: Colors.primary + '20',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        marginTop: Spacing.sm,
    },
    honestyBadgeText: {
        fontSize: Typography.small.fontSize,
        color: Colors.primary,
        fontWeight: '600',
    },
    perfectButton: {
        backgroundColor: Colors.success + '15',
        borderWidth: 2,
        borderColor: Colors.success,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    perfectButtonIcon: {
        fontSize: 20,
        marginRight: Spacing.sm,
    },
    perfectButtonText: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.success,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.border.default,
    },
    dividerText: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.tertiary,
        marginHorizontal: Spacing.md,
    },
    sectionTitle: {
        fontSize: Typography.small.fontSize,
        fontWeight: '600',
        color: Colors.text.secondary,
        marginBottom: Spacing.sm,
    },
    reasonsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    reasonChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.border.default,
        backgroundColor: Colors.background,
    },
    reasonChipSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '15',
    },
    reasonIcon: {
        fontSize: 16,
        marginRight: Spacing.xs,
    },
    reasonLabel: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.secondary,
    },
    reasonLabelSelected: {
        color: Colors.primary,
        fontWeight: '600',
    },
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
    },
    counterButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border.default,
        alignItems: 'center',
        justifyContent: 'center',
    },
    counterButtonDisabled: {
        opacity: 0.4,
    },
    counterButtonText: {
        fontSize: 24,
        color: Colors.text.primary,
        fontWeight: '600',
    },
    counterValue: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.text.primary,
        minWidth: 80,
        textAlign: 'center',
    },
    saveButton: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.surface,
    },
});
