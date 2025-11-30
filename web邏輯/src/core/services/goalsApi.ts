import { supabase } from '@/core/lib/supabaseClient';

export interface Goal {
    goal_id: string;
    user_id: string;
    goal_name: string;
    goal_description?: string;
    goal_category: 'Core' | 'Avoidance';
    linked_role?: string;
    goal_tags?: string[];
    created_at: string;
    updated_at: string;
}

export interface CreateGoalInput {
    goal_name: string;
    goal_description?: string;
    goal_category: 'Core' | 'Avoidance';
    linked_role?: string;
}

export interface UpdateGoalInput {
    goal_name?: string;
    goal_description?: string;
    goal_category?: 'Core' | 'Avoidance';
    linked_role?: string;
}

export const goalsApi = {
    // 獲取使用者的所有目標
    async getAll(userId: string): Promise<Goal[]> {
        const { data, error } = await supabase
            .from('Goal')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // 獲取 Core 目標（最多 5 個）
    async getCoreGoals(userId: string): Promise<Goal[]> {
        const { data, error } = await supabase
            .from('Goal')
            .select('*')
            .eq('user_id', userId)
            .eq('goal_category', 'Core')
            .order('created_at', { ascending: true })
            .limit(5);

        if (error) throw error;
        return data || [];
    },

    // 獲取 Avoidance 目標
    async getAvoidanceGoals(userId: string): Promise<Goal[]> {
        const { data, error } = await supabase
            .from('Goal')
            .select('*')
            .eq('user_id', userId)
            .eq('goal_category', 'Avoidance')
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // 建立目標
    async create(userId: string, input: CreateGoalInput): Promise<Goal> {
        const { data, error } = await supabase
            .from('Goal')
            .insert({
                user_id: userId,
                ...input,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 更新目標
    async update(goalId: string, input: UpdateGoalInput): Promise<Goal> {
        const { data, error } = await supabase
            .from('Goal')
            .update(input)
            .eq('goal_id', goalId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 刪除目標
    async delete(goalId: string): Promise<void> {
        const { error } = await supabase
            .from('Goal')
            .delete()
            .eq('goal_id', goalId);

        if (error) throw error;
    },
};
