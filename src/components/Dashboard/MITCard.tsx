"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGoals } from '@/components/GoalsContext';

const MIT_KEY_PREFIX = 'dashboard_mit_';

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function MITCard() {
  const { calendarTasks, allGoals } = useGoals();
  const router = useRouter();
  const key = todayKey();
  const tasks = calendarTasks[key] || [];

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(MIT_KEY_PREFIX + key);
    if (saved) setSelectedId(saved);
  }, [key]);

  useEffect(() => {
    if (selectedId) localStorage.setItem(MIT_KEY_PREFIX + key, selectedId);
  }, [key, selectedId]);

  useEffect(() => {
    if (!selectedId && tasks.length === 1 && !tasks[0].done) setSelectedId(tasks[0].id);
  }, [tasks, selectedId]);

  const selectedTask = useMemo(() => tasks.find(t => t.id === selectedId) || null, [tasks, selectedId]);

  function startFocus() {
    if (!selectedTask) return;
    const goalParam = selectedTask.goalId ? `?goalId=${encodeURIComponent(selectedTask.goalId)}` : '';
    router.push(`/execute${goalParam}`);
  }

  return (
    <div className="rounded border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">每日單一重點任務 (MIT)</h3>
        <button
          className={`px-3 py-1 rounded text-white ${selectedTask ? 'bg-black' : 'bg-gray-400 cursor-not-allowed'}`}
          onClick={startFocus}
          disabled={!selectedTask}
        >啟動專注</button>
      </div>
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-sm text-gray-500">今日尚未設定任務</div>
        ) : (
          tasks.map(t => (
            <label key={t.id} className="flex items-center gap-2 text-sm">
              <input type="radio" name="mit" checked={selectedId === t.id} onChange={() => setSelectedId(t.id)} />
              {t.goalId && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white">
                  {allGoals.find(g => g.goal_id === t.goalId)?.goal_name || '目標'}
                </span>
              )}
              <span className={`${t.done ? 'line-through text-gray-400' : ''}`}>{t.text}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
