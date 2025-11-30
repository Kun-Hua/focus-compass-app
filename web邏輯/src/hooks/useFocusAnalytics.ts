'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FocusSessionLog } from '@/types/database';

// R1: 類型安全 - 定義 Hook 返回介面的類型
interface FocusAnalytics {
  netCommittedMinutes: number; // 淨投入時長 (R5: honesty_mode=TRUE)
  selfDeceptionMinutes: number; // 自我欺騙時長 (R5: honesty_mode=FALSE)
  totalDurationMinutes: number;
  honestyRatio: number; // 誠實度比例 (淨投入 / 總投入)
  isLoading: boolean;
  error: string | null;
  refreshAnalytics: () => void;
}

/**
 * R6: 程式化邏輯 - 時間複利計算 Hook
 * 
 * 核心功能：
 * 1. 從 Supabase FocusSessionLog 表格獲取數據
 * 2. 計算三個關鍵指標：淨投入時長、自我欺騙時長、總投入時長
 * 3. 實現 R5 數據誠實的商業意義轉化
 * 
 * 哲學依據：
 * - 淨投入時長只包含 honesty_mode = TRUE 的時長，作為時間複利儀表板的唯一數據基礎
 * - 自我欺騙時長幫助用戶識別和改善低品質的專注時間
 * - 總投入時長提供完整的時間投入視圖
 */
export const useFocusAnalytics = (): FocusAnalytics => {
  const [data, setData] = useState<Omit<FocusAnalytics, 'isLoading' | 'error' | 'refreshAnalytics'>>({
    netCommittedMinutes: 0,
    selfDeceptionMinutes: 0,
    totalDurationMinutes: 0,
    honestyRatio: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * R6: 程式化邏輯 - 核心計算函數
   * 從 Supabase 獲取 FocusSessionLog 數據並執行分析計算
   */
  const calculateAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: logs, error: fetchError } = await supabase
        .from('FocusSessionLog')
        .select('*');

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (!logs || logs.length === 0) {
        setData({ netCommittedMinutes: 0, selfDeceptionMinutes: 0, totalDurationMinutes: 0, honestyRatio: 0 });
        setIsLoading(false);
        return;
      }

      let netMinutes = 0;
      let selfDeceptionMinutes = 0;

      (logs as FocusSessionLog[]).forEach(log => {
        if (log.honesty_mode === true) {
          netMinutes += log.duration_minutes;
        } else {
          selfDeceptionMinutes += log.duration_minutes;
        }
      });

      const totalMinutes = netMinutes + selfDeceptionMinutes;
      const ratio = totalMinutes > 0 ? (netMinutes / totalMinutes) : 0;

      setData({
        netCommittedMinutes: netMinutes,
        selfDeceptionMinutes: selfDeceptionMinutes,
        totalDurationMinutes: totalMinutes,
        honestyRatio: parseFloat(ratio.toFixed(2)),
      });
    } catch (err: any) {
      console.error("Error fetching focus analytics:", err.message);
      setError(err.message);
      setData({ netCommittedMinutes: 0, selfDeceptionMinutes: 0, totalDurationMinutes: 0, honestyRatio: 0 });
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * R3: 變數清晰 - 手動刷新分析數據
   */
  const refreshAnalytics = useCallback(() => {
    calculateAnalytics();
  }, [calculateAnalytics]);

  // R6: 程式化邏輯 - 組件掛載時自動計算
  useEffect(() => {
    calculateAnalytics();
  }, [calculateAnalytics]);

  // R1: 類型安全 - 返回符合介面的對象
  return {
    ...data,
    isLoading,
    error,
    refreshAnalytics,
  };
};
