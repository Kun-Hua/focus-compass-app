import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TimerViewProps {
    mode: 'Pomodoro' | 'Stopwatch' | 'Timelapse';
    taskName: string;
    goalColor: string;
    onComplete: (duration: number) => void;
    onCancel: () => void;
}

export default function TimerView({
    mode,
    taskName,
    goalColor,
    onComplete,
    onCancel,
}: TimerViewProps) {
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive) {
            interval = setInterval(() => {
                setSeconds((prev) => prev + 1);
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isActive]);

    useEffect(() => {
        if (mode === 'Timelapse' && !permission?.granted) {
            requestPermission();
        }
    }, [mode, permission]);

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const handleStop = () => {
        setIsActive(false);
        onComplete(seconds);
    };

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            {mode === 'Timelapse' && permission?.granted ? (
                <CameraView style={styles.camera} facing="front" />
            ) : (
                <View style={[styles.ring, { borderColor: goalColor }]}>
                    <View style={styles.innerRing}>
                        <Text style={styles.timerText}>{formatTime(seconds)}</Text>
                        <Text style={styles.modeText}>{mode}</Text>
                    </View>
                </View>
            )}

            <View style={styles.infoContainer}>
                <Text style={styles.taskName} numberOfLines={2}>
                    {taskName}
                </Text>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity style={styles.button} onPress={toggleTimer}>
                    <Text style={styles.buttonText}>
                        {isActive ? 'Pause' : 'Start'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.stopButton]}
                    onPress={handleStop}
                >
                    <Text style={[styles.buttonText, styles.stopButtonText]}>
                        Stop
                    </Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelButtonText}>Cancel Session</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    camera: {
        width: 300,
        height: 300,
        borderRadius: 150,
        overflow: 'hidden',
        marginBottom: Spacing.xl,
    },
    ring: {
        width: 300,
        height: 300,
        borderRadius: 150,
        borderWidth: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
    },
    innerRing: {
        alignItems: 'center',
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
    },
    infoContainer: {
        marginBottom: Spacing.xxl,
        alignItems: 'center',
    },
    taskName: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
        textAlign: 'center',
    },
    controls: {
        flexDirection: 'row',
        gap: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    button: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.primary,
        minWidth: 120,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.surface,
    },
    stopButton: {
        backgroundColor: Colors.surface,
        borderWidth: 2,
        borderColor: Colors.error,
    },
    stopButtonText: {
        color: Colors.error,
    },
    cancelButton: {
        padding: Spacing.md,
    },
    cancelButtonText: {
        color: Colors.text.tertiary,
        fontSize: Typography.body.fontSize,
    },
});
