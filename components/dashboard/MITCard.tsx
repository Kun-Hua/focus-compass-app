import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MITCardProps {
    task?: {
        name: string;
        goalTag: string;
        goalId: string;
    };
}

export default function MITCard({ task }: MITCardProps) {
    const router = useRouter();

    const handleStartFocus = () => {
        if (task) {
            router.push('/index');
        }
    };

    const handleSelectMIT = () => {
        router.push('/index');
    };

    if (!task) {
        return (
            <Card style={styles.card}>
                <Text style={styles.emptyTitle}>Select your One Thing for today</Text>
                <Text style={styles.emptySubtitle}>
                    Choose from your Vision calendar
                </Text>
                <Button
                    title="Select from Vision"
                    onPress={handleSelectMIT}
                    variant="secondary"
                    style={styles.button}
                />
            </Card>
        );
    }

    return (
        <Card style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.label}>TODAY'S FOCUS</Text>
                <Badge text={task.goalTag} color={Colors.primary} />
            </View>
            <Text style={styles.taskName}>{task.name}</Text>
            <Button
                title="Start Focus"
                onPress={handleStartFocus}
                variant="primary"
                style={styles.button}
            />
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
        color: Colors.text.secondary,
        letterSpacing: 1,
    },
    taskName: {
        fontSize: Typography.h2.fontSize,
        fontWeight: Typography.h2.fontWeight,
        color: Colors.text.primary,
        marginBottom: Spacing.lg,
        lineHeight: Typography.h2.lineHeight,
    },
    button: {
        width: '100%',
    },
    emptyTitle: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
    },
    emptySubtitle: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.secondary,
        marginBottom: Spacing.lg,
    },
});
