import { supabase } from '@/lib/supabaseClient';

export interface FocusSessionLog {
    session_id?: string;
    user_id: string;
    goal_id?: string | null;
    start_time?: string;
    duration_minutes: number;
    mode: 'Pomodoro' | 'Stopwatch' | 'Timelapse';
    honesty_mode: boolean;
    interruption_count: number;
    interruption_reason?: string;
}

export const focusApi = {
    // Âª∫Á??∞Á?Â∞àÊ≥®Á¥Ä??
    async createSession(log: FocusSessionLog) {
        const { data, error } = await supabase
            .from('FocusSessionLog')
            .insert({
                user_id: log.user_id,
                goal_id: log.goal_id,
                duration_minutes: log.duration_minutes,
                mode: log.mode,
                honesty_mode: log.honesty_mode,
                interruption_count: log.interruption_count,
                interruption_reason: log.interruption_reason,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // ?≤Â?‰ªäÊó•?ÑÂ?Ê≥®Á???
    async getTodaySessions(userId: string) {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        const { data, error } = await supabase
            .from('FocusSessionLog')
            .select('*')
            .eq('user_id', userId)
            .gte('created_at', `${today}T00:00:00`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // ?≤Â??ÄËøëÁ?Á¥Ä??(?®ÊñºÈ°ØÁ§∫Ê≠∑Âè≤)
    async getRecentSessions(userId: string, limit = 10) {
        const { data, error } = await supabase
            .from('FocusSessionLog')
            .select('*, Goal(goal_name, goal_category)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    }
};

