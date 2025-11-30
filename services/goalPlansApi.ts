import { supabase } from '@/lib/supabaseClient';

export interface GoalPlanDB {
    plan_id: string;
    goal_id: string;
    user_id: string;
    annual_goal: string | null;
    quarterly_goal: string | null;
    monthly_goal: string | null;
    weekly_goal: string | null;
    weekly_commitment_hours: number;
    created_at: string;
    updated_at: string;
}

export interface GoalPlanInput {
    annual_goal: string;
    quarterly_goal: string;
    monthly_goal: string;
    weekly_goal: string;
    weekly_commitment_hours: number;
}

export const goalPlansApi = {
    // ?²å??€?‰ç›®æ¨™è???
    async getAll(userId: string): Promise<GoalPlanDB[]> {
        const { data, error } = await supabase
            .from('commitment_goal_plans_v3')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        return data || [];
    },

    // ?²å??®ä??®æ?è¨ˆç•«
    async getByGoalId(goalId: string): Promise<GoalPlanDB | null> {
        const { data, error } = await supabase
            .from('commitment_goal_plans_v3')
            .select('*')
            .eq('goal_id', goalId)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    // Upsert ?®æ?è¨ˆç•«
    async upsert(goalId: string, userId: string, input: GoalPlanInput): Promise<GoalPlanDB> {
        const { data, error } = await supabase
            .from('commitment_goal_plans_v3')
            .upsert({
                goal_id: goalId,
                user_id: userId,
                annual_goal: input.annual_goal,
                quarterly_goal: input.quarterly_goal,
                monthly_goal: input.monthly_goal,
                weekly_goal: input.weekly_goal,
                weekly_commitment_hours: input.weekly_commitment_hours,
            }, {
                onConflict: 'goal_id'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // ?ªé™¤?®æ?è¨ˆç•«
    async delete(goalId: string): Promise<void> {
        const { error } = await supabase
            .from('commitment_goal_plans_v3')
            .delete()
            .eq('goal_id', goalId);

        if (error) throw error;
    },
};

