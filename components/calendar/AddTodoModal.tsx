import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { goalsApi } from '@/services/goalsApi';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface AddTodoModalProps {
    visible: boolean;
    userId: string;
    defaultDate?: Date;
    defaultStartTime?: Date;
    defaultEndTime?: Date;
    onClose: () => void;
    onSave: (data: {
        title: string;
        goalId: string | null;
        dueDate: Date;
        startTime?: Date | null;
        endTime?: Date | null;
        isAllDay: boolean;
    }) => void;
}

export default function AddTodoModal({
    visible,
    userId,
    defaultDate,
    defaultStartTime,
    defaultEndTime,
    onClose,
    onSave
}: AddTodoModalProps) {
    const [title, setTitle] = useState('');
    const [goals, setGoals] = useState<any[]>([]);
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Time-related state
    const [isAllDay, setIsAllDay] = useState(true);
    const [dueDate, setDueDate] = useState(defaultDate || new Date());
    const [startTime, setStartTime] = useState(defaultStartTime || new Date());
    const [endTime, setEndTime] = useState(() => {
        if (defaultEndTime) return defaultEndTime;
        const end = new Date(defaultStartTime || new Date());
        end.setHours(end.getHours() + 1);
        return end;
    });

    // Show picker state (for Android/iOS)
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    useEffect(() => {
        if (visible && userId) {
            loadGoals();
            // Reset to defaults when modal opens
            setDueDate(defaultDate || new Date());
            setStartTime(defaultStartTime || new Date());
            const end = defaultEndTime || new Date(defaultStartTime || new Date());
            if (!defaultEndTime) end.setHours(end.getHours() + 1);
            setEndTime(end);
            setIsAllDay(defaultStartTime ? false : true);
        }
    }, [visible, userId, defaultDate, defaultStartTime, defaultEndTime]);

    const loadGoals = async () => {
        setLoading(true);
        try {
            const data = await goalsApi.getCoreGoals(userId);
            setGoals(data);
            if (data.length > 0) setSelectedGoalId(data[0].goal_id);
        } catch (err) {
            console.error('Failed to load goals', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        if (!title.trim()) return;

        onSave({
            title,
            goalId: selectedGoalId,
            dueDate,
            startTime: isAllDay ? null : startTime,
            endTime: isAllDay ? null : endTime,
            isAllDay,
        });

        setTitle('');
        setSelectedGoalId(null);
        setIsAllDay(true);
        onClose();
    };

    const handleStartTimeChange = (event: any, selectedTime?: Date) => {
        setShowStartPicker(Platform.OS === 'ios');
        if (selectedTime) {
            setStartTime(selectedTime);
            // Auto-adjust end time if it's before start
            if (selectedTime >= endTime) {
                const newEnd = new Date(selectedTime);
                newEnd.setHours(newEnd.getHours() + 1);
                setEndTime(newEnd);
            }
        }
    };

    const handleEndTimeChange = (event: any, selectedTime?: Date) => {
        setShowEndPicker(Platform.OS === 'ios');
        if (selectedTime && selectedTime > startTime) {
            setEndTime(selectedTime);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>New Task</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={Colors.text.primary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={styles.label}>What needs to be done?</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Read Physics Chapter 3"
                            value={title}
                            onChangeText={setTitle}
                            autoFocus
                        />

                        {/* All Day Toggle */}
                        <View style={styles.toggleRow}>
                            <Text style={styles.label}>All Day</Text>
                            <Switch
                                value={isAllDay}
                                onValueChange={setIsAllDay}
                                trackColor={{ false: Colors.border.default, true: Colors.primary + '40' }}
                                thumbColor={isAllDay ? Colors.primary : '#f4f3f4'}
                            />
                        </View>

                        {/* Time Pickers (if not all-day) */}
                        {!isAllDay && (
                            <View style={styles.timeSection}>
                                <View style={styles.timeRow}>
                                    <Text style={styles.timeLabel}>Start:</Text>
                                    <TouchableOpacity
                                        style={styles.timePicker}
                                        onPress={() => setShowStartPicker(true)}
                                    >
                                        <Text style={styles.timeText}>
                                            {startTime.toLocaleTimeString('en-US', {
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                hour12: true
                                            })}
                                        </Text>
                                        <Ionicons name="time-outline" size={20} color={Colors.primary} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.timeRow}>
                                    <Text style={styles.timeLabel}>End:</Text>
                                    <TouchableOpacity
                                        style={styles.timePicker}
                                        onPress={() => setShowEndPicker(true)}
                                    >
                                        <Text style={styles.timeText}>
                                            {endTime.toLocaleTimeString('en-US', {
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                hour12: true
                                            })}
                                        </Text>
                                        <Ionicons name="time-outline" size={20} color={Colors.primary} />
                                    </TouchableOpacity>
                                </View>

                                {/* Pickers */}
                                {showStartPicker && (
                                    <DateTimePicker
                                        value={startTime}
                                        mode="time"
                                        display="default"
                                        onChange={handleStartTimeChange}
                                    />
                                )}
                                {showEndPicker && (
                                    <DateTimePicker
                                        value={endTime}
                                        mode="time"
                                        display="default"
                                        onChange={handleEndTimeChange}
                                    />
                                )}
                            </View>
                        )}

                        <Text style={styles.label}>Link to Goal (Optional)</Text>
                        {loading ? (
                            <ActivityIndicator />
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalList}>
                                <TouchableOpacity
                                    style={[
                                        styles.goalChip,
                                        selectedGoalId === null && styles.goalChipSelected
                                    ]}
                                    onPress={() => setSelectedGoalId(null)}
                                >
                                    <Text style={[
                                        styles.goalText,
                                        selectedGoalId === null && styles.goalTextSelected
                                    ]}>No Goal</Text>
                                </TouchableOpacity>

                                {goals.map((g) => (
                                    <TouchableOpacity
                                        key={g.goal_id}
                                        style={[
                                            styles.goalChip,
                                            selectedGoalId === g.goal_id && styles.goalChipSelected
                                        ]}
                                        onPress={() => setSelectedGoalId(g.goal_id)}
                                    >
                                        <View style={styles.dot} />
                                        <Text style={[
                                            styles.goalText,
                                            selectedGoalId === g.goal_id && styles.goalTextSelected
                                        ]}>
                                            {g.goal_name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </ScrollView>

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: BorderRadius.lg,
        borderTopRightRadius: BorderRadius.lg,
        padding: Spacing.xl,
        gap: Spacing.lg,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    label: {
        fontSize: Typography.small.fontSize,
        fontWeight: '600',
        color: Colors.text.secondary,
        marginBottom: Spacing.sm,
    },
    input: {
        backgroundColor: Colors.surface,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        fontSize: Typography.body.fontSize,
        borderWidth: 1,
        borderColor: Colors.border.default,
        marginBottom: Spacing.md,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    timeSection: {
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    timeLabel: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.secondary,
        width: 50,
    },
    timePicker: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border.default,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
    },
    timeText: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.primary,
        fontWeight: '500',
    },
    goalList: {
        gap: Spacing.sm,
        paddingBottom: Spacing.sm,
    },
    goalChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.border.default,
        backgroundColor: Colors.surface,
    },
    goalChipSelected: {
        borderColor: Colors.primary,
        backgroundColor: '#E6F4FE',
    },
    goalText: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.primary,
    },
    goalTextSelected: {
        color: Colors.primary,
        fontWeight: '600',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.primary,
        marginRight: 6,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        padding: Spacing.lg,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        marginTop: Spacing.md,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: Typography.body.fontSize,
    },
});
