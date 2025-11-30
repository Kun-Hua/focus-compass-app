"use client";

import { useCallback, useEffect, useState } from "react";

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
      setError(e.message || "è®€?–å??®æ?å¤±æ?");
      setSubgoals([]);
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    fetchSubgoals();
  }, [fetchSubgoals]);

  const addSubgoal = useCallback(
    async (name: string) => {
      if (!goalId || !name.trim()) return null;
      try {
        const maxOrder = subgoals.reduce((m, s) => Math.max(m, s.order_index || 0), 0);
        const { data, error } = await supabase
          .from("Subgoal")
          .insert({ goal_id: goalId, name, order_index: maxOrder + 1 })
          .select("*")
          .single();
        if (error) throw error;
        setSubgoals((prev) => [...prev, data as Subgoal].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
        return data as Subgoal;
      } catch (e: any) {
        setError(e.message || "?°å?å°ç›®æ¨™å¤±??);
        return null;
      }
    },
    [goalId, subgoals]
  );

  const updateSubgoalName = useCallback(async (subgoalId: string, name: string) => {
    try {
      const { data, error } = await supabase
        .from("Subgoal")
        .update({ name })
        .eq("subgoal_id", subgoalId)
        .select("*")
        .single();
      if (error) throw error;
      setSubgoals((prev) => prev.map((s) => (s.subgoal_id === subgoalId ? { ...s, name } : s)));
      return data as Subgoal;
    } catch (e: any) {
      setError(e.message || "?´æ–°å°ç›®æ¨™å¤±??);
      return null;
    }
  }, []);

  const deleteSubgoal = useCallback(
    async (subgoalId: string) => {
      const original = [...subgoals];
      setSubgoals((prev) => prev.filter((s) => s.subgoal_id !== subgoalId));
      try {
        const { error: depErr } = await supabase.from("FocusSessionLog").delete().eq("subgoal_id", subgoalId);
        if (depErr) throw depErr;

        const { error } = await supabase.from("Subgoal").delete().eq("subgoal_id", subgoalId);
        if (error) throw error;
        return true;
      } catch (e: any) {
        setError(e.message || "?ªé™¤å°ç›®æ¨™å¤±??);
        setSubgoals(original);
        return false;
      }
    },
    [subgoals]
  );

  const reorderSubgoals = useCallback(
    async (orderedIds: string[]) => {
      setSubgoals((prev) =>
        orderedIds.map((id, idx) => {
          const found = prev.find((s) => s.subgoal_id === id)!;
          return { ...found, order_index: idx } as Subgoal;
        })
      );
      try {
        for (let i = 0; i < orderedIds.length; i++) {
          const id = orderedIds[i];
          const { error } = await supabase.from("Subgoal").update({ order_index: i }).eq("subgoal_id", id);
          if (error) throw error;
        }
        return true;
      } catch (e: any) {
        setError(e.message || "?’å??´æ–°å¤±æ?");
        fetchSubgoals();
        return false;
      }
    },
    [fetchSubgoals]
  );

  return { subgoals, loading, error, refresh: fetchSubgoals, addSubgoal, updateSubgoalName, deleteSubgoal, reorderSubgoals };
}

