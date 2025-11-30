import Card from '@/components/ui/Card';
import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface KPIData {
    label: string;
    actual: number;
    planned: number;
    unit: string;
}

interface KPICardsProps {
    data: KPIData[];
}

export default function KPICards({ data }: KPICardsProps) {
    return (
        <View style={styles.container}>
            {data.map((kpi, index) => (
                <Card key={index} style={styles.card}>
                    <Text style={styles.label}>{kpi.label}</Text>
                    <View style={styles.values}>
                        <View style={styles.valueContainer}>
                            <Text style={styles.value}>{kpi.actual.toFixed(1)}{kpi.unit}</Text>
                            <Text style={styles.sublabel}>Actual</Text>
                        </View>
                        <Text style={styles.separator}>/</Text>
                        <View style={styles.valueContainer}>
                            <Text style={styles.value}>{kpi.planned.toFixed(1)}{kpi.unit}</Text>
                            <Text style={styles.sublabel}>Planned</Text>
                        </View>
                    </View>
                </Card>
            ))}
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
        padding: Spacing.md,
    },
    label: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.secondary,
        marginBottom: Spacing.sm,
    },
    values: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    valueContainer: {
        alignItems: 'center',
    },
    value: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    sublabel: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.tertiary,
    },
    separator: {
        fontSize: Typography.h3.fontSize,
        color: Colors.text.tertiary,
        marginHorizontal: Spacing.sm,
    },
});
