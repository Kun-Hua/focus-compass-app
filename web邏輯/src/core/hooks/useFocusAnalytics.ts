'use client';

import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/core/lib/supabaseClient';
import type { FocusSessionLog } from '@/core/types/database';

interface FocusAnalytics {
  netCommittedMinutes: number;
  selfDeceptionMinutes: number;
  totalDurationMinutes: number;
  honestyRatio: number;
  isLoading: boolean;
  error: string | null;
  refreshAnalytics: () => void;
}

export const useFocusAnalytics = (): FocusAnalytics => {
  const [data, setData] = useState<Omit<FocusAnalytics, 'isLoading' | 'error' | 'refreshAnalytics'>>({
    netCommittedMinutes: 0,
    selfDeceptionMinutes: 0,
    totalDurationMinutes: 0,
    honestyRatio: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: logs, error: fetchError } = await supabase.from('FocusSessionLog').select('*');

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (!logs || logs.length === 0) {
        setData({
          netCommittedMinutes: 0,
          selfDeceptionMinutes: 0,
          totalDurationMinutes: 0,
          honestyRatio: 0,
        });
        setIsLoading(false);
        return;
      }

      let netMinutes = 0;
      let selfDeceptionMinutes = 0;

      (logs as FocusSessionLog[]).forEach((log) => {
        if (log.honesty_mode === true) {
          netMinutes += log.duration_minutes;
        } else {
          selfDeceptionMinutes += log.duration_minutes;
        }
      });

      const totalMinutes = netMinutes + selfDeceptionMinutes;
      const ratio = totalMinutes > 0 ? netMinutes / totalMinutes : 0;

      setData({
        netCommittedMinutes: netMinutes,
        selfDeceptionMinutes,
        totalDurationMinutes: totalMinutes,
        honestyRatio: parseFloat(ratio.toFixed(2)),
      });
    } catch (err: any) {
      console.error('Error fetching focus analytics:', err.message);
      setError(err.message);
      setData({
        netCommittedMinutes: 0,
        selfDeceptionMinutes: 0,
        totalDurationMinutes: 0,
        honestyRatio: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshAnalytics = useCallback(() => {
    calculateAnalytics();
  }, [calculateAnalytics]);

  useEffect(() => {
    calculateAnalytics();
  }, [calculateAnalytics]);

  return {
    ...data,
    isLoading,
    error,
    refreshAnalytics,
  };
};
