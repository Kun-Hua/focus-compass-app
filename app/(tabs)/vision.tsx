import AddGoalModal from '@/components/vision/AddGoalModal';
import DraggableGoalItem from '@/components/vision/DraggableGoalItem';
import EditGoalModal from '@/components/vision/EditGoalModal';
import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { useAuth } from '@/contexts/AuthContext';
import { goalsApi } from '@/services/goalsApi';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
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
    const [goals, setGoals] = useState<UIGoal[]>([]);
    const [isAddModalVisible, setAddModalVisible] = useState(false);
    const [editingGoal, setEditingGoal] = useState<UIGoal | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const [core, avoid] = await Promise.all([
                goalsApi.getCoreGoals(user.id),
                goalsApi.getAvoidanceGoals(user.id),
            ]);

            const coreUiGoals: UIGoal[] = core.map(g => ({
                id: g.goal_id,
                name: g.goal_name,
                description: g.goal_description,
                status: 'core',
            }));

            const avoidUiGoals: UIGoal[] = avoid.map(g => ({
                id: g.goal_id,
                name: g.goal_name,
                description: g.goal_description,
                status: 'avoid',
            }));

            setGoals([...coreUiGoals, ...avoidUiGoals]);
        } catch (err: any) {
            console.error('[VisionScreen] Failed to load data:', err);
            setError(err.message || 'Failed to load data');
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
            await goalsApi.create(user.id, {
                goal_name: goal.name,
                goal_description: goal.description,
                goal_category: goal.type === 'core' ? 'Core' : 'Avoidance',
            });
            await loadData();
        } catch (err: any) {
            Alert.alert('Creation Failed', err.message);
        }
    };

    const handleUpdateGoal = async (goalId: string, updates: { name: string; description?: string }) => {
        try {
            await goalsApi.update(goalId, {
                goal_name: updates.name,
                goal_description: updates.description,
            });
            await loadData();
        } catch (err: any) {
            Alert.alert('Update Failed', err.message);
        }
    };

    const handleDeleteGoal = async (goalId: string) => {
        try {
            await goalsApi.delete(goalId);
            await loadData();
        } catch (err: any) {
            Alert.alert('Deletion Failed', err.message);
        }
    };

    const onDragEnd = async ({ data }: { data: UIGoal[] }) => {
        // Find the index of the Avoidance Header
        const avoidHeaderIndex = data.findIndex(item => item.id === 'header-avoid');

        const updates: { goal_id: string; display_order: number; goal_category: 'Core' | 'Avoidance' }[] = [];
        const newGoals = [...data];

        let currentOrder = 0;
        let currentCategory: 'Core' | 'Avoidance' = 'Core';

        data.forEach((item) => {
            if (item.id === 'header-core') {
                currentCategory = 'Core';
                return;
            }
            if (item.id === 'header-avoid') {
                currentCategory = 'Avoidance';
                return;
            }

            // It's a goal item
            currentOrder++;

            // Check if category changed
            if (item.status !== currentCategory.toLowerCase()) {
                // Update local item status for immediate feedback
                item.status = currentCategory.toLowerCase() as 'core' | 'avoid';
            }

            updates.push({
                goal_id: item.id,
                display_order: currentOrder,
                goal_category: currentCategory
            });
        });

        setGoals(newGoals.filter(g => !g.id.startsWith('header-'))); // Optimistic update, filter out headers

        try {
            await goalsApi.updateBatch(updates);
        } catch (err: any) {
            console.error('Failed to update order:', err);
            Alert.alert('Reorder Failed', 'Failed to save new order');
            loadData(); // Revert
        }
    };

    const renderItem = ({ item, drag, isActive }: RenderItemParams<UIGoal>) => {
        if (item.id.startsWith('header-')) {
            return (
                <View style={styles.headerContainer}>
                    <Text style={styles.headerTitle}>
                        {item.id === 'header-core' ? 'Core Goals' : 'Avoidance Goals'}
                    </Text>
                    {item.id === 'header-core' && (
                        <TouchableOpacity onPress={() => setAddModalVisible(true)}>
                            <Text style={styles.addButtonIcon}>+</Text>
                        </TouchableOpacity>
                    )}
                </View>
            );
        }

        return (
            <DraggableGoalItem
                item={item}
                drag={drag}
                isActive={isActive}
                onEdit={(goal) => setEditingGoal(goal)}
                onDelete={(goal) => handleDeleteGoal(goal.id)}
                onLongPress={drag}
            />
        );
    };

    // Prepare data with headers
    // We need to filter out headers from state if they exist to avoid duplication
    const cleanGoals = goals.filter(g => !g.id.startsWith('header-'));

    const listData = [
        { id: 'header-core', name: 'Core Goals', status: 'core' as const },
        ...cleanGoals.filter(g => g.status === 'core'),
        { id: 'header-avoid', name: 'Avoidance Goals', status: 'avoid' as const },
        ...cleanGoals.filter(g => g.status === 'avoid'),
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Vision</Text>
            </View>

            {error && (
                <TouchableOpacity onPress={loadData} style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error} - Tap to retry</Text>
                </TouchableOpacity>
            )}

            <DraggableFlatList
                data={listData}
                onDragEnd={onDragEnd}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                containerStyle={styles.listContainer}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            <AddGoalModal
                visible={isAddModalVisible}
                onClose={() => setAddModalVisible(false)}
                onAdd={handleAddGoal}
            />

            <EditGoalModal
                visible={!!editingGoal}
                goal={editingGoal}
                userId={user?.id || null}
                onClose={() => setEditingGoal(null)}
                onSave={handleUpdateGoal}
                onDelete={handleDeleteGoal}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    title: {
        fontSize: Typography.h1.fontSize,
        fontWeight: Typography.h1.fontWeight,
        color: Colors.text.primary,
        lineHeight: Typography.h1.lineHeight,
    },
    listContainer: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.lg,
        marginBottom: Spacing.md,
        backgroundColor: Colors.background,
    },
    headerTitle: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    addButtonIcon: {
        fontSize: 24,
        color: Colors.primary,
        fontWeight: '300',
    },
    errorContainer: {
        margin: Spacing.md,
        padding: Spacing.md,
        backgroundColor: Colors.error + '20',
        borderRadius: 8,
    },
    errorText: {
        color: Colors.error,
        textAlign: 'center',
    },
});
