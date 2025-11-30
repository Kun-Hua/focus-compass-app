"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Subgoal } from "@/types/database";

export function useSubgoals(goalId: string | null | undefined) {
  const [subgoals, setSubgoals] = useState<Subgoal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubgoals = useCallback(async () => {
    if (!goalId) {
      setSubgoals([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("Subgoal")
        .select("subgoal_id, goal_id, name, order_index, created_at")
        .eq("goal_id", goalId)
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      setSubgoals(data || []);
    } catch (e: any) {
      setError(e.message || "讀取小目標失敗");
      setSubgoals([]);
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    fetchSubgoals();
  }, [fetchSubgoals]);

  const addSubgoal = useCallback(async (name: string) => {
    if (!goalId || !name.trim()) return null;
    try {
      const maxOrder = subgoals.reduce((m, s) => Math.max(m, s.order_index || 0), 0);
      const { data, error } = await supabase
        .from('Subgoal')
        .insert({ goal_id: goalId, name, order_index: maxOrder + 1 })
        .select('*')
        .single();
      if (error) throw error;
      setSubgoals(prev => [...prev, data as Subgoal].sort((a,b)=> (a.order_index||0) - (b.order_index||0)));
      return data as Subgoal;
    } catch (e: any) {
      setError(e.message || '新增小目標失敗');
      return null;
    }
  }, [goalId, subgoals]);

  const updateSubgoalName = useCallback(async (subgoalId: string, name: string) => {
    try {
      const { data, error } = await supabase
        .from('Subgoal')
        .update({ name })
        .eq('subgoal_id', subgoalId)
        .select('*')
        .single();
      if (error) throw error;
      setSubgoals(prev => prev.map(s => s.subgoal_id === subgoalId ? { ...s, name } : s));
      return data as Subgoal;
    } catch (e: any) {
      setError(e.message || '更新小目標失敗');
      return null;
    }
  }, []);

  const deleteSubgoal = useCallback(async (subgoalId: string) => {
    const original = [...subgoals];
    // 樂觀更新：先從前端列表移除
    setSubgoals(prev => prev.filter(s => s.subgoal_id !== subgoalId));
    try {
      // 先刪除引用該 subgoal 的紀錄（避免外鍵約束）
      const { error: depErr } = await supabase
        .from('FocusSessionLog')
        .delete()
        .eq('subgoal_id', subgoalId);
      if (depErr) throw depErr;

      // 再刪除 Subgoal 本身
      const { error } = await supabase.from('Subgoal').delete().eq('subgoal_id', subgoalId);
      if (error) throw error;
      return true;
    } catch (e: any) {
      setError(e.message || '刪除小目標失敗');
      setSubgoals(original); // 還原
      return false;
    }
  }, [subgoals]);

  const reorderSubgoals = useCallback(async (orderedIds: string[]) => {
    // 樂觀更新
    setSubgoals(prev => orderedIds.map((id, idx) => {
      const found = prev.find(s => s.subgoal_id === id)!;
      return { ...found, order_index: idx } as Subgoal;
    }));
    try {
      // 批次更新 order_index
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i];
        const { error } = await supabase
          .from('Subgoal')
          .update({ order_index: i })
          .eq('subgoal_id', id);
        if (error) throw error;
      }
      return true;
    } catch (e: any) {
      setError(e.message || '排序更新失敗');
      // 失敗時重新抓取
      fetchSubgoals();
      return false;
    }
  }, [fetchSubgoals]);

  return { subgoals, loading, error, refresh: fetchSubgoals, addSubgoal, updateSubgoalName, deleteSubgoal, reorderSubgoals };
}
