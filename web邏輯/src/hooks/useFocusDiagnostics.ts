"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FocusSessionLog } from '@/types/database';

export interface FocusDiagnosticsResult {
  isLoading: boolean;
  error: string | null;
  mostCommonReason: string | null;
  reasonCounts: Record<string, number>;
  refresh: () => void;
}

/**
 * R6: 程式化邏輯 - 中斷診斷 Hook
 * - 從 Supabase 讀取 FocusSessionLog 的 interruption_reason 與 interruption_count
 * - 彙總每個原因的發生次數
 * - 輸出最常見原因，供 Review/Data 分頁顯示程式化建議
 */
export function useFocusDiagnostics(): FocusDiagnosticsResult {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reasonCounts, setReasonCounts] = useState<Record<string, number>>({});

  const fetchDiagnostics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // --- 性能優化：從客戶端計算改為調用 RPC 函數 ---
      // 之前：拉取所有日誌到客戶端進行計算，數據量大時非常緩慢。
      // 現在：直接調用在 Supabase 中預先定義好的 RPC 函數，讓資料庫完成聚合運算。
      // 這極大地減少了網絡傳輸量和客戶端的計算負載。
      const { data, error: rpcError } = await supabase.rpc('get_interruption_reason_counts');

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      // RPC 函數返回的 data 格式為 [{ reason: '通知', count: 5 }, { reason: '疲勞', count: 2 }]
      // 我們需要將其轉換為組件期望的 Record<string, number> 格式
      const reasonCountsMap = (data || []).reduce((acc: Record<string, number>, item: { reason: string, count: number }) => {
        if (item.reason) acc[item.reason] = item.count;
        return acc;
      }, {});
      setReasonCounts(reasonCountsMap);
    } catch (err: any) {
      setError(err.message || 'Failed to load diagnostics');
      setReasonCounts({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiagnostics();
  }, [fetchDiagnostics]);

  const mostCommonReason = useMemo(() => {
    let topReason: string | null = null;
    let topCount = -1;
    let isTie = false; // 標記是否存在次數相同的情況

    Object.entries(reasonCounts).forEach(([reason, count]) => {
      if (count > topCount) {
        topReason = reason;
        topCount = count;
        isTie = false;
      } else if (count === topCount) {
        isTie = true;
      }
    });
    return isTie ? null : topReason; // 如果次數相同，則不提供明確建議，避免誤導
  }, [reasonCounts]);

  const refresh = useCallback(() => {
    fetchDiagnostics();
  }, [fetchDiagnostics]);

  return { isLoading, error, mostCommonReason, reasonCounts, refresh };
}
