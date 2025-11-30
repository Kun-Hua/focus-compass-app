'use client';

import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/core/lib/supabaseClient';
import type { Goal } from '@/core/types/database';

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    };
    init();
  }, []);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        setGoals([]);
        return;
      }
      const { data, error: fetchError } = await supabase
        .from('Goal')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setGoals(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('讀取目標失敗:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const addGoal = useCallback(async (goalName: string, category: 'Core' | 'Avoidance' = 'Avoidance') => {
    if (!goalName.trim()) {
      setError('目標名稱不可為空。');
      return null;
    }
    setError(null);

    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        throw new Error('尚未登入，無法新增目標');
      }
      const newGoal: Omit<Goal, 'goal_id' | 'created_at'> = {
        goal_name: goalName,
        goal_category: category,
        user_id: uid,
        linked_role: null,
        goal_tags: null,
        annual_target_hrs: 0,
      };

      const { data, error: insertError } = await supabase
        .from('Goal')
        .insert(newGoal)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setGoals((prevGoals) => [...prevGoals, data]);
      return data;
    } catch (err: any) {
      const errorMessage = `新增目標失敗: ${err.message}`;
      setError(errorMessage);
      console.error('新增目標失敗:', err);
      return null;
    }
  }, []);

  const updateGoalCategory = useCallback(async (goalId: string, newCategory: 'Core' | 'Avoidance') => {
    setError(null);

    const coreGoalsCount = goals.filter((g) => g.goal_category === 'Core').length;
    if (newCategory === 'Core' && coreGoalsCount >= 5) {
      const errorMessage = '核心目標最多只能有 5 個 (R7 強制聚焦)。';
      setError(errorMessage);
      console.warn(errorMessage);
      return null;
    }

    try {
      const { data, error: updateError } = await supabase
        .from('Goal')
        .update({ goal_category: newCategory })
        .eq('goal_id', goalId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setGoals((prevGoals) => prevGoals.map((g) => (g.goal_id === goalId ? { ...g, goal_category: newCategory } : g)));
      return data;
    } catch (err: any) {
      setError(`更新目標分類失敗: ${err.message}`);
      console.error('更新目標分類失敗:', err);
      return null;
    }
  }, [goals]);

  const deleteGoal = useCallback(async (goalId: string) => {
    const originalGoals = [...goals];
    setGoals((currentGoals) => currentGoals.filter((g) => g.goal_id !== goalId));

    try {
      const depDeletes = [
        supabase.from('FocusSessionLog').delete().eq('goal_id', goalId),
        supabase.from('WeeklyCommitment').delete().eq('goal_id', goalId),
        supabase.from('Subgoal').delete().eq('goal_id', goalId),
      ];
      const depResults = await Promise.all(depDeletes);
      const depError = depResults.find((r) => (r as any).error)?.error;
      if (depError) {
        throw depError;
      }

      const { error: deleteError } = await supabase.from('Goal').delete().eq('goal_id', goalId);
      if (deleteError) {
        throw deleteError;
      }
    } catch (err: any) {
      setGoals(originalGoals);
      setError(`刪除目標失敗: ${err.message}`);
      console.error('刪除目標失敗:', err);
    }
  }, [goals]);

  const updateGoalName = useCallback(async (goalId: string, newName: string) => {
    if (!newName.trim()) {
      setError('目標名稱不可為空。');
      return null;
    }
    try {
      const { data, error: updateError } = await supabase
        .from('Goal')
        .update({ goal_name: newName })
        .eq('goal_id', goalId)
        .select()
        .single();
      if (updateError) throw updateError;
      setGoals((prev) => prev.map((g) => (g.goal_id === goalId ? { ...g, goal_name: newName } : g)));
      return data;
    } catch (err: any) {
      setError(`更新目標名稱失敗: ${err.message}`);
      return null;
    }
  }, []);

  const reorderGoals = useCallback((reorderedGoals: Goal[]) => {
    setGoals(reorderedGoals);
  }, []);

  return {
    goals,
    loading,
    error,
    reorderGoals,
    fetchGoals,
    addGoal,
    updateGoalCategory,
    deleteGoal,
    updateGoalName,
    userId,
  };
}
