'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { HabitTracking } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Habit extends HabitTracking {}

/**
 * R6: 程式化邏輯 - 火焰視覺化元件
 * 根據連續天數顯示不同顏色的火焰，提供視覺激勵
 */
const StreakFlame = ({ count }: { count: number }) => {
  // 根據原子習慣理論，21天是養成習慣的一個重要里程碑
  const color = count >= 21 ? 'text-red-600' : count >= 7 ? 'text-orange-500' : 'text-yellow-500';
  return (
    <span className={`text-2xl ${color}`} title={`連續達成天數：${count}`}>🔥 {count}</span>
  );
};

const HabitsPage: React.FC = () => {
  // R1: 類型安全 - 狀態管理
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newHabitName, setNewHabitName] = useState('');

  // R6: 程式化邏輯 - 從 Supabase 讀取習慣列表
  const fetchHabits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        setHabits([]);
        return;
      }
      const { data, error: fetchErr } = await supabase
        .from('HabitTracking')
        .select('*') // 讀取所有欄位
        .eq('user_id', uid)
        .order('created_at', { ascending: true }); // 按創建時間排序
      if (fetchErr) throw new Error(fetchErr.message);
      setHabits((data as any as Habit[]) || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 元件掛載時自動執行數據獲取
  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  // R6: 程式化邏輯 - 新增一個習慣
  const handleAddHabit = useCallback(async () => {
    if (!newHabitName.trim()) return;
    setError(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        throw new Error('尚未登入，無法新增習慣');
      }
      const { data, error: insertErr } = await supabase
        .from('HabitTracking')
        .insert({ // R1: 類型安全 - 插入符合 HabitTracking 介面的數據
          user_id: uid,
          habit_name: newHabitName.trim(),
          current_streak: 0,
        } as any)
        .select()
        .single();
      if (insertErr) throw new Error(insertErr.message);
      setHabits((prev) => [...prev, data as any as Habit]); // 更新 UI
      setNewHabitName(''); // 清空輸入框
    } catch (err: any) {
      setError(err.message);
    }
  }, [newHabitName]);

  // R6: 程式化邏輯 - 為習慣打卡，增加連續天數
  const handleCheckIn = useCallback(async (habit: Habit) => {
    setError(null);
    // 簡化 MVP 邏輯：每次打卡 +1 連續天數。
    // 完整的「每日僅限一次」和「跨日重置」邏輯可在 V2 迭代中擴充。
    const newCount = (habit.current_streak || 0) + 1;
    
    // 樂觀更新 (Optimistic Update): 先更新 UI，再發送請求
    setHabits((prev) => prev.map(h => h.habit_id === habit.habit_id ? { ...h, current_streak: newCount } : h));
    
    try {
      const { error: updateErr } = await supabase
        .from('HabitTracking')
        .update({ current_streak: newCount } as any)
        .eq('habit_id', habit.habit_id);
      if (updateErr) throw new Error(updateErr.message);
    } catch (err: any) {
      setError(err.message);
      // R8: 防禦性設計 - 如果更新失敗，回滾 UI 狀態
      setHabits((prev) => prev.map(h => h.habit_id === habit.habit_id ? { ...h, current_streak: habit.current_streak } : h));
    }
  }, []);

  return (
    // R4: 響應式設計 - 採用 mobile-first 原則
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">習慣追蹤 (Habits)</h1>
      <p className="text-gray-600 mb-6">建立你的原子習慣，透過火焰連勝維持動能。</p>

      {/* 新增習慣區塊 */}
      <div className="mb-6 p-4 border rounded-lg bg-white shadow">
        <h2 className="text-xl font-semibold mb-3">新增習慣</h2>
        <div className="flex gap-2">
          <Input
            type="text"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)} // R3: 變數清晰
            placeholder="輸入新的習慣名稱..."
            onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
          />
          <Button onClick={handleAddHabit} disabled={loading}>新增</Button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {/* 習慣列表 */}
      {loading ? (
        <p className="text-center">讀取習慣中...</p>
      ) : habits.length === 0 ? (
        <p className="text-center text-gray-500">尚無習慣，試著新增一個吧。</p>
      ) : (
        <div className="space-y-3">
          {habits.map(habit => (
            <div key={habit.habit_id} className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm">
              <div>
                <p className="font-medium text-gray-900">{habit.habit_name}</p>
                <div className="mt-1"><StreakFlame count={habit.current_streak || 0} /></div>
              </div>
              <Button onClick={() => handleCheckIn(habit)} variant="secondary">打卡 +1</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HabitsPage;
