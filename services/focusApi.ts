import { supabase } from '@/lib/supabaseClient';

export interface FocusSession {
    user_id: string;
    goal_id: string;
    duration_minutes?: number; // Deprecated, but optional for backward compact
    duration_seconds: number;
    honesty_mode: boolean;
    interruption_reason?: string | null;
    interruption_count?: number;
    mode?: 'Pomodoro' | 'Stopwatch' | 'Timelapse';
    video_path?: string | null;
}

export interface FocusSessionLog {
    session_id: string;
    user_id: string;
    goal_id: string | null;
    start_time: string;
    duration_minutes: number;
    duration_seconds: number;
    mode: string | null;
    honesty_mode: boolean;
    interruption_count: number;
    interruption_reason: string | null;
    video_path?: string | null;
    created_at: string;
}

export const focusApi = {
    // Create a new focus session
    async create(session: FocusSession): Promise<FocusSessionLog> {
        const payload = {
            user_id: session.user_id,
            goal_id: session.goal_id,
            // Strict number casting to prevent NaN which serializes to null in JSON
            duration_minutes: Math.floor(Number(session.duration_seconds || 0) / 60) || 0,
            duration_seconds: Number(session.duration_seconds || 0),
            honesty_mode: session.honesty_mode,
            interruption_reason: session.interruption_reason || null,
            interruption_count: session.interruption_count || 0,
            mode: session.mode || 'Stopwatch',
            video_path: session.video_path || null,
        };
        console.log('[focusApi] Creating session with payload:', payload);

        const { data, error } = await supabase
            .from('FocusSessionLog')
            .insert(payload)
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
            .select('duration_seconds')
            .eq('user_id', userId)
            .gte('created_at', startOfWeek.toISOString());

        if (error) throw error;

        const totalSeconds = (data || []).reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
        return Math.floor(totalSeconds / 60);
    },

    // Upload video to Supabase Storage
    async uploadVideo(userId: string, uri: string): Promise<string | null> {
        try {
            const formData = new FormData();
            const filename = `${userId}/${Date.now()}.mp4`;

            // Expo Camera produces weird URIs sometimes, normal fetch blobbing works best
            // But React Native requires FormData for file uploads usually
            const file = {
                uri: uri,
                name: filename,
                type: 'video/mp4',
            } as any;

            const { data, error } = await supabase.storage
                .from('focus-videos')
                .upload(filename, file);

            if (error) {
                console.error('[focusApi] Upload error details:', error);
                throw error;
            }

            console.log('[focusApi] Upload success:', data?.path);
            return data?.path || null;
        } catch (error) {
            console.error('[focusApi] Upload failed:', error);
            // Don't block saving the session if upload fails
            return null;
        }
    },

    // Get signed URL for video download
    async getVideoUrl(path: string): Promise<string | null> {
        if (!path) return null;
        try {
            const { data, error } = await supabase.storage
                .from('focus-videos')
                .createSignedUrl(path, 3600); // Valid for 1 hour

            if (error) throw error;
            return data?.signedUrl || null;
        } catch (error) {
            console.error('[focusApi] Get URL failed:', error);
            return null;
        }
    },
};
