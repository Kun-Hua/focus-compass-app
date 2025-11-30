import { supabase } from '@/lib/supabaseClient';
import { useCallback, useEffect, useState } from 'react';

export function useWeeklyStreak(userId: string | null) {
  const [streak, setStreak] = useState(0);
  const [achievedThisWeek, setAchievedThisWeek] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStreakData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Placeholder logic for weekly streak
      // In a real app, you'd calculate this based on GoalPlan vs FocusSessionLog
      const { data } = await supabase
        .from('FocusSessionLog')
        .select('duration_minutes, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const hasActivity = (data?.length ?? 0) > 0;
      setStreak(hasActivity ? 1 : 0);
      setAchievedThisWeek(hasActivity);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStreakData();
  }, [fetchStreakData]);

  return { streak, achievedThisWeek, loading, refresh: fetchStreakData };
}
