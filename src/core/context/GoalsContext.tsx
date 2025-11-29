'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useGoals as useSupabaseGoals } from '@/core/hooks/useGoals';
import { supabase } from '@/core/lib/supabaseClient';
import type { CalendarStore, FocusSessionLog, Goal } from '@/core/types/database';
import { asyncStorageDriver } from '@/core/storage/StorageDriver';

const GOAL_PLANS_STORAGE_KEY = 'commitment_goal_plans_v3';
const CALENDAR_STORAGE_KEY = 'commitment_calendar_tasks_v3';

type Timeframe = 'annual' | 'quarterly' | 'monthly' | 'weekly' | 'weeklyHours';

export type GoalPlan = {
  goalId: string;
  goalName: string;
  plans: Partial<Record<Timeframe, string>>;
};

interface GoalsContextType {
  allGoals: Goal[];
  coreTop5: Goal[];
  goalPlans: GoalPlan[];
  updatePlan: (goalId: string, timeframe: Timeframe, value: string) => void;
  calendarTasks: CalendarStore;
  setCalendarTasks: (tasks: CalendarStore | ((prev: CalendarStore) => CalendarStore)) => void;
  toggleCalendarTask: (key: string, taskId: string) => void;
  addFocusSession: (
    goalId: string,
    durationMinutes: number,
    honestyMode: boolean,
    opts?: { interruptionCount?: number; interruptionReason?: string; subgoalId?: string | null }
  ) => Promise<void>;
  addGoal: ReturnType<typeof useSupabaseGoals>['addGoal'];
  updateGoalName: ReturnType<typeof useSupabaseGoals>['updateGoalName'];
  updateGoalCategory: ReturnType<typeof useSupabaseGoals>['updateGoalCategory'];
  deleteGoal: ReturnType<typeof useSupabaseGoals>['deleteGoal'];
  reorderGoals: (newGoals: Goal[]) => void;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export const GoalsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { goals: allGoals, addGoal, updateGoalCategory, deleteGoal, reorderGoals, updateGoalName } = useSupabaseGoals();

  const coreTop5 = useMemo(() => allGoals.filter((g) => g.goal_category === 'Core').slice(0, 5), [allGoals]);

  const [goalPlans, setGoalPlans] = useState<GoalPlan[]>([]);
  const [calendarTasks, setCalendarTasks] = useState<CalendarStore>({});

  useEffect(() => {
    let isMounted = true;
    const loadFromStorage = async () => {
      const initialPlans: GoalPlan[] = coreTop5.map((vg) => ({
        goalId: vg.goal_id,
        goalName: vg.goal_name,
        plans: { annual: '', quarterly: '', monthly: '', weekly: '', weeklyHours: '' },
      }));

      try {
        const rawPlans = await asyncStorageDriver.getItem(GOAL_PLANS_STORAGE_KEY);
        const mergedPlans = (() => {
          if (!rawPlans) return initialPlans;
          const storedPlans: GoalPlan[] = JSON.parse(rawPlans);
          return coreTop5.map((coreGoal) => {
            const ip = initialPlans.find((p) => p.goalId === coreGoal.goal_id)!;
            const stored = storedPlans.find((sp) => sp.goalId === coreGoal.goal_id);
            return { goalId: ip.goalId, goalName: ip.goalName, plans: stored ? stored.plans : ip.plans };
          });
        })();
        if (isMounted) setGoalPlans(mergedPlans);
      } catch (err) {
        console.warn('[GoalsContext] 載入 goal plans 失敗:', err);
        if (isMounted) setGoalPlans(initialPlans);
      }

      try {
        const rawCal = await asyncStorageDriver.getItem(CALENDAR_STORAGE_KEY);
        if (rawCal && isMounted) setCalendarTasks(JSON.parse(rawCal));
      } catch (err) {
        console.warn('[GoalsContext] 載入 calendar 任務失敗:', err);
      }
    };

    loadFromStorage();
    return () => {
      isMounted = false;
    };
  }, [coreTop5.map((g) => g.goal_id).join(',')]);

  useEffect(() => {
    if (goalPlans.length === 0) return;
    asyncStorageDriver.setItem(GOAL_PLANS_STORAGE_KEY, JSON.stringify(goalPlans)).catch((err) =>
      console.warn('[GoalsContext] 儲存 goal plans 失敗:', err)
    );
  }, [goalPlans]);

  const setAndPersistCalendarTasks = (tasks: CalendarStore | ((prev: CalendarStore) => CalendarStore)) => {
    setCalendarTasks((prevTasks) => {
      const newTasks = typeof tasks === 'function' ? (tasks as (prev: CalendarStore) => CalendarStore)(prevTasks) : tasks;
      asyncStorageDriver
        .setItem(CALENDAR_STORAGE_KEY, JSON.stringify(newTasks))
        .catch((err) => console.warn('[GoalsContext] 儲存 calendar 任務失敗:', err));
      return newTasks;
    });
  };

  const updatePlan = (goalId: string, timeframe: Timeframe, value: string) => {
    setGoalPlans((prev) => prev.map((g) => (g.goalId === goalId ? { ...g, plans: { ...g.plans, [timeframe]: value } } : g)));
  };

  const toggleCalendarTask = (key: string, taskId: string) => {
    setAndPersistCalendarTasks((prev: CalendarStore) => {
      const dayTasks = (prev[key] || []).map((t) => (t.id === taskId ? { ...t, done: !t.done } : t));
      return { ...prev, [key]: dayTasks };
    });
  };

  const addFocusSession = async (
    goalId: string,
    durationMinutes: number,
    honestyMode: boolean,
    opts?: { interruptionCount?: number; interruptionReason?: string; subgoalId?: string | null }
  ) => {
    try {
      const newSession: Omit<FocusSessionLog, 'session_id' | 'created_at'> = {
        goal_id: goalId,
        subgoal_id: opts?.subgoalId ?? null,
        duration_minutes: durationMinutes,
        honesty_mode: honestyMode,
        start_time: new Date().toISOString(),
        interruption_count: opts?.interruptionCount ?? 0,
        interruption_reason: opts?.interruptionReason ?? null,
      };
      const { error } = await supabase.from('FocusSessionLog').insert(newSession);
      if (error) throw error;
    } catch (err) {
      console.error('新增專注紀錄失敗:', err);
    }
  };

  return (
    <GoalsContext.Provider
      value={{
        allGoals,
        coreTop5,
        goalPlans,
        updatePlan,
        calendarTasks,
        setCalendarTasks: setAndPersistCalendarTasks,
        toggleCalendarTask,
        addFocusSession,
        addGoal,
        updateGoalName,
        updateGoalCategory,
        deleteGoal,
        reorderGoals,
      }}
    >
      {children}
    </GoalsContext.Provider>
  );
};

export const useGoalsContext = (): GoalsContextType => {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error('useGoalsContext 必須搭配 GoalsProvider 使用');
  }
  return context;
};

export const useGoals = useGoalsContext;
