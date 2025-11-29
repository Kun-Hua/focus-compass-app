'use client';

import { useCallback, useEffect, useState } from 'react';

import { useGoalsContext } from '@/core/context/GoalsContext';
import { supabase } from '@/core/lib/supabaseClient';

interface WeeklyStreakState {
  weeklyStreak: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  achievedThisWeek: boolean;
}

export const useWeeklyStreak = (initialRefreshKey: number = 0): WeeklyStreakState => {
  const [weeklyStreak, setWeeklyStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(initialRefreshKey);
  const [achievedThisWeek, setAchievedThisWeek] = useState(false);

  const { coreTop5, goalPlans } = useGoalsContext();

  const fetchStreakData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const weeksBack = 16;
      const since = new Date();
      since.setDate(since.getDate() - 7 * weeksBack);
      const coreIds = coreTop5.map((g) => g.goal_id);
      if (coreIds.length === 0) {
        setWeeklyStreak(0);
        setAchievedThisWeek(false);
        setIsLoading(false);
        return;
      }
      const { data: logs, error: logsError } = await supabase
        .from('FocusSessionLog')
        .select('goal_id, duration_minutes, created_at')
        .in('goal_id', coreIds)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false });
      if (logsError) throw logsError;

      const weekStart = (d: Date) => {
        const dt = new Date(d);
        const day = dt.getDay();
        const diffToMonday = (day + 6) % 7;
        dt.setDate(dt.getDate() - diffToMonday);
        dt.setHours(0, 0, 0, 0);
        return dt;
      };

      const perWeekPerGoal = new Map<string, Map<string, number>>();
      (logs || []).forEach((l: any) => {
        const d = new Date(l.created_at);
        const w = weekStart(d).toISOString().slice(0, 10);
        if (!perWeekPerGoal.has(w)) perWeekPerGoal.set(w, new Map());
        const gmap = perWeekPerGoal.get(w)!;
        const gid = l.goal_id as string;
        if (!gid) return;
        gmap.set(gid, (gmap.get(gid) || 0) + (l.duration_minutes || 0));
      });

      const targets = coreTop5
        .map((g) => {
          const plan = goalPlans.find((p) => p.goalId === g.goal_id);
          const hrs = Number(plan?.plans.weeklyHours || 0);
          return { goalId: g.goal_id, minutes: Math.max(0, Math.round(hrs * 60)) };
        })
        .filter((t) => t.minutes > 0);

      if (targets.length === 0) {
        setWeeklyStreak(0);
        setAchievedThisWeek(false);
        return;
      }

      const weeks: string[] = [];
      const now = new Date();
      let w = weekStart(now);
      for (let i = 0; i < weeksBack; i++) {
        weeks.push(w.toISOString().slice(0, 10));
        w = new Date(w);
        w.setDate(w.getDate() - 7);
      }

      const met: boolean[] = weeks.map((weekKey) => {
        const gmap = perWeekPerGoal.get(weekKey) || new Map();
        return targets.every((t) => (gmap.get(t.goalId) || 0) >= t.minutes);
      });

      setAchievedThisWeek(met[0] === true);

      let streak = 0;
      for (const hit of met) {
        if (hit) streak += 1;
        else break;
      }
      setWeeklyStreak(streak);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [refreshKey, coreTop5.map((g) => g.goal_id).join(','), JSON.stringify(goalPlans.map((p) => ({ id: p.goalId, wh: p.plans.weeklyHours }))) ]);

  useEffect(() => {
    fetchStreakData();
  }, [fetchStreakData]);

  const refresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return { weeklyStreak, isLoading, error, refresh, achievedThisWeek };
};
