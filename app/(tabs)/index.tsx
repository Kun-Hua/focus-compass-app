import AddGoalModal from '@/components/vision/AddGoalModal';
import AvoidanceGoalsList from '@/components/vision/AvoidanceGoalsList';
import CoreGoalsList from '@/components/vision/CoreGoalsList';
import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { useAuth } from '@/contexts/AuthContext';
import { goalPlansApi } from '@/services/goalPlansApi';
import { goalsApi } from '@/services/goalsApi';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define interfaces locally if not imported
interface UIGoal {
    id: string;
    name: string;
    description?: string;
    status: 'core' | 'avoid';
}

interface GoalPlan {
    goalId: string;
    annualGoal: string;
    quarterlyGoal: string;
    monthlyGoal: string;
    weeklyGoal: string;
    weeklyCommitmentHours: number;
}

export default function VisionScreen() {
    const { user } = useAuth();
    const [coreGoals, setCoreGoals] = useState<UIGoal[]>([]);
    const [avoidGoals, setAvoidGoals] = useState<UIGoal[]>([]);
    const [goalBreakdowns, setGoalBreakdowns] = useState<Map<string, GoalPlan>>(new Map());
    const [isAddModalVisible, setAddModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const [core, avoid, plans] = await Promise.all([
                goalsApi.getCoreGoals(user.id),
                goalsApi.getAvoidanceGoals(user.id),
                goalPlansApi.getAll(user.id),
            ]);

            const coreUiGoals: UIGoal[] = core.map(g => ({
                id: g.goal_id,
                name: g.goal_name,
                description: g.description,
                status: 'core',
            }));

            const avoidUiGoals: UIGoal[] = avoid.map(g => ({
                id: g.goal_id,
                name: g.goal_name,
                description: g.description,
                status: 'avoid',
            }));

            const breakdownMap = new Map<string, GoalPlan>();
            plans.forEach(p => {
                breakdownMap.set(p.goal_id, {
                    goalId: p.goal_id,
                    annualGoal: p.annual_goal || '',
                    quarterlyGoal: p.quarterly_goal || '',
                    monthlyGoal: p.monthly_goal || '',
                    weeklyGoal: p.weekly_goal || '',
                    weeklyCommitmentHours: p.weekly_commitment_hours || 0,
                });
            });

            setCoreGoals(coreUiGoals);
            setAvoidGoals(avoidUiGoals);
            setGoalBreakdowns(breakdownMap);

        } catch (err: any) {
            console.error('Failed to load data:', err);
            setError(err.message || 'Failed to load data, please try again later');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user]);

    const handleAddGoal = async (goal: { name: string; description?: string; type: 'core' | 'avoid' }) => {
        if (!user) return;
        try {
            await goalsApi.create({
                user_id: user.id,
                goal_name: goal.name,
                description: goal.description,
                is_core: goal.type === 'core',
            });
            loadData(); // Reload data
        } catch (err: any) {
            console.error('Failed to create goal:', err);
            Alert.alert('Creation Failed', err.message || 'Please try again later');
        }
    };

    const handleBreakdownUpdate = async (goalId: string, breakdown: GoalPlan) => {
        if (!user) return;
        try {
            // Optimistic update
            setGoalBreakdowns(prev => {
                const newMap = new Map(prev);
                newMap.set(goalId, breakdown);
                return newMap;
            });

            await goalPlansApi.upsert({
                user_id: user.id,
                goal_id: goalId,
                annual_goal: breakdown.annualGoal,
                quarterly_goal: breakdown.quarterlyGoal,
                monthly_goal: breakdown.monthlyGoal,
                weekly_goal: breakdown.weeklyGoal,
                weekly_commitment_hours: breakdown.weeklyCommitmentHours,
            });
        } catch (err: any) {
            console.error('Failed to update breakdown:', err);
            Alert.alert('Update Failed', 'Failed to save changes');
            loadData(); // Revert on error
        }
    };

    const handleGoalPress = (goal: UIGoal) => {
        // Handle goal press if needed
        console.log('Goal pressed:', goal.name);
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
                    <Text style={styles.title}>Vision</Text>
                    <TouchableOpacity onPress={() => setAddModalVisible(true)}>
                        <Text style={styles.addButtonIcon}>+</Text>
                    </TouchableOpacity>
                </View>

                {error && (
                    <TouchableOpacity onPress={loadData} style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error} - Tap to retry</Text>
                    </TouchableOpacity>
                )}

                {/* Core Goals List */}
                <CoreGoalsList
                    coreGoals={coreGoals}
                    goalBreakdowns={goalBreakdowns}
                    onGoalPress={handleGoalPress}
                    onBreakdownUpdate={handleBreakdownUpdate}
                />

                {/* Avoidance Goals List */}
                <AvoidanceGoalsList
                    avoidGoals={avoidGoals}
                    onGoalPress={handleGoalPress}
                />
            </ScrollView>

            <AddGoalModal
                visible={isAddModalVisible}
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
    addButtonIcon: {
        fontSize: 32,
        color: Colors.primary,
        fontWeight: '300',
    },
    errorContainer: {
        padding: Spacing.md,
        backgroundColor: Colors.error + '20',
        borderRadius: 8,
        marginBottom: Spacing.md,
    },
    errorText: {
        color: Colors.error,
        textAlign: 'center',
    },
});
