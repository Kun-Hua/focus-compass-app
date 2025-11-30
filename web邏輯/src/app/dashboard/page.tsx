'use client';

import React from 'react';
import { useWeeklyStreak } from '@/hooks/useWeeklyStreak';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import MITCard from '@/components/Dashboard/MITCard';
import DiagnosisSummary from '@/components/Dashboard/DiagnosisSummary';
import ReviewDataSection from '@/components/Dashboard/ReviewDataSection';
import { useGoals } from '@/components/GoalsContext';

interface EnrichedFocusSessionLog {
  session_id: string;
  goal_id: string;
  subgoal_id: string | null;
  duration_minutes: number;
  honesty_mode: boolean;
  created_at: string;
  goal_name: string;
  subgoal_name?: string;
}

interface GoalStat {
  goal_id: string;
  goal_name: string;
  total_minutes: number;
  honest_minutes: number;
  self_deception_minutes: number;
  sessions: number;
}

interface SubgoalStat {
  subgoal_id: string;
  subgoal_name: string;
  goal_id: string;
  goal_name: string;
  total_minutes: number;
  honest_minutes: number;
  self_deception_minutes: number;
  sessions: number;
}

interface Goal {
  goal_id: string;
  goal_name: string;
}

/**
 * 將分鐘數格式化為更易讀的 "X 小時 Y 分鐘" 格式
 * @param minutes 分鐘總數
 * @returns 格式化後的字串
 */
const formatMinutesToHoursAndMinutes = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} 分鐘`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} 小時 ${remainingMinutes > 0 ? `${remainingMinutes} 分鐘` : ''}`.trim();
};

type TimeRange = 'all' | 'month' | 'week' | 'day';

