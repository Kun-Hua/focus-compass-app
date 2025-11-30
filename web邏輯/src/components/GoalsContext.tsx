'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useGoals as useSupabaseGoals } from '@/hooks/useGoals';
import { Goal, DayTask, CalendarStore, FocusSessionLog } from '@/types/database';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

type Timeframe = 'annual' | 'quarterly' | 'monthly' | 'weekly' | 'weeklyHours';

export type GoalPlan = {
    goalId: string;
    goalName: string;
    plans: Partial<Record<Timeframe, string>>;
};

interface GoalsContextType {
    // 來自 Supabase 的所有目標（Vision頁面）
    allGoals: Goal[];
    coreTop5: Goal[]; // 5/25 選出的 Core 前五
    goalPlans: GoalPlan[]; // 以 coreTop5 為來源的拆解
    updatePlan: (goalId: string, timeframe: 'annual' | 'quarterly' | 'monthly' | 'weekly' | 'weeklyHours', value: string) => void;
    calendarTasks: CalendarStore;
    setCalendarTasks: (tasks: CalendarStore | ((prev: CalendarStore) => CalendarStore)) => void;
    toggleCalendarTask: (key: string, taskId: string) => void;
    addFocusSession: (goalId: string, durationMinutes: number, honestyMode: boolean, opts?: { interruptionCount?: number; interruptionReason?: string; subgoalId?: string | null }) => Promise<void>;
    addGoal: (name: string, category: 'Core' | 'Avoidance') => Promise<void>;
    updateGoalName: (id: string, newName: string) => Promise<unknown | null>;
    updateGoalCategory: (id: string, category: 'Core' | 'Avoidance') => Promise<void>;
    deleteGoal: (id: string) => Promise<void>;
    reorderGoals: (newGoals: Goal[]) => void;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

const GOAL_PLANS_STORAGE_KEY = 'commitment_goal_plans_v3';
const CALENDAR_STORAGE_KEY = 'commitment_calendar_tasks_v3';

// --- ONE-TIME MIGRATION SCRIPT ---
// This script migrates goals from an old localStorage key to the Supabase DB.
const MIGRATE_OLD_GOALS_KEY = 'goals_v2'; // The old localStorage key

async function runOneTimeGoalMigration(user: User) {
  try {
    const rawOldGoals = localStorage.getItem(MIGRATE_OLD_GOALS_KEY);
    if (!rawOldGoals) return; // No old data to migrate

    console.log('[Migration] Found old goals in localStorage. Starting migration...');
    const oldGoals: Goal[] = JSON.parse(rawOldGoals);

    if (oldGoals.length > 0) {
      const goalsToInsert = oldGoals.map(g => ({
        goal_name: g.goal_name,
        goal_category: g.goal_category,
        user_id: user.id,
        // We let the DB generate new UUIDs and timestamps
      }));

      const { error } = await supabase.from('Goal').insert(goalsToInsert);
      if (error) {
        throw new Error(`Migration insert failed: ${error.message}`);
      }
      console.log(`[Migration] Successfully inserted ${goalsToInsert.length} goals into Supabase.`);
    }
    
    localStorage.removeItem(MIGRATE_OLD_GOALS_KEY); // Clean up after successful migration
    console.log('[Migration] Migration complete. Old data removed from localStorage.');
  } catch (e) {
    console.error('[Migration] Goal migration failed:', e);
  }
}

export const GoalsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { goals: allGoals, addGoal, updateGoalCategory, deleteGoal, reorderGoals, updateGoalName } = useSupabaseGoals();

    const coreTop5 = useMemo(() => allGoals.filter(g => g.goal_category === 'Core').slice(0, 5), [allGoals]);

    const [goalPlans, setGoalPlans] = useState<GoalPlan[]>([]);
    const [calendarTasks, setCalendarTasks] = useState<CalendarStore>({});

