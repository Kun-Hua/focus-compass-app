import AddGoalModal from '@/components/vision/AddGoalModal';
import CoreGoalsList from '@/components/vision/CoreGoalsList';
import GoalBreakdown, { GoalPlan } from '@/components/vision/GoalBreakdown';
import GoalSelector from '@/components/vision/GoalSelector';
import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { useAuth } from '@/core/context/AuthContext';
import { goalPlansApi } from '@/core/services/goalPlansApi';
import { goalsApi } from '@/core/services/goalsApi';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// UI 用的 Goal 類型
interface UIGoal {
    id: string;
    name: string;
    description?: string;
    status: 'core' | 'avoid';
}

export default function VisionScreen() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [addModalVisible, setAddModalVisible] = useState(false);

    const [coreGoals, setCoreGoals] = useState<UIGoal[]>([]);
    const [avoidGoals, setAvoidGoals] = useState<UIGoal[]>([]);
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
    const [goalBreakdowns, setGoalBreakdowns] = useState<Map<string, GoalPlan>>(new Map());

    // 載入資料
    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    // 自動選擇第一個 Core Goal
    useEffect(() => {
        if (coreGoals.length > 0 && !selectedGoalId) {
            setSelectedGoalId(coreGoals[0].id);
        }
    }, [coreGoals, selectedGoalId]);

    const loadData = async () => {
        if (!user) return;

        try {
        } catch (err: any) {
            console.error('Failed to load data:', err);
            setError(err.message || '載入失敗，請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    const handleAddGoal = async (name: string, category: 'Core' | 'Avoidance') => {
        if (!user) return;
        try {
            await goalsApi.create(user.id, {
                goal_name: name,
                goal_category: category,
            });
            // Reload data to show new goal
            loadData();
        } catch (err: any) {
            console.error('Failed to create goal:', err);
            Alert.alert('新增失敗', err.message || '請稍後再試');
        }
    };

    const handleBreakdownUpdate = async (goalId: string, breakdown: GoalPlan) => {
        if (!user) return;

        try {
            // 立即更新 UI
            const updated = new Map(goalBreakdowns);
            updated.set(goalId, breakdown);
            setGoalBreakdowns(updated);

            // 儲存到 Supabase
            await goalPlansApi.upsert(goalId, user.id, {
                annual_goal: breakdown.annualGoal,
                quarterly_goal: breakdown.quarterlyGoal,
                monthly_goal: breakdown.monthlyGoal,
                weekly_goal: breakdown.weeklyGoal,
                weekly_commitment_hours: breakdown.weeklyCommitmentHours,
            });
        } catch (err: any) {
            console.error('Failed to save goal plan:', err);
            Alert.alert('儲存失敗', err.message || '請稍後再試');
        }
    };

    const handleGoalPress = (goal: UIGoal) => {
        console.log('Goal pressed:', goal.name);
        // TODO: 未來可以開啟編輯 modal
    };

    // Loading 狀態
    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>載入中...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error 狀態
    if (error) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>❌ {error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadData}>
                        <Text style={styles.retryButtonText}>重試</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // 未登入狀態
    if (!user) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>請先登入</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Vision</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setAddModalVisible(true)}
                    >
                        <Text style={styles.addButtonIcon}>+</Text>
                    </TouchableOpacity>
                </View>

                {/* Core Goals List */}
                <CoreGoalsList
                    coreGoals={coreGoals}
                    avoidGoals={avoidGoals}
                    onGoalPress={handleGoalPress}
                />

                {/* Goal Breakdown Section */}
                {coreGoals.length > 0 && (
                    <View style={styles.breakdownSection}>
                        <Text style={styles.sectionTitle}>目標拆解</Text>
                        <Text style={styles.sectionSubtitle}>
                            將核心目標拆解為年/季/月/週的具體行動計畫
                        </Text>
                        <GoalSelector
                            coreGoals={coreGoals}
                            selectedGoalId={selectedGoalId}
                            onSelect={setSelectedGoalId}
                        />
                        {selectedGoalId && (
                            <GoalBreakdown
                                goal={coreGoals.find((g) => g.id === selectedGoalId)!}
                                breakdown={goalBreakdowns.get(selectedGoalId)}
                                onUpdate={handleBreakdownUpdate}
                            />
                        )}
                    </View>
                )}

                {/* Empty State */}
                {coreGoals.length === 0 && avoidGoals.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>還沒有任何目標</Text>
                        <Text style={styles.emptySubtext}>點擊右上角 + 新增第一個目標</Text>
                    </View>
                )}
            </ScrollView>

            <AddGoalModal
                visible={addModalVisible}
                onClose={() => setAddModalVisible(false)}
                onAdd={handleAddGoal}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
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
        alignItems: 'flex-end',
        marginBottom: Spacing.xl,
        marginTop: Spacing.lg,
    },
    title: {
        fontSize: Typography.h1.fontSize,
        fontWeight: Typography.h1.fontWeight,
        color: Colors.text.primary,
        lineHeight: Typography.h1.lineHeight,
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.text.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    addButtonIcon: {
        fontSize: 20,
        color: Colors.surface,
        fontWeight: '600',
    },
    breakdownSection: {
        marginTop: Spacing.xxl,
        gap: Spacing.md,
    },
    sectionTitle: {
        fontSize: Typography.h2.fontSize,
        fontWeight: Typography.h2.fontWeight,
        color: Colors.text.primary,
    },
    sectionSubtitle: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.secondary,
        marginBottom: Spacing.sm,
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
    emptyState: {
        paddingVertical: Spacing.xxl * 2,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: Typography.h2.fontSize,
        fontWeight: '600',
        color: Colors.text.secondary,
        marginBottom: Spacing.sm,
    },
    emptySubtext: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.tertiary,
    },
});