const MetricCard = ({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) => (
  <Card className="flex-1">
    <CardHeader>
      <CardTitle className="text-base text-gray-600">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      {subtitle ? <div className="text-sm text-gray-500 mt-1">{subtitle}</div> : null}
    </CardContent>
  </Card>
);

const DashboardPage: React.FC = () => {
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const { coreTop5, goalPlans } = useGoals();
  const coreGoalIds = React.useMemo(() => coreTop5.map(g => g.goal_id), [coreTop5]);

  const { weeklyStreak, isLoading: streakLoading, error: streakError, refresh: refreshStreak } = useWeeklyStreak(refreshKey);

  const weeklyCommittedSum = React.useMemo(() => {
      const coreIds = new Set(coreTop5.map(g => g.goal_id));
      return goalPlans
        .filter(plan => coreIds.has(plan.goalId))
        .reduce((sum, plan) => sum + (Number(plan.plans.weeklyHours) || 0), 0);
  }, [goalPlans, coreTop5]);
  // --- 從 ExecutePage 移過來的儀表板狀態 ---
  const [logs, setLogs] = React.useState<EnrichedFocusSessionLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [timeRange, setTimeRange] = React.useState<TimeRange>('all');
  const [totalMinutes, setTotalMinutes] = React.useState(0);
  const [goalStats, setGoalStats] = React.useState<GoalStat[]>([]);
  const [subgoalStats, setSubgoalStats] = React.useState<SubgoalStat[]>([]);
  const [achievedThisWeek, setAchievedThisWeek] = React.useState<boolean>(false);
  const [weeklyChecks, setWeeklyChecks] = React.useState<Array<{ goal_id: string; goal_name: string; required: number; actual: number }>>([]);

  // 載入所有目標以供選擇
  React.useEffect(() => {
    const fetchGoals = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        setGoals([]);
        return;
      }
      const { data, error } = await supabase
        .from('Goal')
        .select('goal_id, goal_name')
        .eq('user_id', uid);
      if (data) setGoals(data);
    };
    fetchGoals();
  }, []); // 這個 effect 只在初次載入時執行

  const fetchDetailedStats = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    let fromDate: string | undefined = undefined;
    if (timeRange !== 'all') {
      const now = new Date();
      if (timeRange === 'day') {
        now.setHours(0, 0, 0, 0);
      } else if (timeRange === 'week') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
        now.setDate(diff);
        now.setHours(0, 0, 0, 0);
      } else if (timeRange === 'month') {
        now.setDate(1);
        now.setHours(0, 0, 0, 0);
      }
      fromDate = now.toISOString();
    }

    // 僅限於目前使用者的目標
    const goalIds = goals.map(g => g.goal_id);
    if (goalIds.length === 0) {
      setLogs([]);
      setTotalMinutes(0);
      setGoalStats([]);
      setAchievedThisWeek(false);
      setWeeklyChecks([]);
      setLoading(false);
      return;
    }
    let query = supabase
      .from('FocusSessionLog')
      .select(`
        session_id,
        goal_id,
        subgoal_id,
        duration_minutes,
        honesty_mode,
        created_at
      `)
      .order('created_at', { ascending: false });

    // 限定只取使用者的目標
    query = query.in('goal_id', goalIds);

    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      console.error('[Dashboard] Error fetching detailed stats:', fetchError);
      setError(`無法載入專注紀錄: ${fetchError.message}`);
    } else {
      console.log('[Dashboard] Fetched raw data:', data);
      // 批次查詢 Goal 與 Subgoal 名稱，避免多重關聯歧義
      const goalIds = Array.from(new Set((data || []).map((l: any) => l.goal_id).filter((v: any) => !!v)));
      const subgoalIds = Array.from(new Set((data || []).map((l: any) => l.subgoal_id).filter((v: any) => !!v)));
      let goalNameMap = new Map<string, string>();
      if (goalIds.length > 0) {
        const { data: goalsRows } = await supabase
          .from('Goal')
          .select('goal_id,goal_name')
          .in('goal_id', goalIds);
        (goalsRows || []).forEach((g: any) => goalNameMap.set(g.goal_id, g.goal_name));
      }
      let subgoalNameMap = new Map<string, { name: string; goal_id: string }>();
      if (subgoalIds.length > 0) {
        const { data: subRows } = await supabase
          .from('Subgoal')
          .select('subgoal_id, name, goal_id')
          .in('subgoal_id', subgoalIds);
        (subRows || []).forEach((s: any) => subgoalNameMap.set(s.subgoal_id, { name: s.name, goal_id: s.goal_id }));
      }
      const enrichedData = (data || []).map((log: any) => ({
        ...log,
        goal_name: goalNameMap.get(log.goal_id) || '未知目標',
        subgoal_name: log.subgoal_id ? (subgoalNameMap.get(log.subgoal_id)?.name || '未命名小目標') : undefined,
      })) as EnrichedFocusSessionLog[];
      console.log('[Dashboard] Enriched data:', enrichedData);
      setLogs(enrichedData);

      const total = enrichedData.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
      setTotalMinutes(total);

      const stats: Record<string, GoalStat> = {};
      const sStats: Record<string, SubgoalStat> = {};
      for (const log of enrichedData) {
        if (!log.goal_id) continue;
        if (!stats[log.goal_id]) {
          stats[log.goal_id] = {
            goal_id: log.goal_id,
            goal_name: log.goal_name,
            total_minutes: 0,
            honest_minutes: 0,
            self_deception_minutes: 0,
            sessions: 0,
          };
        }
        const duration = log.duration_minutes || 0;
        stats[log.goal_id].total_minutes += duration;
        if (log.honesty_mode) {
          stats[log.goal_id].honest_minutes += duration;
        } else {
          stats[log.goal_id].self_deception_minutes += duration;
        }
        stats[log.goal_id].sessions += 1;

        if (log.subgoal_id) {
          if (!sStats[log.subgoal_id]) {
            sStats[log.subgoal_id] = {
              subgoal_id: log.subgoal_id,
              subgoal_name: log.subgoal_name || '未命名小目標',
              goal_id: log.goal_id,
              goal_name: log.goal_name,
              total_minutes: 0,
              honest_minutes: 0,
              self_deception_minutes: 0,
              sessions: 0,
            };
          }
          sStats[log.subgoal_id].total_minutes += duration;
          if (log.honesty_mode) sStats[log.subgoal_id].honest_minutes += duration;
          else sStats[log.subgoal_id].self_deception_minutes += duration;
          sStats[log.subgoal_id].sessions += 1;
        }
      }
      console.log('[Dashboard] Calculated goal stats:', Object.values(stats));
      setGoalStats(Object.values(stats).sort((a, b) => b.total_minutes - a.total_minutes));
      setSubgoalStats(Object.values(sStats).sort((a, b) => b.total_minutes - a.total_minutes));

      // 計算本週是否全達成（依各目標 weeklyHours）
      try {
        const { start, end } = getWeekRange(new Date());
        const weekLogs = enrichedData.filter(l => {
          const t = new Date(l.created_at).getTime();
          return t >= start.getTime() && t <= end.getTime();
        });
        const minutesByGoal = new Map<string, number>();
        for (const l of weekLogs) {
          if (!l.goal_id) continue;
          minutesByGoal.set(l.goal_id, (minutesByGoal.get(l.goal_id) || 0) + (l.duration_minutes || 0));
        }
        // 取核心目標的承諾時數（只檢查 > 0 的目標）
        const targets = coreTop5.map(g => {
          const plan = goalPlans.find(p => p.goalId === g.goal_id);
          const hrs = Number(plan?.plans.weeklyHours || 0);
          return { goalId: g.goal_id, minutes: Math.max(0, Math.round(hrs * 60)) };
        }).filter(t => t.minutes > 0);

        const ok = targets.length > 0 && targets.every(t => (minutesByGoal.get(t.goalId) || 0) >= t.minutes);
        setAchievedThisWeek(ok);

        // 調試：填入每個核心目標的實際 vs 需要分鐘數
        const checks = coreTop5.map(g => {
          const plan = goalPlans.find(p => p.goalId === g.goal_id);
          const hrs = Number(plan?.plans.weeklyHours || 0);
          const required = Math.max(0, Math.round(hrs * 60));
          const actual = minutesByGoal.get(g.goal_id) || 0;
          return { goal_id: g.goal_id, goal_name: g.goal_name, required, actual };
        });
        setWeeklyChecks(checks);
      } catch {
        setAchievedThisWeek(false);
        setWeeklyChecks([]);
      }
    }
    setLoading(false);
  }, [timeRange, coreTop5, goalPlans, goals]);

  React.useEffect(() => {
    fetchDetailedStats();
    refreshStreak();

    // 當頁面重新變為可見時 (例如，從其他頁面切換回來)，重新整理數據
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleRefreshAll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchDetailedStats]); // 保持不變

  const handleRefreshAll = () => {
    setRefreshKey(prev => prev + 1); // 觸發所有依賴 refreshKey 的 hooks
    fetchDetailedStats(); // 重用已有的 fetch 邏輯
  };

  // 取本週範圍
  const getWeekRange = (d: Date) => {
    const day = d.getDay();
    const diffToMonday = (day + 6) % 7;
    const start = new Date(d);
    start.setDate(d.getDate() - diffToMonday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  // ---- Reflect 區塊：過去一週的中斷建議、角色平衡、熱力圖 ----
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">儀表板 (Dashboard)</h1>
        <div className="flex items-center space-x-4">
          <Button onClick={handleRefreshAll} variant="outline">Refresh</Button>
          <ToggleGroup
            type="single"
            defaultValue="all"
            value={timeRange}
            onValueChange={(value: TimeRange) => {
              if (value) setTimeRange(value);
            }}
            aria-label="選擇時間範圍"
          >
            <ToggleGroupItem value="day" aria-label="今天">今天</ToggleGroupItem>
            <ToggleGroupItem value="week" aria-label="本週">本週</ToggleGroupItem>
            <ToggleGroupItem value="month" aria-label="本月">本月</ToggleGroupItem>
            <ToggleGroupItem value="all" aria-label="全部">全部</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* --- DEBUG LOGGING --- */}
      <script dangerouslySetInnerHTML={{ __html: `
        console.log('[Dashboard] Streak hook state:', { weeklyStreak: ${weeklyStreak}, isLoading: ${streakLoading}, error: '${streakError}' });
      `}} />
      {/* --- END DEBUG LOGGING --- */}

      {/* 原子清單區塊 (移至最上方) */}
      <div className="mb-8">
        {streakLoading ? (
          <Card className="text-center p-8 bg-gray-50 animate-pulse"><p>讀取連勝紀錄中...</p></Card>
        ) : streakError ? (
          <Card className="text-center p-8 bg-red-50 text-red-600"><p>{streakError}</p></Card>
        ) : (
          <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg relative">
            <CardHeader>
              <CardTitle>週承諾連勝</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {(() => {
                const displayStreak = achievedThisWeek ? Math.max(1, weeklyStreak) : weeklyStreak;
                return (
                  <>
                    <div className="text-7xl font-extrabold">🔥 {displayStreak}</div>
                    <p className="text-lg mt-2 font-semibold">
                      {achievedThisWeek ? '本週各核心目標承諾皆已達成！' : `連續 ${displayStreak} 週達成承諾`}
                    </p>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>

      {loading ? (
        <p className="text-center">讀取專注紀錄中...</p>
      ) : error ? (
        <p className="text-center text-red-600">{error}</p>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MITCard />
            </div>
            <div className="lg:col-span-1 p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">本週總承諾</h4>
              <p className="text-3xl font-extrabold text-indigo-700">{weeklyCommittedSum} Hrs</p>
              <p className="text-sm text-gray-500 mt-2">這是一個聚焦於核心目標，而非雜務的儀表板。</p>
            </div>
          </div>

          <DiagnosisSummary />

          <ReviewDataSection />

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">總專注時長</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-extrabold text-blue-900">{formatMinutesToHoursAndMinutes(totalMinutes)}</p>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">各目標分析</h3>
            {goalStats.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {goalStats.map(stat => (
                  <Card key={stat.goal_id}>
                    <CardHeader>
                      <CardTitle>{stat.goal_name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p><strong>總時長:</strong> {formatMinutesToHoursAndMinutes(stat.total_minutes)}</p>
                      <p><strong>誠實時長:</strong> {formatMinutesToHoursAndMinutes(stat.honest_minutes)}</p>
                      <p><strong>自我欺騙:</strong> {formatMinutesToHoursAndMinutes(stat.self_deception_minutes)}</p>
                      <p><strong>專注次數:</strong> {stat.sessions} 次</p>
                      <p><strong>誠實度:</strong> {stat.total_minutes > 0 ? Math.round((stat.honest_minutes / stat.total_minutes) * 100) : 0}%</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">此時間範圍內沒有專注紀錄。</p>
            )}
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">小目標分析</h3>
            {subgoalStats.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subgoalStats.map(stat => (
                  <Card key={stat.subgoal_id}>
                    <CardHeader>
                      <CardTitle>{stat.subgoal_name} <span className="block text-xs text-gray-500">({stat.goal_name})</span></CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p><strong>總時長:</strong> {formatMinutesToHoursAndMinutes(stat.total_minutes)}</p>
                      <p><strong>誠實時長:</strong> {formatMinutesToHoursAndMinutes(stat.honest_minutes)}</p>
                      <p><strong>自我欺騙:</strong> {formatMinutesToHoursAndMinutes(stat.self_deception_minutes)}</p>
                      <p><strong>專注次數:</strong> {stat.sessions} 次</p>
                      <p><strong>誠實度:</strong> {stat.total_minutes > 0 ? Math.round((stat.honest_minutes / stat.total_minutes) * 100) : 0}%</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">此時間範圍內沒有小目標的專注紀錄。</p>
            )}
          </div>

          <Card>
            <CardHeader><CardTitle>詳細專注紀錄</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>目標名稱</TableHead>
                    <TableHead>專注時長 (分鐘)</TableHead>
                    <TableHead>誠實模式</TableHead>
                    <TableHead>紀錄時間</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length > 0 ? logs.map(log => (
                    <TableRow key={log.session_id}>
                      <TableCell>{log.goal_name}</TableCell>
                      <TableCell>{log.duration_minutes}</TableCell>
                      <TableCell>{log.honesty_mode ? '✅' : '❌'}</TableCell>
                      <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">沒有紀錄</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;