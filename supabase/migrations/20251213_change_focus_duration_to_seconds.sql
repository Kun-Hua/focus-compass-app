-- Add duration_seconds column to FocusSessionLog
ALTER TABLE "FocusSessionLog" 
ADD COLUMN IF NOT EXISTS "duration_seconds" INTEGER;

-- Backfill existing data (convert minutes to seconds)
UPDATE "FocusSessionLog"
SET "duration_seconds" = "duration_minutes" * 60
WHERE "duration_seconds" IS NULL;

-- Make duration_seconds NOT NULL after backfilling
ALTER TABLE "FocusSessionLog"
ALTER COLUMN "duration_seconds" SET NOT NULL;

-- Optional: Create an index on duration_seconds if analytics queries will filter by it often
-- CREATE INDEX idx_focus_session_seconds ON "FocusSessionLog" ("duration_seconds");
