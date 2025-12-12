import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React, { useState } from 'react';
import {
    Keyboard,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

export interface PomodoroSettings {
    focusMinutes: number;
    breakMinutes: number;
    totalRounds: number;
}

interface PomodoroSettingsModalProps {
    visible: boolean;
    settings: PomodoroSettings;
    onClose: () => void;
    onSave: (settings: PomodoroSettings) => void;
}

export default function PomodoroSettingsModal({
    visible,
    settings,
    onClose,
    onSave,
}: PomodoroSettingsModalProps) {
    const [focusMinutes, setFocusMinutes] = useState(String(settings.focusMinutes));
    const [breakMinutes, setBreakMinutes] = useState(String(settings.breakMinutes));
    const [totalRounds, setTotalRounds] = useState(String(settings.totalRounds));

    const parseNumber = (value: string, min: number, max: number, fallback: number): number => {
        const num = parseInt(value, 10);
        if (isNaN(num)) return fallback;
        return Math.max(min, Math.min(max, num));
    };

    const handleSave = () => {
        const parsedFocus = parseNumber(focusMinutes, 1, 120, 25);
        const parsedBreak = parseNumber(breakMinutes, 1, 60, 5);
        const parsedRounds = parseNumber(totalRounds, 1, 20, 4);

        onSave({
            focusMinutes: parsedFocus,
            breakMinutes: parsedBreak,
            totalRounds: parsedRounds,
        });
        onClose();
    };

    // Calculate total session time
    const focus = parseNumber(focusMinutes, 1, 120, 25);
    const breakM = parseNumber(breakMinutes, 1, 60, 5);
    const rounds = parseNumber(totalRounds, 1, 20, 4);
    const totalMinutes = (focus + breakM) * rounds - breakM;
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <View style={styles.header}>
                            <Text style={styles.title}>🍅 Pomodoro Settings</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Text style={styles.closeIcon}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Focus Time Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Focus Time (minutes)</Text>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={styles.input}
                                    value={focusMinutes}
                                    onChangeText={setFocusMinutes}
                                    keyboardType="number-pad"
                                    placeholder="25"
                                    placeholderTextColor={Colors.text.tertiary}
                                    maxLength={3}
                                />
                                <Text style={styles.inputUnit}>min</Text>
                            </View>
                            <Text style={styles.inputHint}>Range: 1-120 minutes</Text>
                        </View>

                        {/* Break Time Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Break Time (minutes)</Text>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={styles.input}
                                    value={breakMinutes}
                                    onChangeText={setBreakMinutes}
                                    keyboardType="number-pad"
                                    placeholder="5"
                                    placeholderTextColor={Colors.text.tertiary}
                                    maxLength={2}
                                />
                                <Text style={styles.inputUnit}>min</Text>
                            </View>
                            <Text style={styles.inputHint}>Range: 1-60 minutes</Text>
                        </View>

                        {/* Rounds Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Total Rounds</Text>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={styles.input}
                                    value={totalRounds}
                                    onChangeText={setTotalRounds}
                                    keyboardType="number-pad"
                                    placeholder="4"
                                    placeholderTextColor={Colors.text.tertiary}
                                    maxLength={2}
                                />
                                <Text style={styles.inputUnit}>rounds</Text>
                            </View>
                            <Text style={styles.inputHint}>Range: 1-20 rounds</Text>
                        </View>

                        {/* Summary */}
                        <View style={styles.summary}>
                            <Text style={styles.summaryLabel}>Total Session</Text>
                            <Text style={styles.summaryValue}>
                                {totalHours > 0 ? `${totalHours}h ${remainingMinutes}m` : `${totalMinutes}m`}
                            </Text>
                        </View>

                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>Apply Settings</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
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
        fontSize: 20,
        color: Colors.text.secondary,
        padding: 4,
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    inputLabel: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text.primary,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    inputUnit: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.secondary,
        marginLeft: Spacing.md,
        width: 60,
    },
    inputHint: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.tertiary,
        marginTop: Spacing.xs,
    },
    summary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    summaryLabel: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.secondary,
    },
    summaryValue: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '700',
        color: Colors.primary,
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
