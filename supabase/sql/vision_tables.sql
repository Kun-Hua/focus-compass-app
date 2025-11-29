-- ===================================
-- Vision 頁面資料表
-- ===================================

-- 1. Goal 表格（如果不存在）
CREATE TABLE IF NOT EXISTS public."Goal" (
  goal_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_name TEXT NOT NULL,
  goal_description TEXT,
  goal_category TEXT CHECK (goal_category IN ('Core', 'Avoidance')) NOT NULL,
  linked_role TEXT,
  goal_tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goal_user_id ON public."Goal"(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_category ON public."Goal"(goal_category);

-- 2. 目標拆解計畫表
CREATE TABLE IF NOT EXISTS public.commitment_goal_plans_v3 (
  plan_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public."Goal"(goal_id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  annual_goal TEXT,
  quarterly_goal TEXT,
  monthly_goal TEXT,
  weekly_goal TEXT,
  weekly_commitment_hours DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(goal_id)
);

CREATE INDEX IF NOT EXISTS idx_goal_plans_user_id ON public.commitment_goal_plans_v3(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_plans_goal_id ON public.commitment_goal_plans_v3(goal_id);

-- 3. 啟用 RLS
ALTER TABLE public."Goal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitment_goal_plans_v3 ENABLE ROW LEVEL SECURITY;

-- 4. RLS 策略（開發階段 - 允許所有操作）
DROP POLICY IF EXISTS "Allow all operations for development" ON public."Goal";
CREATE POLICY "Allow all operations for development"
ON public."Goal"
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations for development" ON public.commitment_goal_plans_v3;
CREATE POLICY "Allow all operations for development"
ON public.commitment_goal_plans_v3
FOR ALL
USING (true)
WITH CHECK (true);

-- 5. 自動更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_goal_updated_at ON public."Goal";
CREATE TRIGGER update_goal_updated_at
BEFORE UPDATE ON public."Goal"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_goal_plans_updated_at ON public.commitment_goal_plans_v3;
CREATE TRIGGER update_goal_plans_updated_at
BEFORE UPDATE ON public.commitment_goal_plans_v3
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
