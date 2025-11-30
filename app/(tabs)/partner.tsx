import Card from '@/components/ui/Card';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PartnerScreen() {
    // Mock data
    const partner = {
        name: 'Sarah',
        status: 'Focusing',
        lastActive: 'Now',
        streak: 12,
        todayMinutes: 145,
        trend: 15,
        avatar: 'S',
    };

    const metrics = [
        { label: 'Focus Time', you: '2h 30m', partner: '2h 25m', diff: '+5m', winning: true },
        { label: 'Honesty', you: '95%', partner: '98%', diff: '-3%', winning: false },
        { label: 'Streak', you: '4 days', partner: '12 days', diff: '-8', winning: false },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Text style={styles.title}>Partner</Text>

                {/* Partner Status Card */}
                <View style={styles.partnerCard}>
                    <View style={styles.partnerCardGradient}>
                        <View style={styles.partnerHeader}>
                            <View style={styles.avatarContainer}>
                                <Text style={styles.avatarText}>{partner.avatar}</Text>
                                <View style={styles.statusBadge} />
                            </View>
                            <View style={styles.partnerInfo}>
                                <Text style={styles.partnerName}>{partner.name}</Text>
                                <Text style={styles.partnerStatus}>
                                    {partner.status} • {partner.lastActive}
                                </Text>
                            </View>
                            <View style={styles.trendContainer}>
                                <Text style={styles.trendIcon}>🔥</Text>
                                <Text style={styles.trendText}>{partner.streak} days</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{partner.todayMinutes}m</Text>
                                <Text style={styles.statLabel}>Today</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>+{partner.trend}%</Text>
                                <Text style={styles.statLabel}>Trend</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Comparison Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Comparison</Text>
                        <Text style={styles.sectionSubtitle}>Today</Text>
                    </View>
                    <Card style={styles.comparisonCard}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.colMetric}>Metric</Text>
                            <Text style={styles.colValue}>You</Text>
                            <Text style={styles.colValue}>{partner.name}</Text>
                            <Text style={styles.colDiff}>Diff</Text>
                        </View>
                        {metrics.map((metric, index) => (
                            <View
                                key={metric.label}
                                style={[
                                    styles.tableRow,
                                    index < metrics.length - 1 && styles.tableRowBorder,
                                ]}
                            >
                                <Text style={styles.colMetric}>{metric.label}</Text>
                                <Text style={styles.colValue}>{metric.you}</Text>
                                <Text style={styles.colValue}>{metric.partner}</Text>
                                <Text style={[styles.colDiff, metric.winning ? styles.textSuccess : styles.textError]}>
                                    {metric.diff}
                                </Text>
                            </View>
                        ))}
                    </Card>
                </View>

                {/* Activity Feed */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Activity</Text>
                    <Card style={styles.activityCard}>
                        <View style={styles.activityItem}>
                            <Text style={styles.activityIcon}>🎯</Text>
                            <View style={styles.activityContent}>
                                <Text style={styles.activityText}>
                                    <Text style={styles.bold}>{partner.name}</Text> completed a 45m session
                                </Text>
                                <Text style={styles.activityTime}>2 hours ago</Text>
                            </View>
                        </View>
                        <View style={styles.activityDivider} />
                        <View style={styles.activityItem}>
                            <Text style={styles.activityIcon}>🏆</Text>
                            <View style={styles.activityContent}>
                                <Text style={styles.activityText}>
                                    <Text style={styles.bold}>You</Text> reached a 4 day streak!
                                </Text>
                                <Text style={styles.activityTime}>5 hours ago</Text>
                            </View>
                        </View>
                    </Card>
                </View>
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity style={styles.fab}>
                <Text style={styles.fabIcon}>👋</Text>
            </TouchableOpacity>
        </SafeAreaView>
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
        paddingBottom: Spacing.xl + 80, // Extra padding for FAB
    },
    title: {
        fontSize: Typography.h1.fontSize,
        fontWeight: Typography.h1.fontWeight,
        color: Colors.text.primary,
        lineHeight: Typography.h1.lineHeight,
        marginBottom: Spacing.xl,
        marginTop: Spacing.lg,
    },
    partnerCard: {
        marginBottom: Spacing.xl,
    },
    partnerCardGradient: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.xl,
        borderWidth: 2,
        borderColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    partnerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
        position: 'relative',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.primary,
    },
    statusBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10B981', // Green
        borderWidth: 2,
        borderColor: Colors.surface,
    },
    partnerInfo: {
        flex: 1,
    },
    partnerName: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    partnerStatus: {
        fontSize: Typography.caption.fontSize,
        color: '#10B981',
        fontWeight: '600',
    },
    trendContainer: {
        alignItems: 'flex-end',
    },
    trendIcon: {
        fontSize: 20,
        marginBottom: 2,
    },
    trendText: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border.default,
        marginVertical: Spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    statLabel: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.secondary,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    sectionSubtitle: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.tertiary,
    },
    comparisonCard: {
        padding: 0,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        padding: Spacing.md,
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
    },
    tableRow: {
        flexDirection: 'row',
        padding: Spacing.md,
        alignItems: 'center',
    },
    tableRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
    },
    colMetric: {
        flex: 2,
        fontSize: Typography.small.fontSize,
        color: Colors.text.secondary,
        fontWeight: '600',
    },
    colValue: {
        flex: 1.5,
        fontSize: Typography.body.fontSize,
        color: Colors.text.primary,
        textAlign: 'center',
    },
    colDiff: {
        flex: 1,
        fontSize: Typography.small.fontSize,
        textAlign: 'right',
        fontWeight: '600',
    },
    textSuccess: {
        color: '#10B981',
    },
    textError: {
        color: Colors.error,
    },
    activityCard: {
        padding: Spacing.md,
    },
    activityItem: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    activityIcon: {
        fontSize: 20,
        marginTop: 2,
    },
    activityContent: {
        flex: 1,
    },
    activityText: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.primary,
        lineHeight: 20,
    },
    bold: {
        fontWeight: '600',
    },
    activityTime: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.tertiary,
        marginTop: 4,
    },
    activityDivider: {
        height: 1,
        backgroundColor: Colors.border.default,
        marginVertical: Spacing.md,
    },
    fab: {
        position: 'absolute',
        bottom: Spacing.xl,
        right: Spacing.xl,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    fabIcon: {
        fontSize: 24,
        color: Colors.surface,
    },
});
