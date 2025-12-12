-- Add time support to Todos for Google Calendar-style events
ALTER TABLE public."Todos" 
ADD COLUMN start_time TIMESTAMPTZ,
ADD COLUMN end_time TIMESTAMPTZ,
ADD COLUMN is_all_day BOOLEAN DEFAULT true;

-- Index for time-based queries
CREATE INDEX idx_todos_start_time ON public."Todos"(start_time);

-- Update existing todos to have proper timestamps based on due_date
-- (Set all existing todos as all-day by default)
UPDATE public."Todos" 
SET 
    start_time = due_date::TIMESTAMPTZ,
    end_time = due_date::TIMESTAMPTZ + INTERVAL '1 hour',
    is_all_day = true
WHERE start_time IS NULL;

COMMENT ON COLUMN public."Todos".start_time IS 'Start time for timed events (null for all-day tasks with is_all_day=true)';
COMMENT ON COLUMN public."Todos".end_time IS 'End time for timed events (null for all-day tasks)';
COMMENT ON COLUMN public."Todos".is_all_day IS 'Whether this is an all-day task (true) or a timed event (false)';
