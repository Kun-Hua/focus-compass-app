import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

interface KPIData {
    planned: number;
    actual: number;
    honesty: number;
}

interface KPICardsProps {
    data: KPIData;
}

export default function KPICards({ data }: KPICardsProps) {
    const getHonestyColor = (percentage: number) => {
        if (percentage >= 90) return Colors.success;
        if (percentage >= 70) return Colors.warning;
        return Colors.error;
    };

    const honestyColor = getHonestyColor(data.honesty);

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.label}>Planned</Text>
                <Text style={styles.value}>{data.planned.toFixed(1)}h</Text>
            </View>

            <View style={[styles.card, styles.highlightCard]}>
                <Text style={[styles.label, styles.primaryLabel]}>Actual</Text>
                <Text style={[styles.value, styles.primaryValue]}>
                    {data.actual.toFixed(1)}h
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Honesty</Text>
                <Text style={[styles.value, { color: honestyColor }]}>
                    {Math.round(data.honesty)}%
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    card: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border.default,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 6,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    highlightCard: {
        backgroundColor: Colors.primaryLight,
    },
    label: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.secondary,
        marginBottom: 4,
    },
    primaryLabel: {
        color: Colors.primary,
    },
    value: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    primaryValue: {
        color: Colors.primary,
    },
});
