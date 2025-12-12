import { supabase } from '@/lib/supabaseClient';

export interface FocusSession {
    user_id: string;
    goal_id: string;
    duration_minutes: number;
    honesty_mode: boolean;
    interruption_reason?: string | null;
    interruption_count?: number;
    mode?: 'Pomodoro' | 'Stopwatch' | 'Timelapse';
}

export interface FocusSessionLog {
    session_id: string;
    user_id: string;
    goal_id: string | null;
    start_time: string;
    duration_minutes: number;
    mode: string | null;
    honesty_mode: boolean;
    interruption_count: number;
    interruption_reason: string | null;
    created_at: string;
}

export const focusApi = {
    // Create a new focus session
    async create(session: FocusSession): Promise<FocusSessionLog> {
        const { data, error } = await supabase
            .from('FocusSessionLog')
            .insert({
                user_id: session.user_id,
                goal_id: session.goal_id,
                duration_minutes: session.duration_minutes,
                honesty_mode: session.honesty_mode,
                interruption_reason: session.interruption_reason || null,
                interruption_count: session.interruption_count || 0,
                mode: session.mode || 'Stopwatch',
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Get today's sessions for a user
    async getTodaySessions(userId: string): Promise<FocusSessionLog[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('FocusSessionLog')
            .select('*')
            .eq('user_id', userId)
            .gte('created_at', today.toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Get recent sessions for a user
    async getRecentSessions(userId: string, limit: number = 50): Promise<FocusSessionLog[]> {
        const { data, error } = await supabase
            .from('FocusSessionLog')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },

    // Get sessions for a specific goal
    async getSessionsByGoal(userId: string, goalId: string): Promise<FocusSessionLog[]> {
        const { data, error } = await supabase
            .from('FocusSessionLog')
            .select('*')
            .eq('user_id', userId)
            .eq('goal_id', goalId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Get sessions for a date range
    async getSessionsByDateRange(
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<FocusSessionLog[]> {
        const { data, error } = await supabase
            .from('FocusSessionLog')
            .select('*')
            .eq('user_id', userId)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Get total focus minutes for the current week
    async getWeeklyMinutes(userId: string): Promise<number> {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('FocusSessionLog')
            .select('duration_minutes')
            .eq('user_id', userId)
            .gte('created_at', startOfWeek.toISOString());

        if (error) throw error;

        return (data || []).reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    },
};