    // --- MIGRATION EFFECT ---
    // This effect runs once on startup to migrate old data if it exists.
    useEffect(() => {
      const performMigration = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await runOneTimeGoalMigration(session.user);
          // After migration, the useSupabaseGoals hook will automatically fetch the new data.
          // We might need to trigger a re-fetch if the hook doesn't do it automatically.
          // The useSupabaseGoals hook already refetches on auth change, which is sufficient.
        }
      };

      performMigration();
    }, []);

    // 初始化並從 localStorage 加載數據；當 coreTop5 變化時同步
    useEffect(() => {
        const initialPlans: GoalPlan[] = coreTop5.map(vg => ({
            goalId: vg.goal_id,
            goalName: vg.goal_name,
            plans: { annual: '', quarterly: '', monthly: '', weekly: '', weeklyHours: '' },
        }));

        try {
            const rawPlans = localStorage.getItem(GOAL_PLANS_STORAGE_KEY);
            if (rawPlans) {
                const storedPlans: GoalPlan[] = JSON.parse(rawPlans);
                // 以 coreTop5 為準，但保留已儲存的文本
                const mergedPlans: GoalPlan[] = coreTop5.map(coreGoal => {
                    const ip = initialPlans.find(p => p.goalId === coreGoal.goal_id)!;
                    const stored = storedPlans.find(sp => sp.goalId === coreGoal.goal_id);
                    return { goalId: ip.goalId, goalName: ip.goalName, plans: stored ? stored.plans : ip.plans };
                });
                setGoalPlans(mergedPlans);
            } else {
                setGoalPlans(initialPlans);
            }
            
            const rawCal = localStorage.getItem(CALENDAR_STORAGE_KEY);
            if (rawCal) setCalendarTasks(JSON.parse(rawCal));
        } catch {}
    }, [coreTop5.map(g => g.goal_id).join(',')]);

    // 持久化數據
    useEffect(() => {
        if (goalPlans.length > 0) {
            localStorage.setItem(GOAL_PLANS_STORAGE_KEY, JSON.stringify(goalPlans));
        }
    }, [goalPlans]);

    const setAndPersistCalendarTasks = (tasks: CalendarStore | ((prev: CalendarStore) => CalendarStore)) => {
        setCalendarTasks((prevTasks: CalendarStore) => {
            const newTasks = typeof tasks === 'function' ? tasks(prevTasks) : tasks;
            try {
                localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(newTasks));
            } catch (e) {
                console.error("Failed to save calendar tasks to localStorage", e);
            }
            return newTasks;
        });
    };

    const updatePlan = (goalId: string, timeframe: 'annual' | 'quarterly' | 'monthly' | 'weekly' | 'weeklyHours', value: string) => {
        setGoalPlans(prev => prev.map(g => (g.goalId === goalId ? { ...g, plans: { ...g.plans, [timeframe]: value } } : g)));
    };

    const toggleCalendarTask = (key: string, taskId: string) => {
        setAndPersistCalendarTasks((prev: CalendarStore) => {
            const dayTasks = (prev[key] || []).map((t) =>
                t.id === taskId ? { ...t, done: !t.done } : t
            );
            return { ...prev, [key]: dayTasks };
        });
    };

    const addFocusSession = async (goalId: string, durationMinutes: number, honestyMode: boolean, opts?: { interruptionCount?: number; interruptionReason?: string; subgoalId?: string | null }) => {
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
        } catch (err: any) {
            console.error("新增專注紀錄失敗:", err);
            // 這裡可以加入更完善的錯誤處理，例如顯示一個提示給使用者
        }
    };

    return (
        <GoalsContext.Provider value={{ 
            allGoals, coreTop5, goalPlans, updatePlan, calendarTasks, setCalendarTasks: setAndPersistCalendarTasks, 
            toggleCalendarTask, addFocusSession, addGoal, updateGoalName, updateGoalCategory, deleteGoal, reorderGoals 
        }}>
            {children}
        </GoalsContext.Provider>
    );
};

export const useGoals = (): GoalsContextType => {
    const context = useContext(GoalsContext);
    if (!context) {
        throw new Error('useGoals must be used within a GoalsProvider');
    }
    return context;
};