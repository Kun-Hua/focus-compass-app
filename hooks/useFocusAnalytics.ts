import { supabase } from '@/lib/supabaseClient';
import { useCallback, useEffect, useState } from 'react';

export interface FocusAnalytics {
  totalMinutes: number;
  netCommittedMinutes: number;
  selfDeceptionMinutes: number;
  honestyRatio: number;
}

export function useFocusAnalytics(userId: string | null) {
  const [analytics, setAnalytics] = useState<FocusAnalytics>({
    totalMinutes: 0,
    netCommittedMinutes: 0,
    selfDeceptionMinutes: 0,
    honestyRatio: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAnalytics = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('FocusSessionLog')
        .select('duration_minutes, honesty_mode')
        .eq('user_id', userId);

      if (error) throw error;

      let total = 0;
      let net = 0;
      let deception = 0;

      data?.forEach((session) => {
        const duration = session.duration_minutes || 0;
        total += duration;
        if (session.honesty_mode) {
          net += duration;
        } else {
          deception += duration;
        }
      });

      setAnalytics({
        totalMinutes: total,
        netCommittedMinutes: net,
        selfDeceptionMinutes: deception,
        honestyRatio: total > 0 ? net / total : 0,
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
