import KPICards from '@/components/dashboard/KPICards';
import MITCard from '@/components/dashboard/MITCard';
import WeeklyStreak from '@/components/dashboard/WeeklyStreak';
import Card from '@/components/ui/Card';
import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
    // Mock data - will be replaced with real data from hooks/Supabase
    const todayMIT = {
        name: 'Finish Q4 Report',
        goalTag: 'Core Goal',
        goalId: '123',
    };

    const kpiData = {
        planned: 6.0,
        actual: 4.2,
        honesty: 92,
    };

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Today</Text>
                        <Text style={styles.date}>{currentDate}</Text>
                    </View>
                    <TouchableOpacity>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>U</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* MIT Card */}
                <MITCard task={todayMIT} />

                {/* KPI Cards */}
                <KPICards data={kpiData} />

                {/* Weekly Streak */}
                <WeeklyStreak streakWeeks={4} onTrack={true} />

                {/* Contribution Chart */}
                <Card style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <Text style={styles.chartTitle}>Contribution</Text>
                        <Text style={styles.chartSubtitle}>Top 5 Core</Text>
                    </View>
                    <View style={styles.chartBars}>
                        <ChartBar label="Work" percentage={45} />
                        <ChartBar label="Learn Spanish" percentage={25} />
                        <ChartBar label="Fitness" percentage={15} />
                    </View>
                </Card>

                {/* Diagnostic Card */}
                <Card
                    style={styles.diagnosticCard}
                    borderColor={Colors.error}
                >
                    <Text style={styles.diagnosticTitle}>Distraction Alert</Text>
                    <Text style={styles.diagnosticText}>
                        You are often interrupted by 'Social Media' around 2 PM.
                    </Text>
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
}

// Simple chart bar component
function ChartBar({ label, percentage }: { label: string; percentage: number }) {
    return (
        <View style={styles.barContainer}>
            <View style={styles.barLabelRow}>
                <Text style={styles.barLabel}>{label}</Text>
                <Text style={styles.barPercentage}>{percentage}%</Text>
            </View>
            <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${percentage}%` }]} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
        marginTop: Spacing.lg,
    },
    title: {
        fontSize: Typography.h1.fontSize,
        fontWeight: Typography.h1.fontWeight,
        color: Colors.text.primary,
        lineHeight: Typography.h1.lineHeight,
    },
    date: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.secondary,
        marginTop: 4,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.border.default,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    // Chart Card
    chartCard: {
        marginBottom: Spacing.lg,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    chartTitle: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    chartSubtitle: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.tertiary,
    },
    chartBars: {
        gap: Spacing.md,
    },
    barContainer: {
        gap: 4,
    },
    barLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    barLabel: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.secondary,
    },
    barPercentage: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.secondary,
    },
    barTrack: {
        height: 8,
        backgroundColor: Colors.border.default,
        borderRadius: 4,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 4,
    },
    // Diagnostic Card
    diagnosticCard: {
        marginBottom: Spacing.lg,
    },
    diagnosticTitle: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    diagnosticText: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.secondary,
        lineHeight: 20,
    },
});
