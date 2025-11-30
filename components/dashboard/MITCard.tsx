import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MITTask {
    id: string;
    title: string;
    goalName: string;
    goalId: string;
}

interface MITCardProps {
    task?: MITTask;
}

export default function MITCard({ task }: MITCardProps) {
    const router = useRouter();

    const handleStartFocus = () => {
        if (task) {
            router.push('/focus');
        }
    };

    const handleSelectMIT = () => {
        router.push('/focus');
    };

    if (!task) {
        return (
            <Card style={styles.card}>
                <View style={styles.header}>
                    <Text style={styles.title}>Most Important Task</Text>
                    <Badge text="MIT" variant="primary" />
                </View>
                <Text style={styles.emptyText}>No MIT selected for today</Text>
                <Button title="Select MIT" onPress={handleSelectMIT} />
            </Card>
        );
    }

    return (
        <Card style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.title}>Most Important Task</Text>
                <Badge text="MIT" variant="primary" />
            </View>
            <View style={styles.taskContainer}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.goalName}>{task.goalName}</Text>
            </View>
            <Button title="Start Focus" onPress={handleStartFocus} />
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    emptyText: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.secondary,
        marginBottom: Spacing.lg,
        textAlign: 'center',
        paddingVertical: Spacing.xl,
    },
    taskContainer: {
        marginBottom: Spacing.lg,
    },
    taskTitle: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
    },
    goalName: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.secondary,
    },
});
