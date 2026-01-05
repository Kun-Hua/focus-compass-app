import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React, { useEffect, useState } from 'react';
import {
    Keyboard,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import DeviceAudioList from './DeviceAudioList';

export interface PomodoroSettings {
    focusMinutes: number;
    breakMinutes: number;
    totalRounds: number;
    soundUri?: string;
    soundName?: string;
    // soundMode removed, defaults to local/preset
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
    const [soundUri, setSoundUri] = useState<string | undefined>(settings.soundUri);
    const [soundName, setSoundName] = useState<string>(settings.soundName || 'Default (Beep)');
    const [isAudioListVisible, setIsAudioListVisible] = useState(false);

    // DEBUG: Verify prop synchronization
    useEffect(() => {
        if (visible) {
            console.log('[PomodoroSettingsModal] 🔍 MODEL OPENED - Checking Synchronization');
            console.log('[PomodoroSettingsModal] DEBUG: Incoming Props settings:', JSON.stringify(settings));
            console.log('[PomodoroSettingsModal] DEBUG: Internal State:');
            console.log(`[PomodoroSettingsModal]   - focusMinutes: ${focusMinutes} (Settings: ${settings.focusMinutes})`);
            console.log(`[PomodoroSettingsModal]   - soundUri: ${soundUri} (Settings: ${settings.soundUri})`);
            console.log(`[PomodoroSettingsModal]   - soundName: ${soundName} (Settings: ${settings.soundName})`);

            // Critical Fix: check for ANY mismatch and sync
            const shouldSync =
                String(settings.focusMinutes) !== focusMinutes ||
                String(settings.breakMinutes) !== breakMinutes ||
                String(settings.totalRounds) !== totalRounds ||
                settings.soundUri !== soundUri ||
                settings.soundName !== soundName;

            if (shouldSync) {
                console.log('[PomodoroSettingsModal] 🛠️ AUTO-FIX: Syncing state with props...');
                setFocusMinutes(String(settings.focusMinutes));
                setBreakMinutes(String(settings.breakMinutes));
                setTotalRounds(String(settings.totalRounds));
                setSoundUri(settings.soundUri);
                setSoundName(settings.soundName || 'Default (Beep)');
                console.log('[PomodoroSettingsModal] ✅ State synchronization completed');
            } else {
                console.log('[PomodoroSettingsModal] ✅ State is already in sync');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, settings]);

    const PRESET_SOUNDS = [
        { id: 'default', name: 'Default (Beep)', uri: 'default' },
        { id: 'bell', name: 'Bell Strike', uri: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3' },
        { id: 'digital', name: 'Digital Alarm', uri: 'https://assets.mixkit.co/active_storage/sfx/1003/1003-preview.mp3' },
        { id: 'nature', name: 'Morning Bird', uri: 'https://assets.mixkit.co/active_storage/sfx/2458/2458-preview.mp3' },
    ];

    const parseNumber = (value: string, min: number, max: number, fallback: number): number => {
        const num = parseInt(value, 10);
        if (isNaN(num)) return fallback;
        return Math.max(min, Math.min(max, num));
    };


    const handlePickSound = () => {
        setIsAudioListVisible(true);
    };

    const handleSelectDeviceAudio = (uri: string, name: string) => {
        console.log('[PomodoroSettingsModal] ═══════════════════════════════════════');
        console.log('[PomodoroSettingsModal] DEBUG: User selected custom audio');
        console.log('[PomodoroSettingsModal] DEBUG: Selected URI:', uri);
        console.log('[PomodoroSettingsModal] DEBUG: Selected Name:', name);
        console.log('[PomodoroSettingsModal] DEBUG: URI type:', uri.startsWith('file://') ? 'file://' : uri.startsWith('content://') ? 'content://' : 'other');
        setSoundUri(uri);
        setSoundName(name);
        console.log('[PomodoroSettingsModal] DEBUG: State updated - closing audio list');
        console.log('[PomodoroSettingsModal] ═══════════════════════════════════════');
        setIsAudioListVisible(false);
    };

    const handleSave = () => {
        const parsedFocus = parseNumber(focusMinutes, 1, 120, 25);
        const parsedBreak = parseNumber(breakMinutes, 1, 60, 5);
        const parsedRounds = parseNumber(totalRounds, 1, 20, 4);

        const newSettings = {
            focusMinutes: parsedFocus,
            breakMinutes: parsedBreak,
            totalRounds: parsedRounds,
            soundUri,
            soundName,
        };

        console.log('[PomodoroSettingsModal] ╔════════════════════════════════════════╗');
        console.log('[PomodoroSettingsModal] ║   APPLY SETTINGS BUTTON PRESSED        ║');
        console.log('[PomodoroSettingsModal] ╚════════════════════════════════════════╝');
        console.log('[PomodoroSettingsModal] DEBUG: Prepared settings object:');
        console.log('[PomodoroSettingsModal] DEBUG:   - focusMinutes:', parsedFocus);
        console.log('[PomodoroSettingsModal] DEBUG:   - breakMinutes:', parsedBreak);
        console.log('[PomodoroSettingsModal] DEBUG:   - totalRounds:', parsedRounds);
        console.log('[PomodoroSettingsModal] DEBUG:   - soundUri:', soundUri || '(undefined)');
        console.log('[PomodoroSettingsModal] DEBUG:   - soundName:', soundName || '(undefined)');
        console.log('[PomodoroSettingsModal] DEBUG: Full settings JSON:', JSON.stringify(newSettings, null, 2));

        try {
            console.log('[PomodoroSettingsModal] DEBUG: Calling parent onSave callback...');
            onSave(newSettings);
            console.log('[PomodoroSettingsModal] DEBUG: ✅ onSave callback completed successfully');
        } catch (err) {
            console.error('[PomodoroSettingsModal] DEBUG: ❌ Error in onSave callback:', err);
        }

        console.log('[PomodoroSettingsModal] DEBUG: Closing modal...');
        onClose();
        console.log('[PomodoroSettingsModal] ════════════════════════════════════════');
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
                            <Text style={styles.title}>🍅 Timer Settings</Text>
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

                        {/* Sound Selection */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Alarm Sound</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
                                {PRESET_SOUNDS.map((sound) => (
                                    <TouchableOpacity
                                        key={sound.id}
                                        style={[
                                            styles.presetItem,
                                            soundUri === sound.uri && styles.presetItemActive
                                        ]}
                                        onPress={() => {
                                            setSoundUri(sound.uri);
                                            setSoundName(sound.name);
                                        }}
                                    >
                                        <Text style={[
                                            styles.presetText,
                                            soundUri === sound.uri && styles.presetTextActive
                                        ]}>
                                            {sound.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    style={[
                                        styles.presetItem,
                                        soundUri !== 'default' && !PRESET_SOUNDS.find(s => s.uri === soundUri) && styles.presetItemActive
                                    ]}
                                    onPress={handlePickSound}
                                >
                                    <Text style={[
                                        styles.presetText,
                                        soundUri !== 'default' && !PRESET_SOUNDS.find(s => s.uri === soundUri) && styles.presetTextActive
                                    ]}>
                                        🎵 Pick from Device...
                                    </Text>
                                </TouchableOpacity>
                            </ScrollView>
                            {soundUri && soundUri !== 'default' && !soundUri.startsWith('http') && (
                                <Text style={styles.selectedFileText}>Selected: {soundName}</Text>
                            )}
                            <Text style={styles.inputHint}>Choose a preset or pick a custom song from your device</Text>
                        </View>

                        {/* Device Audio List Modal */}
                        <DeviceAudioList
                            visible={isAudioListVisible}
                            onClose={() => setIsAudioListVisible(false)}
                            onSelect={handleSelectDeviceAudio}
                        />

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
        </Modal >
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
    soundRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    soundName: {
        flex: 1,
        fontSize: Typography.body.fontSize,
        color: Colors.text.primary,
        marginRight: Spacing.sm,
    },
    pickButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.sm,
    },
    pickButtonText: {
        fontSize: Typography.small.fontSize,
        color: Colors.surface,
        fontWeight: '600',
    },
    modeContainer: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    modeButton: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border.default,
        alignItems: 'center',
    },
    modeButtonActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    modeButtonText: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.primary,
        fontWeight: '600',
    },
    modeButtonTextActive: {
        color: Colors.surface,
    },
    presetScroll: {
        marginTop: Spacing.sm,
    },
    presetItem: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.border.default,
        marginRight: Spacing.md,
    },
    presetItemActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    presetText: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.primary,
        fontWeight: '600',
    },
    presetTextActive: {
        color: Colors.surface,
    },
    selectedFileText: {
        fontSize: Typography.small.fontSize,
        color: Colors.success,
        marginTop: Spacing.sm,
        fontWeight: '600',
    },
    spotifySearchButton: {
        backgroundColor: '#1DB954',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    spotifyButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    spotifySearchButtonText: {
        color: Colors.surface,
        fontWeight: '700',
        fontSize: Typography.body.fontSize,
    },
    selectedTrackContainer: {
        marginTop: Spacing.sm,
    },
});
