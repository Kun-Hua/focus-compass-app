import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getCurrentWeekRangeTaipei() {
  const now = new Date();
  const tpe = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
  const day = tpe.getDay();
  const currentWeekMonday = new Date(tpe);
  const diffToMonday = day === 0 ? -6 : 1 - day;
  currentWeekMonday.setDate(tpe.getDate() + diffToMonday);
  currentWeekMonday.setHours(0, 0, 0, 0);
  const end = new Date(currentWeekMonday);
  end.setDate(currentWeekMonday.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start: currentWeekMonday.toISOString(), end: end.toISOString() };
}

async function computeWeeklyMetrics(supabase: any, userId: string, startIso: string, endIso: string) {
  const { data: goals, error: gErr } = await supabase
    .from('Goal')
    .select('goal_id')
    .eq('user_id', userId);
  if (gErr) throw gErr;
  const ids = (goals || []).map((g: any) => g.goal_id);
  if (ids.length === 0) {
    return { netCommittedMinutes: 0, totalDurationMinutes: 0, honestyRatio: 0, interruptionFrequency: 0, commitmentRate: 0 };
  }

  const { data: logs, error: lErr } = await supabase
    .from('FocusSessionLog')
    .select('duration_minutes, honesty_mode, interruption_count, start_time')
    .in('goal_id', ids)
    .gte('start_time', startIso)
    .lte('start_time', endIso);
  if (lErr) throw lErr;

  let net = 0, total = 0, ints = 0;
  (logs || []).forEach((l: any) => {
    const d = l?.duration_minutes || 0;
    total += d;
    ints += l?.interruption_count || 0;
    if (l?.honesty_mode === true) net += d;
  });
  const avgInt = (logs?.length || 0) > 0 ? ints / (logs!.length) : 0;
  const ratio = total > 0 ? net / total : 0;
  const weeklyTargetMinutes = 5 * 60;
  const commitmentRate = weeklyTargetMinutes > 0 ? Math.min(1, net / weeklyTargetMinutes) : 0;
  return {
    netCommittedMinutes: net,
    totalDurationMinutes: total,
    honestyRatio: Number(ratio.toFixed(2)),
    interruptionFrequency: Number(avgInt.toFixed(2)),
    commitmentRate: Number(commitmentRate.toFixed(2)),
  };
}

export async function GET(req: NextRequest, { params }: { params: { partner_user_id: string } }) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing Supabase env' }), { status: 500 });
    }
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { searchParams } = new URL(req.url);
    const ownerUserId = searchParams.get('owner');
    const partnerUserId = params.partner_user_id;
    if (!ownerUserId || !partnerUserId) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing owner or partner id' }), { status: 400 });
    }
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    // 檢查雙向 active 關係
    const { data: rows1, error: e1 } = await supabase
      .from('AccountabilityPartner')
      .select('status')
      .eq('owner_user_id', ownerUserId)
      .eq('partner_user_id', partnerUserId)
      .limit(1);
    if (e1) throw e1;
    const { data: rows2, error: e2 } = await supabase
      .from('AccountabilityPartner')
      .select('status, visibility')
      .eq('owner_user_id', partnerUserId)
      .eq('partner_user_id', ownerUserId)
      .limit(1);
    if (e2) throw e2;

    const aToB = Array.isArray(rows1) && rows1[0] && rows1[0].status === 'active';
    const bToA = Array.isArray(rows2) && rows2[0] && rows2[0].status === 'active';
    if (!aToB || !bToA) {
      return new Response(JSON.stringify({ ok: false, error: 'Not active partners' }), { status: 403 });
    }

    const reverseVisibility = (Array.isArray(rows2) && rows2[0] && (rows2[0] as any).visibility) || {};

    let startIso: string;
    let endIso: string;
    if (startParam && endParam) {
      startIso = startParam;
      endIso = endParam;
    } else {
      const { start, end } = getCurrentWeekRangeTaipei();
      startIso = start;
      endIso = end;
    }

    const ownerMetrics = await computeWeeklyMetrics(supabase, ownerUserId, startIso, endIso);
    const partnerMetrics = await computeWeeklyMetrics(supabase, partnerUserId, startIso, endIso);

    const maskedPartner = {
      netCommittedMinutes: reverseVisibility.netCommittedMinutes ? partnerMetrics.netCommittedMinutes : null,
      totalDurationMinutes: reverseVisibility.totalDurationMinutes ? partnerMetrics.totalDurationMinutes : null,
      honestyRatio: reverseVisibility.honestyRatio ? partnerMetrics.honestyRatio : null,
      interruptionFrequency: reverseVisibility.interruptionFrequency ? partnerMetrics.interruptionFrequency : null,
      commitmentRate: partnerMetrics.commitmentRate, // 承諾達成率僅基於 netCommitted/目標，本例不遮蔽
    };

    return new Response(JSON.stringify({ ok: true, range: { start: startIso, end: endIso }, owner: ownerMetrics, partner: maskedPartner }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || String(e) }), { status: 500 });
  }
}
