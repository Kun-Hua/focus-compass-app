import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Task } from './TimeAxisCalendar';

type TimerMode = 'stopwatch' | 'pomodoro' | 'timelapse';

interface TimerViewProps {
    task: Task;
    mode: TimerMode;
    onClose: () => void;
    onComplete?: (duration: number) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RING_SIZE = SCREEN_WIDTH * 0.7;

export default function TimerView({ task, mode, onClose }: TimerViewProps) {
    const [permission, requestPermission] = useCameraPermissions();

    // Initial duration in seconds
    const getInitialDuration = () => {
        switch (mode) {
            case 'pomodoro': return 25 * 60;
            case 'timelapse': return 60 * 60; // Default 60m for timelapse
            case 'stopwatch': return 0;
            default: return 0;
        }
    };

    const [timeLeft, setTimeLeft] = useState(getInitialDuration());
    const [isActive, setIsActive] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isActive) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (mode === 'stopwatch') {
                        return prev + 1;
                    } else {
                        if (prev <= 0) {
                            setIsActive(false);
                            if (timerRef.current) clearInterval(timerRef.current);
                            if (onComplete) onComplete(getInitialDuration());
                            return 0;
                        }
                        return prev - 1;
                    }
                });
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isActive, mode]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const stopTimer = () => {
        setIsActive(false);
        if (mode === 'stopwatch' && onComplete) {
            onComplete(timeLeft); // For stopwatch, timeLeft is actually elapsed time
        }
        onClose();
    };

    // Render Camera View for Timelapse
    if (mode === 'timelapse') {
        if (!permission) {
            // Camera permissions are still loading.
            return <View style={styles.container} />;
        }

        if (!permission.granted) {
            return (
                <View style={styles.container}>
                    <View style={styles.content}>
                        <Text style={styles.message}>We need your permission to show the camera</Text>
                        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
                            <Text style={styles.primaryButtonText}>Grant Permission</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
                            <Text style={styles.secondaryButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.container}>
                <CameraView style={StyleSheet.absoluteFill} facing="back">
                    <View style={styles.cameraOverlay}>
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Text style={[styles.closeIcon, { color: '#FFF' }]}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Content Overlay */}
                        <View style={styles.content}>
                            {/* Task Info - Minimal for Camera */}
                            <View style={styles.taskContainer}>
                                <Text style={[styles.taskName, { color: '#FFF', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 }]}>
                                    {task.name}
                                </Text>
                            </View>

                            {/* Timer Display - Minimal */}
                            <View style={styles.timerContainer}>
                                <Text style={[styles.timerText, { color: '#FFF', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 }]}>
                                    {formatTime(timeLeft)}
                                </Text>
                            </View>

                            {/* Controls */}
                            <View style={styles.controls}>
                                <TouchableOpacity
                                    style={[styles.controlButton, styles.secondaryButton, { backgroundColor: 'rgba(0,0,0,0.5)', borderColor: '#FFF' }]}
                                    onPress={stopTimer}
                                >
                                    <Text style={[styles.secondaryButtonText, { color: '#FFF' }]}>Stop</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.controlButton, styles.primaryButton, { backgroundColor: '#FF3B30' }]}
                                    onPress={toggleTimer}
                                >
                                    <Text style={styles.primaryButtonText}>{isActive ? 'Stop Rec' : 'Rec'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </CameraView>
            </View>
        );
    }

    // Default View for Pomodoro / Stopwatch
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {/* Task Info */}
                <View style={styles.taskContainer}>
                    <View style={[styles.goalBadge, { backgroundColor: `${task.goalColor}20` }]}>
                        <View style={[styles.goalDot, { backgroundColor: task.goalColor }]} />
                        <Text style={styles.goalText}>{task.goalName}</Text>
                    </View>
                    <Text style={styles.taskName} numberOfLines={2}>{task.name}</Text>
                </View>

                {/* Timer Display */}
                <View style={styles.timerContainer}>
                    <View style={[styles.timerRing, { borderColor: task.goalColor || Colors.primary }]}>
                        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                        <Text style={styles.modeText}>{mode === 'pomodoro' ? 'Focus' : mode}</Text>
                    </View>
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                    <TouchableOpacity
                        style={[styles.controlButton, styles.secondaryButton]}
                        onPress={stopTimer}
                    >
                        <Text style={styles.secondaryButtonText}>Stop</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.controlButton, styles.primaryButton, { backgroundColor: task.goalColor || Colors.primary }]}
                        onPress={toggleTimer}
                    >
                        <Text style={styles.primaryButtonText}>{isActive ? 'Pause' : 'Start'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: Colors.background,
        zIndex: 1000, // Cover everything
    },
    cameraOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    header: {
        paddingTop: 60, // Safe area top
        paddingHorizontal: Spacing.xl,
        alignItems: 'flex-end',
    },
    closeButton: {
        padding: Spacing.sm,
    },
    closeIcon: {
        fontSize: 24,
        color: Colors.text.tertiary,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 60, // Safe area bottom
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
        fontSize: Typography.body.fontSize,
        color: Colors.text.primary,
    },
    taskContainer: {
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    goalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        marginBottom: Spacing.md,
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
    taskName: {
        fontSize: Typography.h2.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
        textAlign: 'center',
    },
    timerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerRing: {
        width: RING_SIZE,
        height: RING_SIZE,
        borderRadius: RING_SIZE / 2,
        borderWidth: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    timerText: {
        fontSize: 64,
        fontWeight: '700',
        color: Colors.text.primary,
        fontVariant: ['tabular-nums'],
    },
    modeText: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.secondary,
        marginTop: Spacing.sm,
        textTransform: 'capitalize',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xl,
    },
    controlButton: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.full,
        minWidth: 120,
        alignItems: 'center',
    },
    primaryButton: {
        // Background color set dynamically
    },
    primaryButtonText: {
        fontSize: Typography.h2.fontSize,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    secondaryButton: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    secondaryButtonText: {
        fontSize: Typography.h2.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
});
