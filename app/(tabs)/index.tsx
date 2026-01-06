import KPICards from '@/components/dashboard/KPICards';
import WeeklyStreak from '@/components/dashboard/WeeklyStreak';
import Card from '@/components/ui/Card';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { useAuth } from '@/contexts/AuthContext';
import { focusApi } from '@/services/focusApi';
import { goalPlansApi } from '@/services/goalPlansApi';
import { goalsApi } from '@/services/goalsApi';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatDuration } from '../../utils/time';

// ... (other imports)

export default function DashboardScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [focusSummary, setFocusSummary] = useState({
        todaySeconds: 0,
        weekSeconds: 0,
    });
    const [goalContributions, setGoalContributions] = useState<{ goalName: string; percentage: number }[]>([]);
    const [recentSessionsList, setRecentSessionsList] = useState<any[]>([]);
    const [weeklyStreak, setWeeklyStreak] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadDashboardData = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            // 並行載入所有資料
            const [todaySessions, recentSessions, coreGoals, goalPlans] = await Promise.all([
                focusApi.getTodaySessions(user.id) as Promise<any[]>,
                focusApi.getRecentSessions(user.id, 50) as Promise<any[]>,
                goalsApi.getCoreGoals(user.id),
                goalPlansApi.getAll(user.id),
            ]);

            // 計算今日專注時數
            const todaySeconds = todaySessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);

            // 計算本週專注時數 (簡單過濾最近 7 天)
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const weekSessions = recentSessions.filter((s: any) => new Date(s.created_at) > oneWeekAgo);
            const weekSeconds = weekSessions.reduce((sum: any, s: any) => sum + (s.duration_seconds || 0), 0);



            // 計算目標貢獻度 (Based on seconds for precision)
            const goalMap = new Map<string, number>();
            weekSessions.forEach((s: any) => {
                const current = goalMap.get(s.goal_id) || 0;
                goalMap.set(s.goal_id, current + (s.duration_seconds || 0));
            });

            const contributions = coreGoals
                .map(g => ({
                    goalName: g.goal_name,
                    seconds: goalMap.get(g.goal_id) || 0,
                }))
                .filter(c => c.seconds > 0)
                .map(c => ({
                    goalName: c.goalName,
                    percentage: weekSeconds > 0 ? Math.round((c.seconds / weekSeconds) * 100) : 0,
                }))
                .sort((a, b) => b.percentage - a.percentage)
                .slice(0, 5); // 只取前 5 名

            // 計算週連勝 (簡單模擬：如果本週有專注紀錄，則連勝 +1)
            // TODO: 實作更精確的週連勝邏輯 (檢查是否達成每週承諾)
            // TODO: 實作更精確的週連勝邏輯 (檢查是否達成每週承諾)
            const streak = weekSeconds > 0 ? 4 : 0; // Mock value for now if active

            setFocusSummary({ todaySeconds, weekSeconds });
            setGoalContributions(contributions);
            setWeeklyStreak(streak);
            setRecentSessionsList(recentSessions);

        } catch (err: any) {
            console.error('Failed to load dashboard data:', err);
            setError(err.message || '載入失敗，請稍後再試');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            loadDashboardData();
        }, [loadDashboardData])
    );

    if (!user) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <Text>Please sign in to view dashboard</Text>
            </SafeAreaView>
        );
    }

    if (loading) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <Text style={styles.loadingText}>Loading dashboard...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    const kpiCardsData = [
        { label: 'Weekly Hours', actual: Math.round((focusSummary.weekSeconds / 3600) * 10) / 10, planned: 6.0, unit: 'h' },
    ];

    // Mock MIT for now (TODO: implement MIT selection)
    const todayMIT = {
        name: 'No MIT set',
        goalTag: 'Core Goal',
        goalId: '0',
    };

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
                    <TouchableOpacity onPress={() => router.push('/(tabs)/settings' as any)}>
                        <Text style={styles.settingsIcon}>⚙️</Text>
                    </TouchableOpacity>
                </View>

                {/* MIT Card */}
                {/* <MITCard task={todayMIT} /> */}

                {/* KPI Cards */}
                <KPICards data={kpiCardsData} />

                {/* Weekly Streak */}
                <WeeklyStreak streak={weeklyStreak} onTrack={weeklyStreak > 0} />

                {/* Contribution Chart */}
                <Card style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <Text style={styles.chartTitle}>Contribution</Text>
                        <Text style={styles.chartSubtitle}>Top 5 Core</Text>
                    </View>
                    <View style={styles.chartBars}>
                        {goalContributions.length > 0 ? (
                            goalContributions.map((c, i) => (
                                <ChartBar key={i} label={c.goalName} percentage={c.percentage} />
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No focus records this week</Text>
                        )}
                    </View>
                </Card>

                {/* Diagnostic Card */}
                <Card style={styles.diagnosticCard} borderColor={Colors.error}>
                    <Text style={styles.diagnosticTitle}>Distraction Alert</Text>
                    <Text style={styles.diagnosticText}>
                        You are often interrupted by 'Social Media' around 2 PM.
                    </Text>
                </Card>

                {/* Recent History */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent</Text>
                    {/* Could add 'See All' here */}
                </View>

                <View style={styles.historyList}>
                    {recentSessionsList.slice(0, 5).map((session: any) => (
                        <View key={session.session_id} style={styles.historyItem}>
                            <View style={styles.historyInfo}>
                                <Text style={styles.historyTime}>{new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                <Text style={styles.historyDuration}>{formatDuration(session.duration_seconds || 0)}</Text>
                                <Text style={styles.historyMode}>
                                    {session.mode === 'Pomodoro' ? '🍅' : session.mode === 'Timelapse' ? '📷' : '⏱️'}
                                </Text>
                            </View>

                            {session.video_path && (
                                <TouchableOpacity
                                    style={styles.videoButton}
                                    onPress={async () => {
                                        try {
                                            const url = await focusApi.getVideoUrl(session.video_path);
                                            if (url) {
                                                // Using Linking to open the video (or could use a video player modal)
                                                // For "re-download", opening in browser allows native save.
                                                // Or we could use MediaLibrary if we downloaded it.
                                                // Let's open in browser/system player for simplicity first.
                                                const { Linking } = require('react-native');
                                                Linking.openURL(url);
                                            } else {
                                                alert('Could not get video URL');
                                            }
                                        } catch (e) {
                                            console.error(e);
                                            alert('Error opening video');
                                        }
                                    }}
                                >
                                    <Text style={styles.videoButtonText}>▶ Video</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                    {recentSessionsList.length === 0 && (
                        <Text style={styles.emptyText}>No recent sessions</Text>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

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
        fontSize: Typography.body.fontSize,
        color: Colors.text.secondary,
        marginTop: 4,
    },
    settingsIcon: {
        fontSize: 24,
    },
    chartCard: {
        marginBottom: Spacing.xl,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    chartTitle: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    chartSubtitle: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.secondary,
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
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    loadingText: {
        marginTop: Spacing.md,
        fontSize: Typography.body.fontSize,
        color: Colors.text.secondary,
    },
    errorText: {
        fontSize: Typography.body.fontSize,
        color: Colors.error,
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },
    retryButton: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        backgroundColor: Colors.primary,
        borderRadius: 8,
    },
    retryButtonText: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.surface,
    },
    emptyText: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.tertiary,
        textAlign: 'center',
        paddingVertical: Spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
        marginTop: Spacing.lg,
    },
    sectionTitle: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    historyList: {
        marginBottom: Spacing.xxl,
        gap: Spacing.sm,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    historyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    historyTime: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.tertiary,
        width: 60,
    },
    historyDuration: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
        width: 80,
    },
    historyMode: {
        fontSize: 16,
    },
    videoButton: {
        backgroundColor: Colors.primary + '20', // Fade
        paddingHorizontal: Spacing.md,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    videoButtonText: {
        fontSize: Typography.caption.fontSize,
        color: Colors.primary,
        fontWeight: '600',
    },
});
