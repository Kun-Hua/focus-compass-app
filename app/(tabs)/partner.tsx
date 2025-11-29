import Card from '@/components/ui/Card';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PartnerScreen() {
    // Mock data
    const partners = [
        {
            id: '1',
            name: 'Alice',
            isOnline: true,
            metrics: {
                netFocus: { partner: 32, you: 28 },
                commitment: { partner: 90, you: 85 },
                honesty: { partner: 98, you: 95 },
            },
            trend: 12,
        },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Partner</Text>
                    <TouchableOpacity style={styles.settingsButton}>
                        <Text style={styles.settingsIcon}>⚙️</Text>
                    </TouchableOpacity>
                </View>

                {/* Partner Card */}
                {partners.map((partner) => (
                    <Card key={partner.id} style={styles.partnerCard}>
                        {/* Header */}
                        <View style={styles.partnerHeader}>
                            <View style={styles.partnerAvatar}>
                                <Text style={styles.partnerAvatarText}>{partner.name[0]}</Text>
                                <View style={styles.onlineIndicator} />
                            </View>
                            <View style={styles.partnerInfo}>
                                <Text style={styles.partnerName}>{partner.name}</Text>
                                <Text style={styles.partnerStatus}>Online now</Text>
                            </View>
                            <View style={styles.trendContainer}>
                                <Text style={styles.trendIcon}>↗</Text>
                                <Text style={styles.trendText}>+{partner.trend}%</Text>
                            </View>
                        </View>

                        {/* Metrics Comparison */}
                        <View style={styles.metricsRow}>
                            <View style={styles.metric}>
                                <Text style={styles.metricLabel}>Net Focus</Text>
                                <Text style={styles.metricValue}>{partner.metrics.netFocus.partner}h</Text>
                                <Text style={styles.metricVs}>vs {partner.metrics.netFocus.you}h</Text>
                            </View>
                            <View style={[styles.metric, styles.metricDivider]}>
                                <Text style={styles.metricLabel}>Commitment</Text>
                                <Text style={styles.metricValue}>{partner.metrics.commitment.partner}%</Text>
                                <Text style={styles.metricVs}>vs {partner.metrics.commitment.you}%</Text>
                            </View>
                            <View style={styles.metric}>
                                <Text style={styles.metricLabel}>Honesty</Text>
                                <Text style={styles.metricValue}>{partner.metrics.honesty.partner}%</Text>
                                <Text style={styles.metricVs}>vs {partner.metrics.honesty.you}%</Text>
                            </View>
                        </View>

                        {/* Visual Chart */}
                        <View style={styles.chartSection}>
                            <Text style={styles.chartTitle}>WEEKLY FOCUS HOURS</Text>
                            <View style={styles.chartBars}>
                                <View style={styles.chartBar}>
                                    <Text style={styles.chartBarValue}>28h</Text>
                                    <View style={styles.chartBarTrack}>
                                        <View style={[styles.chartBarFill, styles.chartBarFillYou, { height: '70%' }]} />
                                    </View>
                                    <Text style={styles.chartBarLabel}>You</Text>
                                </View>
                                <View style={styles.chartBar}>
                                    <Text style={styles.chartBarValue}>32h</Text>
                                    <View style={styles.chartBarTrack}>
                                        <View style={[styles.chartBarFill, styles.chartBarFillPartner, { height: '85%' }]} />
                                    </View>
                                    <Text style={styles.chartBarLabel}>{partner.name}</Text>
                                </View>
                            </View>

                            <View style={styles.insightBox}>
                                <Text style={styles.insightText}>
                                    <Text style={styles.insightBold}>Insight:</Text> Alice was interrupted mostly by "Fatigue", while you were interrupted by "Phone".
                                </Text>
                            </View>
                        </View>

                        {/* Action Button */}
                        <TouchableOpacity style={styles.nudgeButton}>
                            <Text style={styles.nudgeIcon}>👋</Text>
                            <Text style={styles.nudgeText}>Nudge {partner.name}</Text>
                        </TouchableOpacity>
                    </Card>
                ))}

                {/* FAB Invite Button */}
                <TouchableOpacity style={styles.fab}>
                    <Text style={styles.fabIcon}>+</Text>
                </TouchableOpacity>
            </ScrollView>
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
        paddingBottom: 100,
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
    settingsButton: {
        padding: Spacing.sm,
    },
    settingsIcon: {
        fontSize: 24,
    },
    partnerCard: {
        padding: 0,
        overflow: 'hidden',
    },
    partnerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
        gap: Spacing.md,
    },
    partnerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.border.default,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    partnerAvatarText: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.success,
        borderWidth: 2,
        borderColor: Colors.surface,
    },
    partnerInfo: {
        flex: 1,
    },
    partnerName: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 2,
    },
    partnerStatus: {
        fontSize: Typography.small.fontSize,
        fontWeight: '600',
        color: Colors.success,
    },
    trendContainer: {
        flexDirection: 'column',
        alignItems: 'flex-end',
    },
    trendIcon: {
        fontSize: 20,
        color: Colors.success,
    },
    trendText: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
        color: Colors.success,
    },
    metricsRow: {
        flexDirection: 'row',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
    },
    metric: {
        flex: 1,
        alignItems: 'center',
    },
    metricDivider: {
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: Colors.border.default,
    },
    metricLabel: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.tertiary,
        marginBottom: 4,
    },
    metricValue: {
        fontSize: Typography.body.fontSize,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    metricVs: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.tertiary,
    },
    chartSection: {
        padding: Spacing.xl,
    },
    chartTitle: {
        fontSize: Typography.small.fontSize,
        fontWeight: '600',
        color: Colors.text.secondary,
        letterSpacing: 1,
        marginBottom: Spacing.lg,
    },
    chartBars: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.xxl,
        height: 128,
        marginBottom: Spacing.lg,
    },
    chartBar: {
        alignItems: 'center',
        gap: Spacing.sm,
        width: 64,
    },
    chartBarValue: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    chartBarTrack: {
        flex: 1,
        width: '100%',
        backgroundColor: Colors.border.default,
        borderRadius: 4,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    chartBarFill: {
        width: '100%',
        borderRadius: 4,
    },
    chartBarFillYou: {
        backgroundColor: Colors.primary,
    },
    chartBarFillPartner: {
        backgroundColor: Colors.text.primary,
    },
    chartBarLabel: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    insightBox: {
        backgroundColor: Colors.background,
        padding: Spacing.md,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    insightText: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.secondary,
        lineHeight: 20,
    },
    insightBold: {
        fontWeight: '700',
        color: Colors.text.primary,
    },
    nudgeButton: {
        margin: Spacing.lg,
        paddingVertical: Spacing.sm + 2,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        borderColor: Colors.border.default,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    nudgeIcon: {
        fontSize: 18,
    },
    nudgeText: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    fab: {
        position: 'absolute',
        bottom: Spacing.xxl,
        right: Spacing.xl,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    fabIcon: {
        fontSize: 24,
        color: Colors.surface,
        fontWeight: '600',
    },
});
