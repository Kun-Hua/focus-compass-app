-- ============================================================================
-- Focus Compass App - Full Database Reset & Setup
-- 警告：這將會刪除所有現有的應用程式資料並重新建立資料表
-- ============================================================================

-- 1. 清理舊資料 (Drop Tables)
DROP TABLE IF EXISTS public.partners CASCADE;
DROP TABLE IF EXISTS public.focus_league_user_stats CASCADE;
DROP TABLE IF EXISTS public.league_user_mapping CASCADE;
DROP TABLE IF EXISTS public.leagues CASCADE;
DROP TABLE IF EXISTS public."UserStats" CASCADE;
DROP TABLE IF EXISTS public."FocusSessionLog" CASCADE;
DROP TABLE IF EXISTS public.commitment_goal_plans_v3 CASCADE;
DROP TABLE IF EXISTS public."Goal" CASCADE;

-- 2. 啟用必要的 Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Phase 1: Vision 頁面 (目標設定)
-- ============================================================================

-- 1.1 Goal 表格
CREATE TABLE public."Goal" (
  goal_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_name TEXT NOT NULL,
  goal_description TEXT,
  goal_category TEXT CHECK (goal_category IN ('Core', 'Avoidance')) NOT NULL,
  linked_role TEXT,
  goal_tags TEXT[],
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goal_user_id ON public."Goal"(user_id);
CREATE INDEX idx_goal_category ON public."Goal"(goal_category);

-- 1.2 目標拆解計畫表
CREATE TABLE public.commitment_goal_plans_v3 (
  plan_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public."Goal"(goal_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  annual_goal TEXT,
  quarterly_goal TEXT,
  monthly_goal TEXT,
  weekly_goal TEXT,
  weekly_commitment_hours DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(goal_id)
);

CREATE INDEX idx_goal_plans_user_id ON public.commitment_goal_plans_v3(user_id);

-- ============================================================================
-- Phase 2: Focus 頁面 (專注紀錄)
-- ============================================================================

-- 2.1 專注紀錄表
CREATE TABLE public."FocusSessionLog" (
  session_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public."Goal"(goal_id) ON DELETE SET NULL,
  
  start_time TIMESTAMPTZ DEFAULT NOW(),
  duration_minutes INTEGER NOT NULL,
  mode TEXT CHECK (mode IN ('Pomodoro', 'Stopwatch', 'Timelapse')),
  
  honesty_mode BOOLEAN NOT NULL DEFAULT false,
  interruption_count INTEGER DEFAULT 0,
  interruption_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_log_user_id ON public."FocusSessionLog"(user_id);
CREATE INDEX idx_log_goal_id ON public."FocusSessionLog"(goal_id);
CREATE INDEX idx_log_created_at ON public."FocusSessionLog"(created_at);

-- ============================================================================
-- Phase 3: Dashboard 頁面 (使用者統計)
-- ============================================================================

-- 3.1 使用者統計表
CREATE TABLE public."UserStats" (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  current_streak INTEGER DEFAULT 0 NOT NULL,
  last_streak_date DATE,
  last_weekly_streak_check DATE,
  
  total_focus_minutes INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Phase 4: League 頁面 (聯賽系統)
-- ============================================================================

-- 4.1 聯賽定義表
CREATE TABLE public.leagues (
    league_id SERIAL PRIMARY KEY,
    league_name TEXT NOT NULL,
    league_name_en TEXT
);

-- 插入預設聯賽
INSERT INTO public.leagues (league_id, league_name, league_name_en) VALUES
(1, '新手聯盟', 'Rookie League'),
(2, '進階聯盟', 'Advanced League'),
(3, '專業聯盟', 'Pro League'),
(4, '精英聯盟', 'Elite League'),
(5, '大師聯盟', 'Master League'),
(6, '傳奇聯盟', 'Legend League'),
(7, '榮譽殿堂', 'Hall of Fame');

-- 4.2 使用者聯賽對應表
CREATE TABLE public.league_user_mapping (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_league_id INTEGER NOT NULL DEFAULT 1 REFERENCES public.leagues(league_id),
    current_group_id UUID,
    
    hqc_status BOOLEAN DEFAULT false,
    last_promotion_date DATE,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.3 聯賽每週統計
CREATE TABLE public.focus_league_user_stats (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    
    weekly_honest_minutes INTEGER DEFAULT 0 NOT NULL,
    rank_in_group INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, week_start)
);

-- ============================================================================
-- Phase 5: Partner 頁面 (夥伴系統)
-- ============================================================================

-- 5.1 夥伴關係表
CREATE TABLE public.partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  status TEXT CHECK (status IN ('pending', 'active', 'blocked')) DEFAULT 'pending',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id_1, user_id_2)
);

CREATE INDEX idx_partners_user_1 ON public.partners(user_id_1);
CREATE INDEX idx_partners_user_2 ON public.partners(user_id_2);

-- ============================================================================
-- 安全性設定 (RLS) - 開發模式 (允許所有操作)
-- ============================================================================

-- 啟用 RLS
ALTER TABLE public."Goal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitment_goal_plans_v3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."FocusSessionLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserStats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_user_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_league_user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- 建立通用寬鬆策略 (開發用) - 顯式建立以避免動態 SQL 錯誤
CREATE POLICY "Allow all for dev" ON public."Goal" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for dev" ON public.commitment_goal_plans_v3 FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for dev" ON public."FocusSessionLog" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for dev" ON public."UserStats" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for dev" ON public.leagues FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for dev" ON public.league_user_mapping FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for dev" ON public.focus_league_user_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for dev" ON public.partners FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 觸發器與函數
-- ============================================================================

-- 自動更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 顯式建立 Trigger 以避免動態 SQL 錯誤
CREATE TRIGGER update_Goal_updated_at BEFORE UPDATE ON public."Goal" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commitment_goal_plans_v3_updated_at BEFORE UPDATE ON public.commitment_goal_plans_v3 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_UserStats_updated_at BEFORE UPDATE ON public."UserStats" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_league_user_mapping_updated_at BEFORE UPDATE ON public.league_user_mapping FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 自動建立 UserStats (當新使用者註冊時)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."UserStats" (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.league_user_mapping (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 綁定到 Auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
