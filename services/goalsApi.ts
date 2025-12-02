import { supabase } from '@/lib/supabaseClient';

export interface Goal {
    goal_id: string;
    user_id: string;
    goal_name: string;
    goal_description?: string;
    goal_category: 'Core' | 'Avoidance';
    linked_role?: string;
    created_at: string;
    display_order?: number;
}

export interface CreateGoalInput {
    goal_name: string;
    goal_description?: string;
    goal_category: 'Core' | 'Avoidance';
    linked_role?: string;
}

export const goalsApi = {
    async getCoreGoals(userId: string): Promise<Goal[]> {
        const { data, error } = await supabase
            .from('Goal')
            .select('*')
            .eq('user_id', userId)
            .eq('goal_category', 'Core')
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async getAvoidanceGoals(userId: string): Promise<Goal[]> {
        const { data, error } = await supabase
            .from('Goal')
            .select('*')
            .eq('user_id', userId)
            .eq('goal_category', 'Avoidance')
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async create(userId: string, input: CreateGoalInput): Promise<Goal> {
        // Get max order to append to end
        const { data: maxOrderData } = await supabase
            .from('Goal')
            .select('display_order')
            .eq('user_id', userId)
            .eq('goal_category', input.goal_category)
            .order('display_order', { ascending: false })
            .limit(1)
            .single();

        const nextOrder = (maxOrderData?.display_order ?? 0) + 1;

        const { data, error } = await supabase
            .from('Goal')
            .insert({
                user_id: userId,
                ...input,
                display_order: nextOrder
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async update(goalId: string, updates: Partial<Goal>): Promise<Goal> {
        const { data, error } = await supabase
            .from('Goal')
            .update(updates)
            .eq('goal_id', goalId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(goalId: string): Promise<void> {
        const { error } = await supabase
            .from('Goal')
            .delete()
            .eq('goal_id', goalId);

        if (error) throw error;
    },

    async updateBatch(updates: { goal_id: string; display_order: number; goal_category: 'Core' | 'Avoidance' }[]): Promise<void> {
        const { error } = await supabase
            .from('Goal')
            .upsert(updates.map(u => ({
                goal_id: u.goal_id,
                display_order: u.display_order,
                goal_category: u.goal_category,
                updated_at: new Date().toISOString()
            })));

        if (error) throw error;
    }
};
