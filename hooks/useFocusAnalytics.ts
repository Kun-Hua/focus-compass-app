import { supabase } from '@/lib/supabaseClient';
import { useCallback, useEffect, useState } from 'react';

export interface FocusAnalytics {
  totalMinutes: number;
  totalSeconds: number;
}

export function useFocusAnalytics(userId: string | null) {
  const [analytics, setAnalytics] = useState<FocusAnalytics>({
    totalMinutes: 0,
    totalSeconds: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAnalytics = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('FocusSessionLog')
        .select('duration_seconds, honesty_mode')
        .eq('user_id', userId);

      if (error) throw error;

      let totalSeconds = 0;
      let netSeconds = 0;
      let deceptionSeconds = 0;

      data?.forEach((session) => {
        const duration = session.duration_seconds || 0;
        totalSeconds += duration;
      });

      setAnalytics({
        totalMinutes: Math.floor(totalSeconds / 60),
        totalSeconds: totalSeconds,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshAnalytics();
  }, [refreshAnalytics]);


  return { ...analytics, isLoading, error, refreshAnalytics };
}
