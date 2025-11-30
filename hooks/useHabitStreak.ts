'use client';

import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabaseClient';

interface HabitStreakState {
  currentStreak: number;
  didCompleteToday: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useHabitStreak = (initialRefreshKey: number = 0): HabitStreakState => {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [didCompleteToday, setDidCompleteToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(initialRefreshKey);

  const fetchStreakData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        setCurrentStreak(0);
        setDidCompleteToday(false);
        return;
      }
      const { data, error: fetchError } = await supabase
        .from('UserStats')
        .select('current_streak, last_streak_date')
        .eq('user_id', uid)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setCurrentStreak(0);
          setDidCompleteToday(false);
        } else {
          throw new Error(`?¥è©¢???ç´€?„å¤±?? ${fetchError.message}`);
        }
      }

      if (data) {
        const { current_streak, last_streak_date } = data;
        const todayInTaipei = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });
        const isCompletedToday = last_streak_date === todayInTaipei;

        if (!isCompletedToday) {
          const yesterdayInTaipei = new Date(
            new Date().setDate(new Date().getDate() - 1)
          ).toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });
          if (last_streak_date !== yesterdayInTaipei) {
            setCurrentStreak(0);
          } else {
            setCurrentStreak(current_streak || 0);
          }
        } else {
          setCurrentStreak(current_streak || 0);
        }

        setDidCompleteToday(isCompletedToday);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [refreshKey]);

  useEffect(() => {
    fetchStreakData();
  }, [fetchStreakData]);

  const refresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return { currentStreak, didCompleteToday, isLoading, error, refresh };
};

