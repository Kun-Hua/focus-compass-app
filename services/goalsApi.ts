import { supabase } from '@/lib/supabaseClient';

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
    // ?²å?ä½¿ç”¨?…ç??€?‰ç›®æ¨?
    async getAll(userId: string): Promise<Goal[]> {
        const { data, error } = await supabase
            .from('Goal')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // ?²å? Core ?®æ?ï¼ˆæ?å¤?5 ?‹ï?
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

    // ?²å? Avoidance ?®æ?
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

    // å»ºç??®æ?
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

    // ?´æ–°?®æ?
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

    // ?ªé™¤?®æ?
    async delete(goalId: string): Promise<void> {
        const { error } = await supabase
            .from('Goal')
            .delete()
            .eq('goal_id', goalId);

        if (error) throw error;
    },
};

