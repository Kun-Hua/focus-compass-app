"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useGoals } from '@/components/GoalsContext';
import { supabase } from '@/lib/supabaseClient';

function abbrev(text: string | null, max = 30) {
  if (!text) return '';
  if (text.length <= max) return text;
  return text.slice(0, max) + '…';
}

export default function TopAnchor() {
  const { coreTop5 } = useGoals();
  const [mission, setMission] = useState('');
  const [percent, setPercent] = useState(0);
  const [numerator, setNumerator] = useState(0);
  const [denominator, setDenominator] = useState(0);

  const coreGoalIds = useMemo(() => coreTop5.map(g => g.goal_id), [coreTop5]);
  const annualTarget = useMemo(() => coreTop5.reduce((s, g) => s + (g.annual_target_hrs || 0), 0), [coreTop5]);

  useEffect(() => {
    async function run() {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        setMission('');
        setPercent(0);
        setNumerator(0);
        setDenominator(0);
        return;
      }
      const { data: userRow } = await supabase
        .from('User')
        .select('mission_statement')
        .eq('user_id', uid)
        .maybeSingle<{ mission_statement: string | null }>();
      setMission(abbrev((userRow?.mission_statement ?? '') as string));

      const start = new Date(new Date().getFullYear(), 0, 1);
      const end = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);
      const { data: sessions } = await supabase
        .from('FocusSessionLog')
        .select('goal_id,start_time,duration_minutes,honesty_mode')
        .in('goal_id', coreGoalIds.length ? coreGoalIds : ['__none__'])
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString());

      const typed = (sessions ?? []) as Array<{ goal_id: string; start_time: string; duration_minutes: number; honesty_mode: boolean }>;
      const honestMinutes = typed.reduce((s, r) => s + (r.honesty_mode ? (r.duration_minutes || 0) : 0), 0);
      const investedHours = honestMinutes / 60;
      const denom = annualTarget;
      const pct = denom > 0 ? Math.min(100, Math.round((investedHours / denom) * 100)) : 0;
      setNumerator(investedHours);
      setDenominator(denom);
      setPercent(pct);
    }
    run();
  }, [coreGoalIds.join('|'), annualTarget]);

  return (
    <div className="w-full sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="container mx-auto p-4 flex flex-col gap-2">
        <div className="text-sm text-gray-600">{mission}</div>
        <div className="w-full h-3 bg-gray-200 rounded">
          <div className="h-3 bg-green-600 rounded" style={{ width: `${percent}%` }} />
        </div>
        <div className="text-xs text-gray-700">{numerator.toFixed(1)} / {denominator.toFixed(1)} 小時（{percent}%）</div>
      </div>
    </div>
  );
}
