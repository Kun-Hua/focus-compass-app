export type TrafficLight = 'red' | 'yellow' | 'green';

export function computeWeeklyAttainmentRate(committedHours: number, investedHours: number): number {
  const c = Math.max(0, committedHours || 0);
  const i = Math.max(0, investedHours || 0);
  if (c === 0) return 0;
  return Math.min(100, Math.round((i / c) * 100));
}

export function computeHonestyRatio(honestMinutes: number, totalMinutes: number): number {
  const h = Math.max(0, honestMinutes || 0);
  const t = Math.max(0, totalMinutes || 0);
  if (t === 0) return 0;
  return Math.min(100, Math.round((h / t) * 100));
}

export function classifyR6(attainmentRate: number, honestyRatio: number): TrafficLight {
  if (attainmentRate < 50 || honestyRatio < 50) return 'red';
  if (attainmentRate < 80) return 'yellow';
  if (attainmentRate >= 80 && honestyRatio >= 70) return 'green';
  return 'yellow';
}

export type WeeklySum = {
  honestMinutes: number;
  totalMinutes: number;
  investedHours: number;
};

export function sumWeeklyData(
  sessions: Array<{ start_time: string; duration_minutes: number; honesty_mode: boolean }>,
  weekStart: Date,
  weekEnd: Date
): WeeklySum {
  const ws = weekStart.getTime();
  const we = weekEnd.getTime();
  let honestMinutes = 0;
  let totalMinutes = 0;
  for (const s of sessions) {
    const ts = new Date(s.start_time).getTime();
    if (ts >= ws && ts <= we) {
      totalMinutes += s.duration_minutes || 0;
      if (s.honesty_mode) honestMinutes += s.duration_minutes || 0;
    }
  }
  const investedHours = totalMinutes / 60;
  return { honestMinutes, totalMinutes, investedHours };
}
