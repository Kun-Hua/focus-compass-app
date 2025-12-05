import AddGoalModal from '@/components/vision/AddGoalModal';
import DraggableGoalItem from '@/components/vision/DraggableGoalItem';
import EditGoalModal from '@/components/vision/EditGoalModal';
import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { useAuth } from '@/contexts/AuthContext';
import { goalsApi } from '@/services/goalsApi';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define interfaces locally if not imported
interface UIGoal {
    id: string;
    name: string;
    description?: string;
    status: 'core' | 'avoid';
}

export default function VisionScreen() {
    const { user } = useAuth();
    const [goals, setGoals] = useState<UIGoal[]>([]);
    const [isAddModalVisible, setAddModalVisible] = useState(false);
    const [editingGoal, setEditingGoal] = useState<UIGoal | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [listKey, setListKey] = useState(0);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            console.log('[loadData] Starting to load goals...');
            const [core, avoid] = await Promise.all([
                goalsApi.getCoreGoals(user.id),
                goalsApi.getAvoidanceGoals(user.id),
            ]);

            console.log('[loadData] Raw core goals from DB:', core.map(g => ({ id: g.goal_id, name: g.goal_name, order: g.display_order })));
            console.log('[loadData] Raw avoid goals from DB:', avoid.map(g => ({ id: g.goal_id, name: g.goal_name, order: g.display_order })));

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

            console.log('[loadData] Setting goals state with:', { coreCount: coreUiGoals.length, avoidCount: avoidUiGoals.length });
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

    const onDragEnd = async ({ data, from, to }: { data: UIGoal[]; from: number; to: number }) => {
        console.log('=== DRAG DEBUG ===');
        console.log(`From: ${from}, To: ${to}`);

        const draggedItem = data[to];  // data is reordered, so dragged item is now at 'to'
        const targetItem = data[from]; // item that shifted into the old position
        console.log(`Dragged Item (at to=${to}):`, draggedItem);
        console.log(`Item at from=${from}:`, targetItem);

        // Prevent dragging headers and empty states
        if (draggedItem.id.startsWith('header-') || draggedItem.id.startsWith('empty-')) {
            console.log('REJECTED: Trying to drag header or empty state');
            await loadData();
            setListKey(prev => prev + 1);
            return;
        }

        // Find header positions in the NEW data array (after drag)
        const coreHeaderIndex = data.findIndex(item => item.id === 'header-core');
        const avoidHeaderIndex = data.findIndex(item => item.id === 'header-avoid');

        console.log(`Core Header Index: ${coreHeaderIndex}, Avoid Header Index: ${avoidHeaderIndex}`);
        console.log(`Data:`, data.map((item, idx) => ({ idx, id: item.id, name: item.name })));

        // Validate positions based on header locations
        // Valid positions: (coreHeaderIndex, avoidHeaderIndex) or (avoidHeaderIndex, end)
        const isInCoreSection = to > coreHeaderIndex && to < avoidHeaderIndex;
        const isInAvoidSection = to > avoidHeaderIndex;

        if (!isInCoreSection && !isInAvoidSection) {
            console.log(`REJECTED: Position ${to} is not valid. Must be between headers or after avoid header`);
            Alert.alert('Invalid Position', 'Goals must be placed within a section');
            await loadData();
            setListKey(prev => prev + 1);
            return;
        }

        console.log(`VALIDATION PASSED - Position ${to} is valid (Core: ${isInCoreSection}, Avoid: ${isInAvoidSection})`);

        // NEW LOGIC: Assign category based on position
        // Between core header and avoid header = Core
        // After avoid header = Avoidance
        const updates: { goal_id: string; display_order: number; goal_category: 'Core' | 'Avoidance' }[] = [];

        let coreOrder = 0;
        let avoidOrder = 0;

        data.forEach((item, index) => {
            // Skip headers and empty states
            if (item.id.startsWith('header-') || item.id.startsWith('empty-')) {
                return;
            }

            // Determine category based on position
            let category: 'Core' | 'Avoidance';
            let displayOrder: number;

            if (index > coreHeaderIndex && index < avoidHeaderIndex) {
                // Between core and avoid headers = Core goal
                category = 'Core';
                displayOrder = ++coreOrder;
            } else if (index > avoidHeaderIndex) {
                // After avoid header = Avoidance goal
                category = 'Avoidance';
                displayOrder = ++avoidOrder;
            } else {
                // This shouldn't happen due to validation, but handle it
                console.warn(`Unexpected position for item ${item.id} at index ${index}`);
                return;
            }

            updates.push({
                goal_id: item.id,
                display_order: displayOrder,
                goal_category: category
            });
        });

        console.log('Updates to apply:', updates);

        try {
            await goalsApi.updateBatch(updates);
            await loadData();
        } catch (err: any) {
            console.error('[onDragEnd] Failed to update order:', err);
            Alert.alert('Reorder Failed', 'Failed to save new order');
            loadData();
        }
    };

    const renderItem = ({ item, drag, isActive }: RenderItemParams<UIGoal>) => {
        // Render Core Goals header (non-draggable)
        if (item.id === 'header-core') {
            return (
                <View style={styles.sectionHeaderWrapper} pointerEvents="box-only">
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Core Goals</Text>
                        <TouchableOpacity onPress={() => setAddModalVisible(true)}>
                            <Text style={styles.addButtonIcon}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        // Render Avoidance Goals header (non-draggable)
        if (item.id === 'header-avoid') {
            return (
                <View style={styles.sectionHeaderWrapper} pointerEvents="box-only">
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Avoidance Goals</Text>
                    </View>
                </View>
            );
        }

        // Render empty state for Core Goals (non-draggable)
        if (item.id === 'empty-core') {
            return (
                <View style={styles.emptyStateWrapper} pointerEvents="box-only">
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No core goals yet</Text>
                    </View>
                </View>
            );
        }

        // Render empty state for Avoidance Goals (non-draggable)
        if (item.id === 'empty-avoid') {
            return (
                <View style={styles.emptyStateWrapper} pointerEvents="box-only">
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No avoidance goals yet</Text>
                    </View>
                </View>
            );
        }

        // Render draggable goal item
        return (
            <View style={styles.goalItemContainer}>
                <DraggableGoalItem
                    item={item}
                    drag={drag}
                    isActive={isActive}
                    onEdit={(goal) => setEditingGoal(goal)}
                    onDelete={(goal) => handleDeleteGoal(goal.id)}
                    onLongPress={drag}
                />
            </View>
        );
    };

    const cleanGoals = goals.filter(g => !g.id.startsWith('separator-') && !g.id.startsWith('header-') && !g.id.startsWith('empty-'));
    const coreGoals = cleanGoals.filter(g => g.status === 'core');
    const avoidGoals = cleanGoals.filter(g => g.status === 'avoid');

    console.log('[listData] goals state:', goals.map(g => ({ id: g.id, name: g.name, status: g.status })));
    console.log('[listData] coreGoals:', coreGoals.map(g => ({ id: g.id, name: g.name })));
    console.log('[listData] avoidGoals:', avoidGoals.map(g => ({ id: g.id, name: g.name })));

    const listData = [
        { id: 'header-core', name: '', status: 'core' as const },
        ...(coreGoals.length > 0 ? coreGoals : [{ id: 'empty-core', name: '', status: 'core' as const }]),
        { id: 'header-avoid', name: '', status: 'avoid' as const },
        ...(avoidGoals.length > 0 ? avoidGoals : [{ id: 'empty-avoid', name: '', status: 'avoid' as const }]),
    ];

    console.log('[listData] Final listData:', listData.map(item => ({ id: item.id, name: item.name, status: item.status })));

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.title}>Vision</Text>
                </View>

                {error && (
                    <TouchableOpacity onPress={loadData} style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error} - Tap to retry</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.listContainer}>
                    <DraggableFlatList
                        key={listKey}
                        data={listData}
                        onDragEnd={onDragEnd}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                </View>

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
        </GestureHandlerRootView>
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
    sectionHeaderWrapper: {
        // Wrapper to prevent dragging
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
        marginTop: Spacing.md,
        paddingVertical: Spacing.xs,
    },
    sectionTitle: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    addButtonIcon: {
        fontSize: 24,
        color: Colors.primary,
        fontWeight: '300',
    },
    emptyStateWrapper: {
        // Wrapper to prevent dragging
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xl,
        backgroundColor: Colors.surface + '40',
        borderRadius: 12,
        marginBottom: Spacing.md,
    },
    emptyText: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.secondary,
    },
    goalItemContainer: {
        marginBottom: Spacing.sm,
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
