// Weekly Report Edge Function (Deno)
// 目的：每週計算使用者的專注統計並發送 Email 給問責夥伴
// 觸發方式：
// - Supabase Scheduled Triggers / 外部 cron 以 HTTP POST 觸發
// - 本函式不做授權驗證（可加上自訂密鑰）

import { serve } from 'https://deno.land/std@0.178.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const sendgridKey = Deno.env.get('SENDGRID_API_KEY');
    const fromEmail = Deno.env.get('REPORT_FROM_EMAIL') || 'no-reply@example.com';
    const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'https://example.com';

    if (!supabaseUrl || !serviceKey) {
      return json({ ok: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { weekStart, weekEnd } = getLastWeekRangeTaipei();

    // 1) 找出所有擁有問責夥伴的使用者與夥伴設定
    // 需求：資料表 public.AccountabilityPartner
    // 欄位：id, owner_user_id, partner_email, partner_user_id, role, visibility(jsonb), status('pending'|'active'|'revoked')
    const { data: partners, error: partnersErr } = await supabase
      .from('AccountabilityPartner')
      .select('*')
      .eq('status', 'active');

    if (partnersErr) {
      return json({ ok: false, error: `partners_query_failed: ${partnersErr.message}` }, 500);
    }

    if (!partners || partners.length === 0) {
      return json({ ok: true, message: 'No active partners; skip.' });
    }

    // 2) 以 owner_user_id 分組，計算每位使用者上週統計
    const owners = [...new Set(partners.map((p: any) => p.owner_user_id))];

    const results: Array<any> = [];

    for (const userId of owners) {
      const metrics = await computeWeeklyMetrics(supabase, userId, weekStart, weekEnd);
      const userPartners = partners.filter((p: any) => p.owner_user_id === userId);
      results.push({ userId, metrics, partners: userPartners });
    }

    // 3) 寄送 Email（若設定了 SENDGRID_API_KEY）
    const deliveries: any[] = [];
    if (sendgridKey) {
      for (const r of results) {
        for (const partner of r.partners) {
          const to = partner.partner_email; // 若用戶以 email 邀請
          if (!to) continue;
          const body = buildEmailBody(appBaseUrl, r.metrics, partner.visibility || {});
          const subject = `每週問責報告 (${weekStart} ~ ${weekEnd})`;
          const sendRes = await sendBySendGrid(sendgridKey, fromEmail, to, subject, body);
          deliveries.push({ to, ok: sendRes.ok, status: sendRes.status });
        }
      }
    }

    return json({ ok: true, range: { weekStart, weekEnd }, resultsCount: results.length, deliveries });
  } catch (e) {
    return json({ ok: false, error: `INSTANCE_ERROR: ${e?.message || e}` }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function getLastWeekRangeTaipei() {
  // 以台北時區計算上週週一 00:00 到 週日 23:59:59
  const now = new Date();
  const tz = { timeZone: 'Asia/Taipei' } as const;
  const tpe = new Date(now.toLocaleString('en-US', tz));

  // 找出本週一
  const day = tpe.getDay(); // 0 Sun..6 Sat
  const currentWeekMonday = new Date(tpe);
  const diffToMonday = day === 0 ? -6 : 1 - day; // 移到本週一
  currentWeekMonday.setDate(tpe.getDate() + diffToMonday);
  currentWeekMonday.setHours(0, 0, 0, 0);

  // 上週範圍
  const lastWeekMonday = new Date(currentWeekMonday);
  lastWeekMonday.setDate(currentWeekMonday.getDate() - 7);
  const lastWeekSundayEnd = new Date(currentWeekMonday);
  lastWeekSundayEnd.setMilliseconds(-1); // 本週一的前一毫秒

  const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);
  return {
    weekStart: toIsoDate(lastWeekMonday),
    weekEnd: toIsoDate(lastWeekSundayEnd),
    startDate: lastWeekMonday,
    endDate: lastWeekSundayEnd,
  };
}

async function computeWeeklyMetrics(supabase: any, userId: string, weekStartDate: string, weekEndDate: string) {
  // 從 FocusSessionLog 取得該使用者所有目標在上週期間的紀錄
  // 資料表：Goal(goal_id, user_id), FocusSessionLog(goal_id, duration_minutes, honesty_mode, interruption_count, start_time)

  // 先找此使用者所有 goal_id
  const { data: goals, error: goalErr } = await supabase
    .from('Goal')
    .select('goal_id')
    .eq('user_id', userId);
  if (goalErr) throw goalErr;
  const goalIds = (goals || []).map((g: any) => g.goal_id);
  if (goalIds.length === 0) return emptyMetrics();

  // 取出上週的 focus logs
  const { data: logs, error: logErr } = await supabase
    .from('FocusSessionLog')
    .select('duration_minutes, honesty_mode, interruption_count, start_time')
    .in('goal_id', goalIds)
    .gte('start_time', `${weekStartDate}T00:00:00.000Z`)
    .lte('start_time', `${weekEndDate}T23:59:59.999Z`);
  if (logErr) throw logErr;

  if (!logs || logs.length === 0) return emptyMetrics();

  let netCommittedMinutes = 0;
  let totalDurationMinutes = 0;
  let totalInterruptions = 0;

  for (const l of logs as any[]) {
    totalDurationMinutes += l.duration_minutes || 0;
    totalInterruptions += l.interruption_count || 0;
    if (l.honesty_mode === true) netCommittedMinutes += l.duration_minutes || 0;
  }

  const interruptionFrequency = logs.length > 0 ? totalInterruptions / logs.length : 0;
  const honestyRatio = totalDurationMinutes > 0 ? netCommittedMinutes / totalDurationMinutes : 0;

  // 簡版達成率：淨投入 / 預設門檻（可改以 user 設定或目標承諾）
  const weeklyTargetMinutes = 5 * 60; // 預設門檻 5 小時
  const commitmentRate = weeklyTargetMinutes > 0 ? Math.min(1, netCommittedMinutes / weeklyTargetMinutes) : 0;

  return {
    netCommittedMinutes,
    totalDurationMinutes,
    honestyRatio: Number(honestyRatio.toFixed(2)),
    interruptionFrequency: Number(interruptionFrequency.toFixed(2)),
    commitmentRate: Number(commitmentRate.toFixed(2)),
  };
}

function emptyMetrics() {
  return {
    netCommittedMinutes: 0,
    totalDurationMinutes: 0,
    honestyRatio: 0,
    interruptionFrequency: 0,
    commitmentRate: 0,
  };
}

function buildEmailBody(appBaseUrl: string, m: any, visibility: any) {
  const v = visibility || {};
  const lines: string[] = [];
  lines.push('您好，這是自動產生的每週問責報告摘要：');
  if (v.netCommittedMinutes !== false) lines.push(`- 淨投入時長：${m.netCommittedMinutes} 分鐘`);
  if (v.honestyRatio !== false) lines.push(`- 誠實度比例：${(m.honestyRatio * 100).toFixed(0)}%`);
  if (v.interruptionFrequency !== false) lines.push(`- 中斷頻率：${m.interruptionFrequency} 次/次紀錄`);
  if (v.totalDurationMinutes === true) lines.push(`- 總投入時長：${m.totalDurationMinutes} 分鐘`);
  lines.push(`- 目標承諾達成率（估算）：${(m.commitmentRate * 100).toFixed(0)}%`);
  lines.push('');
  lines.push(`前往儀表板查看更多：${appBaseUrl}`);
  return lines.join('\n');
}

async function sendBySendGrid(apiKey: string, from: string, to: string, subject: string, text: string) {
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      subject,
      content: [{ type: 'text/plain', value: text }],
    }),
  });
  return { ok: res.ok, status: res.status };
}
