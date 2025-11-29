"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useGoals } from '@/components/GoalsContext';
import { supabase } from '@/lib/supabaseClient';
import { classifyR6, computeHonestyRatio, computeWeeklyAttainmentRate, sumWeeklyData, TrafficLight } from '@/utils/dashboardLogic';

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

export default function DiagnosisCard() {
  const { coreTop5 } = useGoals();
  const coreGoalIds = useMemo(() => coreTop5.map(g => g.goal_id), [coreTop5]);
  const [attainment, setAttainment] = useState(0);
  const [honesty, setHonesty] = useState(0);
  const [light, setLight] = useState<TrafficLight>('yellow');
  const [committedHours, setCommittedHours] = useState(0);
  const [investedHours, setInvestedHours] = useState(0);

  useEffect(() => {
    async function run() {
      const { start, end } = getWeekRange(new Date());
      const { data: wc } = await supabase
        .from('WeeklyCommitment')
        .select('goal_id,committed_hours,week_start_date')
        .in('goal_id', coreGoalIds.length ? coreGoalIds : [''])
        .gte('week_start_date', start.toISOString().slice(0,10))
        .lte('week_start_date', end.toISOString().slice(0,10));

      const wcTyped = (wc ?? []) as Array<{ goal_id: string; committed_hours: number; week_start_date: string }>;
      const weeklyCommitted = wcTyped.reduce((s, r) => s + (r.committed_hours || 0), 0);

      const { data: sessions } = await supabase
        .from('FocusSessionLog')
        .select('goal_id,start_time,duration_minutes,honesty_mode')
        .in('goal_id', coreGoalIds.length ? coreGoalIds : [''])
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString());

      const fsTyped = (sessions ?? []) as Array<{ start_time: string; duration_minutes: number; honesty_mode: boolean }>;
      const sum = sumWeeklyData(fsTyped, start, end);
      const ar = computeWeeklyAttainmentRate(weeklyCommitted, sum.investedHours);
      const hr = computeHonestyRatio(sum.honestMinutes, sum.totalMinutes);
      const tl = classifyR6(ar, hr);

      setCommittedHours(weeklyCommitted);
      setInvestedHours(sum.investedHours);
      setAttainment(ar);
      setHonesty(hr);
      setLight(tl);
    }
    run();
  }, [coreGoalIds.join('|')]);

  const color = light === 'red' ? 'bg-red-500' : light === 'green' ? 'bg-green-600' : 'bg-yellow-400';

  return (
    <div className="rounded border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <h3 className="text-lg font-semibold">診斷總覽</h3>
      </div>
      <div className="space-y-2 text-sm text-gray-700">
        <div>本週承諾總時數：{committedHours.toFixed(1)}h</div>
        <div>已投入時數：{investedHours.toFixed(1)}h</div>
        <div>週承諾達成率：{attainment}%</div>
        <div>高誠實度時長比率：{honesty}%</div>
      </div>
      <div className="space-y-2">
        <div className="w-full h-2 bg-gray-200 rounded">
          <div className="h-2 bg-blue-600 rounded" style={{ width: `${attainment}%` }} />
        </div>
        <div className="w-full h-2 bg-gray-200 rounded">
          <div className="h-2 bg-emerald-600 rounded" style={{ width: `${honesty}%` }} />
        </div>
      </div>
    </div>
  );
}
