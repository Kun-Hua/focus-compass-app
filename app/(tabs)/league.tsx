import Card from '@/components/ui/Card';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LeagueScreen() {
    // Mock data
    const userRank = {
        league: 'Silver',
        icon: '🥈',
        honestyMinutes: 120,
        nextLeague: 'Gold',
        minutesToNext: 30,
        progress: 0.8,
        atRisk: false,
    };

    const leaderboard = [
        { rank: 1, name: 'Annie', minutes: 340, trend: 'up' },
        { rank: 2, name: 'You', minutes: 120, trend: 'neutral', isUser: true },
        { rank: 3, name: 'Bob', minutes: 95, trend: 'down' },
    ];

    const badges = [
        { id: '1', name: 'Sprinter', icon: '🏃', unlocked: true },
        { id: '2', name: 'Honest', icon: '💎', unlocked: true },
        { id: '3', name: '???', icon: '🔒', unlocked: false },
        { id: '4', name: '???', icon: '🔒', unlocked: false },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Text style={styles.title}>League</Text>

                {/* Rank Card */}
                <View style={styles.rankCard}>
                    <View style={styles.rankCardGradient}>
                        <View style={styles.rankHeader}>
                            <View>
                                <View style={styles.rankTitleRow}>
                                    <Text style={styles.rankIcon}>{userRank.icon}</Text>
                                    <Text style={styles.rankTitle}>{userRank.league} League</Text>
                                </View>
                                <Text style={styles.rankSubtitle}>Top 20% of users</Text>
                            </View>
                            <View style={styles.rankStats}>
                                <Text style={styles.rankMinutes}>{userRank.honestyMinutes}</Text>
                                <Text style={styles.rankLabel}>Honesty Mins</Text>
                            </View>
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.progressSection}>
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressLabel}>Progress</Text>
                                <Text style={styles.progressTarget}>
                                    {userRank.minutesToNext} mins to {userRank.nextLeague}
                                </Text>
                            </View>
                            <View style={styles.progressTrack}>
                                <View style={[styles.progressFill, { width: `${userRank.progress * 100}%` }]} />
                            </View>
                        </View>

                        {userRank.atRisk && (
                            <View style={styles.warningRow}>
                                <Text style={styles.warningIcon}>⚠️</Text>
                                <Text style={styles.warningText}>Risk of demotion: You need 15 mins</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Leaderboard */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Leaderboard</Text>
                        <Text style={styles.sectionSubtitle}>Updated 5m ago</Text>
                    </View>
                    <Card style={styles.leaderboardCard}>
                        {leaderboard.map((item, index) => (
                            <View
                                key={item.rank}
                                style={[
                                    styles.leaderboardItem,
                                    item.isUser && styles.leaderboardItemUser,
                                    index < leaderboard.length - 1 && styles.leaderboardItemBorder,
                                ]}
                            >
                                <Text style={[styles.rank, item.rank === 1 && styles.rankGold]}>
                                    {item.rank}
                                </Text>
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>{item.name[0]}</Text>
                                </View>
                                <Text style={[styles.leaderboardName, item.isUser && styles.leaderboardNameUser]}>
                                    {item.name}
                                </Text>
                                <View style={styles.leaderboardRight}>
                                    <Text style={[styles.leaderboardMinutes, item.isUser && styles.leaderboardMinutesUser]}>
                                        {item.minutes}m
                                    </Text>
                                    <Text style={styles.trendIcon}>
                                        {item.trend === 'up' ? '⬆️' : item.trend === 'down' ? '⬇️' : '➖'}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </Card>
                </View>

                {/* Badges */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Badges</Text>
                        <Text style={styles.viewAll}>View All</Text>
                    </View>
                    <View style={styles.badgesGrid}>
                        {badges.map((badge) => (
                            <View key={badge.id} style={[styles.badge, !badge.unlocked && styles.badgeLocked]}>
                                <View style={styles.badgeIcon}>
                                    <Text style={styles.badgeEmoji}>{badge.icon}</Text>
                                </View>
                                <Text style={styles.badgeName}>{badge.name}</Text>
                            </View>
                        ))}
                    </View>
                </View>
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
        paddingBottom: Spacing.xl,
    },
    title: {
        fontSize: Typography.h1.fontSize,
        fontWeight: Typography.h1.fontWeight,
        color: Colors.text.primary,
        lineHeight: Typography.h1.lineHeight,
        marginBottom: Spacing.xl,
        marginTop: Spacing.lg,
    },
    rankCard: {
        marginBottom: Spacing.xl,
    },
    rankCardGradient: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.xl,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    rankHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.lg,
    },
    rankTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: 4,
    },
    rankIcon: {
        fontSize: 24,
    },
    rankTitle: {
        fontSize: Typography.h2.fontSize,
        fontWeight: '700',
        color: '#6B7280',
    },
    rankSubtitle: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.secondary,
    },
    rankStats: {
        alignItems: 'flex-end',
    },
    rankMinutes: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    rankLabel: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.secondary,
    },
    progressSection: {
        marginBottom: Spacing.sm,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    progressLabel: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    progressTarget: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
        color: Colors.primary,
    },
    progressTrack: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#9CA3AF',
        borderRadius: 4,
    },
    warningRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: Spacing.md,
    },
    warningIcon: {
        fontSize: 16,
    },
    warningText: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
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
    viewAll: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
        color: Colors.primary,
    },
    leaderboardCard: {
        padding: 0,
        overflow: 'hidden',
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
    },
    leaderboardItemUser: {
        backgroundColor: Colors.primaryLight,
    },
    leaderboardItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
    },
    rank: {
        width: 24,
        fontSize: Typography.body.fontSize,
        fontWeight: '700',
        color: Colors.text.secondary,
        textAlign: 'center',
    },
    rankGold: {
        color: '#F59E0B',
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.border.default,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: Spacing.md,
    },
    avatarText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    leaderboardName: {
        flex: 1,
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    leaderboardNameUser: {
        color: Colors.primary,
    },
    leaderboardRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    leaderboardMinutes: {
        fontSize: Typography.body.fontSize,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    leaderboardMinutesUser: {
        color: Colors.primary,
    },
    trendIcon: {
        fontSize: 16,
        width: 16,
        textAlign: 'center',
    },
    badgesGrid: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    badge: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    badgeLocked: {
        opacity: 0.5,
    },
    badgeIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#FDE68A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeEmoji: {
        fontSize: 24,
    },
    badgeName: {
        fontSize: Typography.small.fontSize,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
});
