-- RPC: get_partner_weekly
-- 用途：在 RLS 下以 SECURITY DEFINER 回傳 A 與 B 的每週彙總，並依 B→A 的 visibility 遮蔽欄位
-- 呼叫方式（前端）:
-- supabase.rpc('get_partner_weekly', { p_partner: '<partner_uuid>', p_start: '<ISO>', p_end: '<ISO>' })
-- 注意：owner 由 auth.uid() 決定，不能偽造

create or replace function public.get_partner_weekly(
  p_partner uuid,
  p_start timestamptz,
  p_end timestamptz
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
  v_partner uuid := p_partner;
  v_active_a_to_b boolean := false;
  v_visibility jsonb := '{}'::jsonb; -- 來自 B->A 的 visibility
  -- owner metrics
  o_net numeric := 0;
  o_total numeric := 0;
  o_ints numeric := 0;
  o_logs_count numeric := 0;
  -- partner metrics（未遮蔽前）
  p_net numeric := 0;
  p_total numeric := 0;
  p_ints numeric := 0;
  p_logs_count numeric := 0;
  -- result jsons
  o_ratio numeric := 0;
  o_intfreq numeric := 0;
  o_commit numeric := 0;
  p_ratio numeric := 0;
  p_intfreq numeric := 0;
  p_commit numeric := 0;
  weekly_target_minutes numeric := 300; -- 5*60
begin
  if v_owner is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '28000';
  end if;

  -- 雙向 active 檢查
  select exists (
    select 1 from public."AccountabilityPartner"
    where owner_user_id = v_owner and partner_user_id = v_partner and status = 'active'
  ) into v_active_a_to_b;

  if not v_active_a_to_b then
    raise exception 'NOT_ACTIVE_PARTNERS' using errcode = '42501';
  end if;

  select ap.visibility
  into v_visibility
  from public."AccountabilityPartner" ap
  where ap.owner_user_id = v_partner
    and ap.partner_user_id = v_owner
    and ap.status = 'active'
  limit 1;

  if v_visibility is null then
    raise exception 'NOT_ACTIVE_PARTNERS' using errcode = '42501';
  end if;

  -- Owner metrics
  with g as (
    select goal_id from public."Goal" where user_id = v_owner
  ), logs as (
    select f.duration_minutes, f.honesty_mode, coalesce(f.interruption_count,0) as interruption_count
    from public."FocusSessionLog" f
    where f.goal_id in (select goal_id from g)
      and f.start_time >= p_start and f.start_time <= p_end
  )
  select
    coalesce(sum(case when honesty_mode is true then duration_minutes else 0 end),0),
    coalesce(sum(duration_minutes),0),
    coalesce(sum(interruption_count),0),
    count(*)
  into o_net, o_total, o_ints, o_logs_count
  from logs;

  o_ratio := case when o_total > 0 then round(o_net / o_total, 2) else 0 end;
  o_intfreq := case when o_logs_count > 0 then round(o_ints / o_logs_count, 2) else 0 end;
  o_commit := round(least(1, case when weekly_target_minutes > 0 then o_net / weekly_target_minutes else 0 end), 2);

  -- Partner metrics（未遮蔽前）
  with g as (
    select goal_id from public."Goal" where user_id = v_partner
  ), logs as (
    select f.duration_minutes, f.honesty_mode, coalesce(f.interruption_count,0) as interruption_count
    from public."FocusSessionLog" f
    where f.goal_id in (select goal_id from g)
      and f.start_time >= p_start and f.start_time <= p_end
  )
  select
    coalesce(sum(case when honesty_mode is true then duration_minutes else 0 end),0),
    coalesce(sum(duration_minutes),0),
    coalesce(sum(interruption_count),0),
    count(*)
  into p_net, p_total, p_ints, p_logs_count
  from logs;

  p_ratio := case when p_total > 0 then round(p_net / p_total, 2) else 0 end;
  p_intfreq := case when p_logs_count > 0 then round(p_ints / p_logs_count, 2) else 0 end;
  p_commit := round(least(1, case when weekly_target_minutes > 0 then p_net / weekly_target_minutes else 0 end), 2);

  return jsonb_build_object(
    'range', jsonb_build_object('start', to_char(p_start, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'end', to_char(p_end, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
    'owner', jsonb_build_object(
      'netCommittedMinutes', o_net,
      'totalDurationMinutes', o_total,
      'honestyRatio', o_ratio,
      'interruptionFrequency', o_intfreq,
      'commitmentRate', o_commit
    ),
    'partner', jsonb_build_object(
      'netCommittedMinutes', case when (v_visibility->>'netCommittedMinutes')::boolean is true then p_net else null end,
      'totalDurationMinutes', case when (v_visibility->>'totalDurationMinutes')::boolean is true then p_total else null end,
      'honestyRatio', case when (v_visibility->>'honestyRatio')::boolean is true then p_ratio else null end,
      'interruptionFrequency', case when (v_visibility->>'interruptionFrequency')::boolean is true then p_intfreq else null end,
      'commitmentRate', p_commit
    )
  );
end;
$$;

-- 僅允許已登入者呼叫（RLS 仍作用在基表，但此函式為 SECURITY DEFINER）
revoke all on function public.get_partner_weekly(uuid, timestamptz, timestamptz) from public;
grant execute on function public.get_partner_weekly(uuid, timestamptz, timestamptz) to authenticated;
