"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useGoals } from '@/components/GoalsContext';
import { supabase } from '@/lib/supabaseClient';
import { classifyR6, computeHonestyRatio } from '@/utils/dashboardLogic';

function getWeekRange(d: Date) {
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7;
  const start = new Date(d);
  start.setDate(d.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

type GoalHealth = {
  id: string;
  name: string;
  committedHours: number;
  actualHours: number;
  healthStatus: { status: 'Green'|'Yellow'|'Red'; label: string };
};

export default function DiagnosisSummary() {
    const { coreTop5, goalPlans } = useGoals();
    const coreGoalIds = useMemo(() => coreTop5.map(g => g.goal_id), [coreTop5]);
    const [items, setItems] = useState<GoalHealth[]>([]);

    // 當 items 計算完成後，檢查是否所有目標都達標，並更新週連勝狀態
    useEffect(() => {
        if (items.length === 0 || items.length < coreTop5.length) {
            return; // 等待所有目標健康度計算完成
        }

        // 檢查是否所有目標的實際投入都大於等於承諾時數
        const allGoalsMet = items.every(item => item.actualHours >= item.committedHours);

        const updateStreak = async () => {
            const { error } = await supabase.rpc('update_weekly_streak_status', {
                last_week_all_goals_met: allGoalsMet
            });
            if (error) console.error('更新週連勝紀錄失敗:', error);
        };
        updateStreak();
    }, [items, coreTop5.length]);

    useEffect(() => {
        async function run() {
            if (coreGoalIds.length === 0) return;

            const { start, end } = getWeekRange(new Date());
            
            // 1. 從 Context 獲取承諾時數
            const committedMap = new Map<string, number>();
            goalPlans.forEach(plan => {
                if (coreGoalIds.includes(plan.goalId)) {
                    committedMap.set(plan.goalId, Number(plan.plans.weeklyHours) || 0);
                }
            });

            // 2. 從 DB 獲取實際投入時數
            const { data: sessions } = await supabase
                .from('FocusSessionLog')
                .select('goal_id,start_time,duration_minutes,honesty_mode')
                .in('goal_id', coreGoalIds)
                .gte('start_time', start.toISOString())
                .lte('start_time', end.toISOString());

            const perGoal = new Map<string, { total: number; honest: number }>();
            for (const s of (sessions ?? [])) {
                const g = s.goal_id;
                const prev = perGoal.get(g) || { total: 0, honest: 0 };
                const dur = s.duration_minutes || 0;
                perGoal.set(g, {
                    total: prev.total + dur,
                    honest: prev.honest + (s.honesty_mode ? dur : 0),
                });
            }

            // 3. 計算並產生診斷結果
            const result: GoalHealth[] = coreTop5.map(g => {
                const committed = committedMap.get(g.goal_id) || 0;
                const totals = perGoal.get(g.goal_id) || { total: 0, honest: 0 };
                const actualHours = totals.total / 60;
                const commitmentRate = committed > 0 ? (actualHours / committed) : (actualHours > 0 ? 1 : 0);
                const honestyRatio = computeHonestyRatio(totals.honest, totals.total) / 100;
                
                const status = classifyR6(Math.round(commitmentRate * 100), Math.round(honestyRatio * 100));
                const label = status === 'green' ? '狀態健康' : status === 'yellow' ? '需注意' : '高風險';

                return {
                    id: g.goal_id,
                    name: g.goal_name,
                    committedHours: committed,
                    actualHours,
                    healthStatus: {
                        status: label === '狀態健康' ? 'Green' : label === '需注意' ? 'Yellow' : 'Red',
                        label,
                    },
                };
            });
            setItems(result);
        }
        run();
    }, [coreTop5, goalPlans, coreGoalIds]);

    const colorMap: Record<string, string> = {
        Green: 'text-green-500 bg-green-100',
        Yellow: 'text-yellow-500 bg-yellow-100',
        Red: 'text-red-500 bg-red-100',
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl mt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center">🩺 R6 目標診斷總覽</h3>
            <div className="text-xs text-gray-600 mb-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"/> 狀態健康：本週實際 ≥ 承諾，誠實度良好</span>
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block"/> 需注意：接近承諾或誠實度中等</span>
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"/> 高風險：低於承諾或誠實度偏低</span>
            </div>
            <div className="space-y-3">
                {items.map((goal) => (
                    <div key={goal.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                        <span className="text-sm font-medium text-gray-800 truncate flex-1">{goal.name}</span>
                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold ${colorMap[goal.healthStatus.status]}`}>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" /></svg>
                            <span>{goal.healthStatus.label}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}