-- Second stage: weekly regrouping (8–16 per group) and promotion/demotion
-- Assumes tables exist: public.league_user_mapping, public.leagues, public.focus_league_user_stats, public.league_history (optional)

create or replace function public.recompute_focus_league()
returns void
language plpgsql
security definer
as $$
declare
  v_week_start date := (timezone('Asia/Taipei', now()))::date - ((extract(dow from timezone('Asia/Taipei', now()))::int + 6) % 7);
  v_min_league int := (select min(league_id) from public.leagues);
  v_max_league int := (select max(league_id) from public.leagues);
begin
  -- 0) Ensure every active user this week has a mapping row (default to L1)
  -- Active user = has any FocusSessionLog since v_week_start via Goal ownership
  with active_users as (
    select distinct g.user_id
    from public."Goal" g
    join public."FocusSessionLog" f on f.goal_id = g.goal_id
    where (f.start_time at time zone 'Asia/Taipei')::date >= v_week_start
  )
  insert into public.league_user_mapping (user_id, current_league_id)
  select au.user_id, coalesce((select min(league_id) from public.leagues), 1)
  from active_users au
  left join public.league_user_mapping m on m.user_id = au.user_id
  where m.user_id is null;

  -- 1) Compute movements into a temporary table to reuse across statements
  -- 1.a) Auto promote to L10 (Vision Awakened) when cumulative honest minutes >= 30000 (500 hours)
  drop table if exists tmp_auto_l10;
  create temporary table tmp_auto_l10 on commit drop as
  select m.user_id
  from public.league_user_mapping m
  left join public."Goal" g on g.user_id = m.user_id
  left join public."FocusSessionLog" f on f.goal_id = g.goal_id and f.honesty_mode
  group by m.user_id
  having coalesce(sum(f.duration_minutes), 0) >= 30000;

  -- Apply auto L10 promotions (do nothing if already L10)
  update public.league_user_mapping m
  set current_league_id = v_max_league,
      last_promotion_date = v_week_start,
      updated_at = now()
  from tmp_auto_l10 a
  where a.user_id = m.user_id
    and m.current_league_id <> v_max_league;

  -- 1.b) Now compute competitive movements for users below L10 and not auto-promoted in this run
  drop table if exists tmp_movements;
  create temporary table tmp_movements on commit drop as
  with weekly as (
    select
      m.user_id,
      m.current_league_id as league_id,
      coalesce(sum(f.duration_minutes) filter (where f.honesty_mode), 0) as weekly_honest_minutes
    from public.league_user_mapping m
    left join public."Goal" g on g.user_id = m.user_id
    left join public."FocusSessionLog" f on f.goal_id = g.goal_id
      and (f.start_time at time zone 'Asia/Taipei')::date >= v_week_start
    where m.current_league_id < v_max_league
      and not exists (select 1 from tmp_auto_l10 a where a.user_id = m.user_id)
    group by m.user_id, m.current_league_id
  ),
  league_counts as (
    select league_id, count(*)::int as cnt from weekly group by league_id
  ),
  with_groups as (
    select w.*, lc.cnt,
           greatest(1, round(lc.cnt / 8.0))::int as groups
    from weekly w
    join league_counts lc using (league_id)
  ),
  ranked as (
    select *,
           row_number() over (partition by league_id order by weekly_honest_minutes desc nulls last) as rn,
           ntile(groups) over (partition by league_id order by weekly_honest_minutes desc nulls last) as group_index
    from with_groups
  ),
  group_rank as (
    select *,
           row_number() over (partition by league_id, group_index order by weekly_honest_minutes desc nulls last) as rank_in_group,
           count(*)     over (partition by league_id, group_index) as group_size
    from ranked
  )
  select
    user_id,
    league_id,
    group_index,
    rank_in_group,
    group_size,
    weekly_honest_minutes,
    case
      when group_size >= 8 then
        case when rank_in_group <= 4 then 'up'
             when rank_in_group > group_size - 4 then 'down'
             else 'stay' end
      else
        case
          when rank_in_group <= ceil(group_size/2.0) then 'up'
          when rank_in_group > floor(group_size/2.0) then 'down'
          else 'stay'
        end
    end as movement
  from group_rank;

  -- 2) Upsert stats for this week (rank_in_group is per-group rank)
  insert into public.focus_league_user_stats (user_id, week_start, weekly_honest_minutes, rank_in_group)
  select user_id, v_week_start, weekly_honest_minutes, rank_in_group
  from tmp_movements
  on conflict (user_id, week_start) do update
    set weekly_honest_minutes = excluded.weekly_honest_minutes,
        rank_in_group = excluded.rank_in_group,
        created_at = now();

  -- 3) Apply promotions/demotions with bounds
  update public.league_user_mapping m
  set current_league_id = case
      when mv.movement = 'up' then least(m.current_league_id + 1, v_max_league)
      when mv.movement = 'down' then greatest(m.current_league_id - 1, v_min_league)
      else m.current_league_id
    end,
    last_promotion_date = case when mv.movement = 'up' then v_week_start else m.last_promotion_date end,
    updated_at = now()
  from tmp_movements mv
  where mv.user_id = m.user_id
    and mv.movement <> 'stay'
    and m.current_league_id < v_max_league; -- never demote/promote L10 here

  -- 4) Write history (best-effort; skip if table/columns absent)
  begin
    insert into public.league_history (
      user_id, week_start, prev_league_id, new_league_id, group_id, rank_in_group, weekly_honest_minutes, movement, created_at
    )
    select m.user_id,
           v_week_start,
           m.current_league_id as prev_league_id,
           case when mv.movement = 'up' then least(m.current_league_id + 1, v_max_league)
                when mv.movement = 'down' then greatest(m.current_league_id - 1, v_min_league)
                else m.current_league_id end as new_league_id,
           null::uuid as group_id, -- optional placeholder; adapt if you have a real group id
           mv.rank_in_group,
           mv.weekly_honest_minutes,
           mv.movement::text,
           now()
    from public.league_user_mapping m
    join tmp_movements mv on mv.user_id = m.user_id
    where mv.movement <> 'stay';
  exception when undefined_table or undefined_column then
    -- ignore if league_history is not present yet
    null;
  end;
end$$;
