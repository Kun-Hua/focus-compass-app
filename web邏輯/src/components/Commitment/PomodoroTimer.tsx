"use client";
import { Button } from "@/components/ui/button";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Mode = "focus" | "break";

export default function PomodoroTimer({
  proEnabled = false,
  defaultFocusMinutes = 25,
  defaultBreakMinutes = 5,
  autoStartBreak = true,
  autoStartNextFocus = true,
  currentHonestyMode, // 從父層接收誠實模式
  onTick,
  onFocusComplete,
}: {
  proEnabled?: boolean;
  defaultFocusMinutes?: number;
  defaultBreakMinutes?: number;
  autoStartBreak?: boolean;
  autoStartNextFocus?: boolean;
  currentHonestyMode?: boolean;
  onTick?: (payload: { mode: Mode; remainingSeconds: number; cycle: number }) => void;
  onFocusComplete?: (payload: { minutes: number; cycle: number }) => void;
}) {
  const [mode, setMode] = useState<Mode>("focus");
  const [focusMinutes, setFocusMinutes] = useState<number>(defaultFocusMinutes);
  const [breakMinutes, setBreakMinutes] = useState<number>(defaultBreakMinutes);
  const [remaining, setRemaining] = useState<number>(defaultFocusMinutes * 60);
  const [running, setRunning] = useState<boolean>(false);
  const [cycle, setCycle] = useState<number>(1);
  const [soundUrl, setSoundUrl] = useState<string>("/sounds/timer-end.mp3"); // 新增：鈴聲 URL 狀態
  const [isAlarming, setIsAlarming] = useState<boolean>(false); // 新增：鈴聲是否正在響
  const [soundFileName, setSoundFileName] = useState<string>(""); // 新增：鈴聲檔案名稱
  const [totalCycles, setTotalCycles] = useState<number>(4); // 新增：總輪數狀態
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const targetTsRef = useRef<number | null>(null);
  const beepAudioContextRef = useRef<AudioContext | null>(null); // For programmatic beeps
  const soundAudioElementRef = useRef<HTMLAudioElement | null>(null); // For sound file playback

  const ensureAudio = useCallback(async () => {
    try {
      if (!beepAudioContextRef.current) beepAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (beepAudioContextRef.current.state === 'suspended') await beepAudioContextRef.current.resume();
    } catch {}
  }, []);

  const beep = useCallback(async (freq = 880, ms = 200) => {
    try {
      const ctx = beepAudioContextRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') await ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + ms / 1000 + 0.05);
    } catch (e) { console.error("Beep failed", e); }
  }, [ensureAudio]);

  const display = useMemo(() => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [remaining]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const STORAGE_KEY = 'pomodoro_state_v1';

  const persistState = useCallback((extra?: Partial<{ mode: Mode; remaining: number; running: boolean; cycle: number; focus: number; breakM: number; total: number; target_ts: number }>) => {
    try {
      const payload = {
        mode,
        remaining,
        running,
        cycle,
        focus: focusMinutes,
        breakM: breakMinutes,
        total: totalCycles,
        target_ts: targetTsRef.current || 0,
        ...extra,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {}
  }, [mode, remaining, running, cycle, focusMinutes, breakMinutes, totalCycles]);

  const recompute = useCallback(() => {
    if (!targetTsRef.current) return;
    const now = Date.now();
    const secs = Math.max(0, Math.ceil((targetTsRef.current - now) / 1000));
    setRemaining(secs);
  }, []);

  const startTimer = useCallback(() => {
    if (!proEnabled) return;
    if (running) return;
    setRunning(true);
    // 初始化/恢復音訊以通過瀏覽器自動播放政策
    ensureAudio();
    // 設定目標截止時間（timestamp 倒數）
    const now = Date.now();
    targetTsRef.current = now + remaining * 1000;
    persistState({ running: true, target_ts: targetTsRef.current });
    timerRef.current = setInterval(() => {
      recompute();
    }, 1000);
  }, [proEnabled, running, ensureAudio, remaining, persistState, recompute]);

  const pauseTimer = useCallback(() => {
    setRunning(false);
    clearTimer();
    // 將目前剩餘秒數持久化
    persistState({ running: false, remaining });
  }, [clearTimer, remaining, persistState]);

  const resetTimer = useCallback(() => {
    setRunning(false);
    clearTimer();
    setMode("focus");
    setRemaining(focusMinutes * 60);
    setIsAlarming(false); // 重設時關閉鈴聲
    setCycle(1);
    targetTsRef.current = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, [clearTimer, focusMinutes]);

  const stopAlarm = useCallback(() => {
    if (soundAudioElementRef.current) {
      soundAudioElementRef.current.pause();
      soundAudioElementRef.current.currentTime = 0;
    }
    setIsAlarming(false);

    // 繼續原有的流程
    if (mode === "focus") {
      setMode("break");
      setRemaining(breakMinutes * 60);
      if (autoStartBreak) {
        setTimeout(startTimer, 300);
      }
    } else {
      if (cycle >= totalCycles) {
        resetTimer();
        return;
      }
      setMode("focus");
      setRemaining(focusMinutes * 60);
      setCycle((c) => c + 1);
      if (autoStartNextFocus) {
        setTimeout(startTimer, 300);
      }
    }
  }, [mode, cycle, totalCycles, autoStartBreak, autoStartNextFocus, breakMinutes, focusMinutes, resetTimer, startTimer]);

  useEffect(() => {
    if (!running) return;
    onTick?.({ mode, remainingSeconds: remaining, cycle });
    if (remaining === 0) {
      pauseTimer();
      setIsAlarming(true);
      if (mode === "focus") {
        onFocusComplete?.({ minutes: focusMinutes, cycle });
      }
    } else {
      // 同步 target 與狀態
      persistState();
    }
  }, [remaining, running, mode, onTick, pauseTimer, onFocusComplete, focusMinutes, cycle, persistState]);

  // 處理鈴聲 URL 變更
  useEffect(() => {
    if (!soundUrl) {
      soundAudioElementRef.current = null;
      return;
    }
    try {
      const audio = new Audio(soundUrl);
      audio.loop = true; // 讓鈴聲循環播放
      soundAudioElementRef.current = audio;
    } catch (e) {
      console.error(`無效的音訊 URL: ${soundUrl}`, e);
      soundAudioElementRef.current = null;
    }
  }, [soundUrl]);

  // 處理鈴聲播放
  useEffect(() => {
    if (isAlarming) {
      soundAudioElementRef.current?.play().catch(() => beep(880, 200));
    }
  }, [isAlarming, beep]);

  // 當 soundUrl 改變時，如果它是 object URL，則在組件卸載或 URL 改變時釋放它
  useEffect(() => {
    const currentUrl = soundUrl;
    return () => {
      if (currentUrl && currentUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [soundUrl]);

  useEffect(() => {
    if (!running) return;
    if (mode === "focus") {
      // 調整目標截止
      const now = Date.now();
      targetTsRef.current = now + Math.min(remaining, focusMinutes * 60) * 1000;
    } else if (mode === "break") {
      const now = Date.now();
      targetTsRef.current = now + Math.min(remaining, breakMinutes * 60) * 1000;
    }
    persistState({ target_ts: targetTsRef.current || 0 });
  }, [focusMinutes, breakMinutes, mode, running, remaining, persistState]);

  const canStart = proEnabled && !running && remaining > 0;

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 掛載時恢復狀態與可見性補算
  usePomodoroRestore({
    recompute,
    persistState,
    setMode,
    setRemaining,
    setRunning,
    setCycle,
    setFocusMinutes,
    setBreakMinutes,
    setTotalCycles,
    targetTsRef,
    timerRef,
  });

  const handleSoundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "audio/mpeg") {
      // 釋放舊的 Object URL 以避免記憶體洩漏
      if (soundUrl && soundUrl.startsWith('blob:')) {
        URL.revokeObjectURL(soundUrl);
      }
      const newSoundUrl = URL.createObjectURL(file);
      setSoundUrl(newSoundUrl);
      setSoundFileName(file.name);
    }
  };
  return (
    <div className="rounded-2xl border bg-white shadow p-6 space-y-4 relative">
      {!proEnabled && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center space-y-3">
            <div className="text-lg font-semibold">此功能為付費解鎖</div>
            <div className="text-sm text-gray-600">升級至 Pro 以使用番茄鐘、自動休息與循環</div>
            <a href="/pricing" className="inline-block rounded bg-black text-white px-4 py-2 text-sm">立即升級</a>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-600">{mode === "focus" ? "專注中" : "休息中"} · 第 {cycle} 輪</div>
        <div className="text-4xl font-extrabold tracking-wider tabular-nums">{display}</div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <div className="text-xs text-gray-500">專注分鐘</div>
          <input
            type="number"
            min={0}
            step={0.1}
            value={focusMinutes}
            onChange={(e) => setFocusMinutes(Math.max(0, Number(e.target.value)))}
            className="w-full rounded border px-3 py-2 text-sm"
            disabled={running || !proEnabled}
          />
        </div>
        <div className="space-y-1">
          <div className="text-xs text-gray-500">休息分鐘</div>
          <input
            type="number"
            min={0}
            step={0.1}
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(Math.max(0, Number(e.target.value)))}
            className="w-full rounded border px-3 py-2 text-sm"
            disabled={running || !proEnabled}
          />
        </div>
        <div className="space-y-1">
          <div className="text-xs text-gray-500">總輪數</div>
          <input
            type="number"
            min={1}
            max={12}
            value={totalCycles}
            onChange={(e) => setTotalCycles(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
            className="w-full rounded border px-3 py-2 text-sm"
            disabled={running || !proEnabled}
          />
        </div>
      </div>

      {isAlarming ? (
        <div className="space-y-1">
          <Button onClick={stopAlarm} className="w-full bg-red-600 hover:bg-red-700">
            關閉鈴聲
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-1">
            <div className="text-xs text-gray-500">鈴聲</div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={running || !proEnabled}
                >
                    選擇 MP3 檔案
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleSoundFileChange}
                    accept=".mp3,audio/mpeg"
                    className="hidden"
                />
                <span className="text-sm text-gray-600 truncate" title={soundFileName}>{soundFileName || '預設鈴聲'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
        <button
          onClick={startTimer}
          disabled={!canStart}
          className={`rounded px-4 py-2 text-sm font-semibold ${canStart ? "bg-black text-white" : "bg-gray-300 text-gray-600 cursor-not-allowed"}`}
        >
          開始
        </button>
        <button
          onClick={pauseTimer}
          disabled={!proEnabled || !running}
          className={`rounded px-4 py-2 text-sm font-semibold ${proEnabled && running ? "bg-gray-800 text-white" : "bg-gray-300 text-gray-600 cursor-not-allowed"}`}
        >
          暫停
        </button>
        <button
          onClick={resetTimer}
          disabled={!proEnabled}
          className={`rounded px-4 py-2 text-sm font-semibold ${proEnabled ? "bg-white border" : "bg-gray-300 text-gray-600 cursor-not-allowed"}`}
        >
          重設
        </button>
          </div>
        </>)}

      <div className="flex items-center gap-3 text-xs text-gray-600">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={autoStartBreak} onChange={() => { if (proEnabled) { (document.activeElement as HTMLElement)?.blur(); }} } disabled={!proEnabled} />
          自動開始休息
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={autoStartNextFocus} onChange={() => { if (proEnabled) { (document.activeElement as HTMLElement)?.blur(); }} } disabled={!proEnabled} />
          自動開始下一輪
        </label>
      </div>
    </div>
  );
}

// 掛載時恢復狀態與可見性補算
// 放在主組件內部較能直接取用狀態
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function usePomodoroRestore(
  deps: {
    recompute: () => void;
    persistState: (extra?: Partial<{ mode: Mode; remaining: number; running: boolean; cycle: number; focus: number; breakM: number; total: number; target_ts: number }>) => void;
    setMode: React.Dispatch<React.SetStateAction<Mode>>;
    setRemaining: React.Dispatch<React.SetStateAction<number>>;
    setRunning: React.Dispatch<React.SetStateAction<boolean>>;
    setCycle: React.Dispatch<React.SetStateAction<number>>;
    setFocusMinutes: React.Dispatch<React.SetStateAction<number>>;
    setBreakMinutes: React.Dispatch<React.SetStateAction<number>>;
    setTotalCycles: React.Dispatch<React.SetStateAction<number>>;
    targetTsRef: React.MutableRefObject<number | null>;
    timerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  }
) {
  const { recompute, setMode, setRemaining, setRunning, setCycle, setFocusMinutes, setBreakMinutes, setTotalCycles, targetTsRef, timerRef } = deps;
  useEffect(() => {
    try {
      const raw = localStorage.getItem('pomodoro_state_v1');
      if (raw) {
        const s = JSON.parse(raw) as { mode?: Mode; remaining?: number; running?: boolean; cycle?: number; focus?: number; breakM?: number; total?: number; target_ts?: number };
        if (s.mode) setMode(s.mode);
        if (typeof s.focus === 'number') setFocusMinutes(s.focus);
        if (typeof s.breakM === 'number') setBreakMinutes(s.breakM);
        if (typeof s.total === 'number') setTotalCycles(s.total);
        if (typeof s.cycle === 'number') setCycle(s.cycle);
        targetTsRef.current = s.target_ts || null;
        const nowRem = s.target_ts ? Math.max(0, Math.ceil((s.target_ts - Date.now()) / 1000)) : (s.remaining || 0);
        setRemaining(nowRem);
        if (s.running && nowRem > 0) {
          setRunning(true);
          timerRef.current = setInterval(() => recompute(), 1000);
        }
      }
    } catch {}
    const onVis = () => {
      if (document.visibilityState === 'visible') recompute();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
