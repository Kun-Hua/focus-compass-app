-- Run this in your Supabase Dashboard SQL Editor to fix the "Fail to save new order" error

-- 1. Add the missing display_order column
ALTER TABLE public."Goal" ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 2. Initialize the order for existing goals based on creation time
WITH ordered_goals AS (
  SELECT goal_id, ROW_NUMBER() OVER (PARTITION BY user_id, goal_category ORDER BY created_at) as rn
  FROM public."Goal"
)
UPDATE public."Goal" g
SET display_order = og.rn
FROM ordered_goals og
WHERE g.goal_id = og.goal_id;
