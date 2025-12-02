-- Add display_order column to Goal table
ALTER TABLE public."Goal" ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Update existing goals to have a default order (optional, but good practice)
-- This simple update just gives them an arbitrary order based on creation time
WITH ordered_goals AS (
  SELECT goal_id, ROW_NUMBER() OVER (PARTITION BY user_id, goal_category ORDER BY created_at) as rn
  FROM public."Goal"
)
UPDATE public."Goal" g
SET display_order = og.rn
FROM ordered_goals og
WHERE g.goal_id = og.goal_id;
