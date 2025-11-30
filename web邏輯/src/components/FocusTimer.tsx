'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// 假設這些 UI 元件來自您的 UI 庫 (如 shadcn/ui)
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient'; // 需要確保您已創建此文件並配置連線
import { FocusSessionLog, Goal } from '@/types/database'; // R1: 類型安全
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// R1: 類型安全
interface FocusTimerProps {
  onSessionComplete: (durationMinutes: number, goalId: string, honestyMode: boolean) => void;
  isSubmitting: boolean;
  goalId: string; // R1: 類型安全 - 從父層接收目標 ID
  // 由父層傳入 R5 誠實度，若無則由本元件內部管理
  currentHonestyMode?: boolean;
}

const FocusTimer: React.FC<FocusTimerProps> = ({ onSessionComplete, isSubmitting, goalId, currentHonestyMode }) => {
  // R3: 變數清晰
  const [sessionTimeSeconds, setSessionTimeSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const startTsRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 已統一改用父層共享中斷輸入欄位，移除彈窗與中途寫入邏輯

  // 計算分鐘和秒數以顯示給用戶 (碼表顯示)
  const minutes = useMemo(() => Math.floor(sessionTimeSeconds / 60), [sessionTimeSeconds]);
  const seconds = useMemo(() => sessionTimeSeconds % 60, [sessionTimeSeconds]);

  console.log('[FocusTimer] 渲染，isActive:', isActive);

  const STORAGE_KEY = 'focus_timer_active_v1';

  const tick = useCallback(() => {
    if (!startTsRef.current) return;
    const now = Date.now();
    const elapsed = Math.max(0, Math.floor((now - startTsRef.current) / 1000));
    setSessionTimeSeconds(elapsed);
  }, []);

  useEffect(() => {
    if (!isActive) return;
    // 使用低頻 interval 刷新畫面；實際時間用時間戳計算
    intervalRef.current = setInterval(tick, 1000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isActive, tick]);

  // 啟動時儲存 active session；掛載時嘗試恢復
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { start_ts: number; goalId: string; honestyMode: boolean };
        if (saved && saved.start_ts && (!goalId || goalId === saved.goalId)) {
          startTsRef.current = saved.start_ts;
          setIsActive(true);
          tick();
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 移除 ensureCurrentSession 與中途更新中斷資訊，統一由父層在停止時計入


  const handleStart = () => {
    setError(null);
    if (!goalId) {
      setError('請先在左側選擇一個要專注的目標！');
      return;
    }
    startTsRef.current = Date.now();
    setIsActive(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ start_ts: startTsRef.current, goalId, honestyMode: !!currentHonestyMode }));
    } catch {}
    const isHonestyMode = typeof currentHonestyMode === 'boolean' ? currentHonestyMode : false;
    if (isHonestyMode) {
      console.log("錄影問責模式啟動: 正在本地錄影... (實體功能需原生App集成)");
    }
    // 不再於啟動時建立暫存 Session，避免重複紀錄
  };

  const handleStop = () => {
    setIsActive(false);

    const isHonestyMode = typeof currentHonestyMode === 'boolean' ? currentHonestyMode : false;
    if (isHonestyMode) {
      console.log("錄影問責模式停止: 正在儲存錄影...");
    }

    // 將秒數轉換為分鐘數並傳遞給父元件（以時間戳為準）
    const durationSeconds = startTsRef.current ? Math.max(0, Math.floor((Date.now() - startTsRef.current) / 1000)) : sessionTimeSeconds;
    const durationMinutes = Math.floor(durationSeconds / 60);
    if (sessionTimeSeconds > 0) {
      onSessionComplete(durationMinutes, goalId, typeof currentHonestyMode === 'boolean' ? currentHonestyMode : false);
    }

    setSessionTimeSeconds(0); // 重設碼表
    startTsRef.current = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    // 不使用暫存 session，僅透過父層一次性寫入
  };

  const handleReset = () => {
    setIsActive(false);
    setError(null);
    setSessionTimeSeconds(0);
    startTsRef.current = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  // UI 介面
  return (
    <div className="p-6 border rounded-xl shadow-2xl bg-white max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">
        雙模式專注問責計時器 (碼表)
      </h2>

      {/* 計時器顯示 (碼表視覺) */}
      <div className={`text-6xl font-extrabold text-center py-8 ${isActive ? 'text-red-500 animate-pulse' : 'text-gray-900'}`}>
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </div>

      {/* 控制按鈕 */}
      <div className="flex justify-center space-x-4">
        {!isActive ? (
          <Button
            onClick={handleStart}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg"
          >
            {isSubmitting ? '處理中...' : '啟動專注 (碼表)'}
          </Button>
        ) : (
          <>
            <Button
              onClick={handleStop}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full shadow-lg"
            >
              {isSubmitting ? '儲存中...' : '停止並記錄'}
            </Button>
            <Button onClick={handleReset} variant="secondary" className="py-3 px-8 rounded-full">重設</Button>
          </>
        )}
      </div>
      {error && (
        <p className="mt-4 text-sm font-medium text-red-600 p-2 bg-red-50 rounded-md text-center">
          {error}
        </p>
      )}

      {/* 已移除：中斷彈窗。中斷資料請於父層共享欄位輸入，並在停止時計入。 */}
    </div>
  );
};

export default FocusTimer;
