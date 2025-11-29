drop view if exists public.focus_league_user_details;

create or replace view public.focus_league_user_details as
with week_window as (
  select (
      (timezone('Asia/Taipei', now()))::date
      - ((extract(dow from timezone('Asia/Taipei', now()))::int + 6) % 7)
    ) as week_start
),
weekly_totals as (
  select
    g.user_id,
    sum(f.duration_minutes) filter (where f.honesty_mode)::int as weekly_honest_minutes
  from public."FocusSessionLog" f
  join public."Goal" g on g.goal_id = f.goal_id
  join week_window w on true
  where (f.start_time at time zone 'Asia/Taipei')::date >= w.week_start
    and (f.start_time at time zone 'Asia/Taipei')::date < w.week_start + 7
  group by g.user_id
),
ranked as (
  select
    wt.user_id,
    coalesce(wt.weekly_honest_minutes, 0) as weekly_honest_minutes,
    dense_rank() over (order by coalesce(wt.weekly_honest_minutes, 0) desc nulls last) as rank_in_group
  from weekly_totals wt
  where coalesce(wt.weekly_honest_minutes, 0) > 0
)
select
  coalesce(
    nullif(trim(p.nickname), ''),
    ('匿名-' || upper(substring(md5(r.user_id::text || w.week_start::text) from 1 for 6)))
  ) as display_name,
  r.weekly_honest_minutes,
  r.rank_in_group
from ranked r
join week_window w on true
left join public.profiles p on p.user_id = r.user_id;

DO $$
DECLARE
  v_week_start date := (timezone('Asia/Taipei', now()))::date - ((extract(dow from timezone('Asia/Taipei', now()))::int + 6) % 7);
BEGIN
  WITH weekly AS (
    SELECT
      g.user_id,
      sum(f.duration_minutes) FILTER (WHERE f.honesty_mode) AS weekly_honest_minutes
    FROM public."FocusSessionLog" f
    JOIN public."Goal" g ON g.goal_id = f.goal_id
    WHERE (f.start_time AT TIME ZONE 'Asia/Taipei')::date >= v_week_start
    GROUP BY g.user_id
  ),
  ranked AS (
    SELECT
      user_id,
      coalesce(weekly_honest_minutes, 0) AS weekly_honest_minutes,
      dense_rank() OVER (ORDER BY coalesce(weekly_honest_minutes,0) DESC) AS rank_in_group
    FROM weekly
  )
  INSERT INTO public.focus_league_user_stats (user_id, week_start, weekly_honest_minutes, rank_in_group)
  SELECT user_id, v_week_start as week_start, weekly_honest_minutes, rank_in_group
  FROM ranked
  ON CONFLICT (user_id, week_start) DO UPDATE
    SET weekly_honest_minutes = EXCLUDED.weekly_honest_minutes,
        rank_in_group = EXCLUDED.rank_in_group,
        created_at = now();
END $$;

