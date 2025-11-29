# Supabase 環境設定說明

## 步驟 1: 建立 Supabase 專案
1. 前往 [Supabase](https://supabase.com) 並登入
2. 建立新專案
3. 記下專案的 URL 和 API Key

## 步驟 2: 建立環境變數檔案
在專案根目錄建立 `.env.local` 檔案：

```bash
# Supabase 環境變數設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 步驟 3: 設定資料庫
在 Supabase Dashboard 的 SQL Editor 中執行以下 SQL：

```sql
-- 建立 Goal 表格 (已修正語法)
CREATE TABLE "Goal" (
  goal_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_name TEXT NOT NULL,
  goal_category TEXT CHECK (goal_category IN ('Core', 'Avoidance')) NOT NULL,
  linked_role TEXT,
  goal_tags TEXT[],
  -- 移除：目標設定中的年度目標時數，改由其他方式計算
  annual_target_hrs INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
CREATE INDEX idx_goal_user_id ON "Goal"(user_id);
CREATE INDEX idx_goal_category ON "Goal"(goal_category);

-- 建立 FocusSessionLog 表格
CREATE TABLE "FocusSessionLog" (
  session_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES "Goal"(goal_id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  duration_minutes INTEGER NOT NULL,
  honesty_mode BOOLEAN NOT NULL DEFAULT false,
  interruption_count INTEGER DEFAULT 0,
  interruption_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 為 FocusSessionLog 表格建立索引以優化查詢
CREATE INDEX idx_log_goal_id ON "FocusSessionLog"(goal_id);
CREATE INDEX idx_log_created_at ON "FocusSessionLog"(created_at);

-- 建立一個新的表格 "UserStats" 來儲存使用者的全域統計資料
CREATE TABLE IF NOT EXISTS public."UserStats" (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0 NOT NULL,
  last_streak_date DATE,
  -- 新增：用於週連勝檢查
  last_weekly_streak_check DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 為 UserStats 表格啟用 RLS
ALTER TABLE public."UserStats" ENABLE ROW LEVEL SECURITY;

-- 允許使用者讀取自己的統計資料
CREATE POLICY "Allow individual user read access to their own stats"
  ON public."UserStats"
  FOR SELECT
  USING (auth.uid() = user_id);

-- 允許使用者建立/更新自己的統計資料
CREATE POLICY "Allow individual user to upsert their own stats"
  ON public."UserStats"
  FOR ALL
  USING (auth.uid() = user_id);

-- 刪除舊的、目標導向的 RPC 函式
DROP FUNCTION IF EXISTS public.update_streak(target_goal_id UUID);
-- 刪除舊的、使用者導向的每日連勝 RPC 函式
DROP FUNCTION IF EXISTS public.update_user_streak(duration_focused INT); -- 舊的每日連勝
DROP FUNCTION IF EXISTS public.update_weekly_commitment_streak(); -- 舊的每週連勝

-- 建立一個新的、用於更新「週承諾連勝」的 RPC 函式
-- 這個函式由客戶端呼叫，並傳入上週所有目標是否達成的最終結果
CREATE OR REPLACE FUNCTION update_weekly_streak_status(last_week_all_goals_met BOOLEAN)
RETURNS VOID AS $$
DECLARE
  current_user_id UUID := auth.uid();
  stats RECORD;
  today_taipei DATE;
  last_check_week_start DATE;
  current_week_start DATE;
BEGIN
  -- 設定時區並獲取今天日期
  today_taipei := (now() AT TIME ZONE 'Asia/Taipei')::DATE;
  -- 計算本週的開始日期 (週一為第一天)
  current_week_start := date_trunc('week', today_taipei)::DATE;

  -- 確保使用者統計紀錄存在
  INSERT INTO public."UserStats" (user_id)
  VALUES (current_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- 獲取使用者最新的統計資料
  SELECT * INTO stats FROM public."UserStats" WHERE user_id = current_user_id;

  -- 計算上次檢查的週開始日期
  IF stats.last_weekly_streak_check IS NOT NULL THEN
    last_check_week_start := date_trunc('week', stats.last_weekly_streak_check)::DATE;
  END IF;

  -- 如果本週已經檢查過，則直接返回，避免重複計算
  IF current_week_start = last_check_week_start THEN
    RETURN;
  END IF;

  -- 根據客戶端傳入的結果更新連勝紀錄
  IF last_week_all_goals_met THEN
    -- 檢查上週是否是連續的一週
    IF stats.last_streak_date = current_week_start - INTERVAL '1 week' THEN
      stats.current_streak := stats.current_streak + 1;
    ELSE
      stats.current_streak := 1;
    END IF;
    stats.last_streak_date := current_week_start; -- 記錄達標的週
  ELSE
    -- 如果上週不是達標週的下一週，則中斷連勝
    IF stats.last_streak_date <> current_week_start - INTERVAL '1 week' THEN
       stats.current_streak := 0;
    END IF;
  END IF;

  -- 更新使用者的統計資料
  UPDATE public."UserStats"
  SET
    current_streak = stats.current_streak,
    last_streak_date = stats.last_streak_date,
    last_weekly_streak_check = today_taipei, -- 更新檢查日期
    updated_at = NOW()
  WHERE user_id = current_user_id;
END;
$$ LANGUAGE plpgsql;

-- Focus League 相關表格
-- 建立聯賽定義表
CREATE TABLE public.leagues (
    league_id SERIAL PRIMARY KEY,
    league_name TEXT NOT NULL,
    league_name_en TEXT
);

-- 插入預設的聯賽等級
INSERT INTO public.leagues (league_id, league_name, league_name_en) VALUES
(1, '新手聯盟', 'Rookie League'),
(2, '進階聯盟', 'Advanced League'),
(3, '專業聯盟', 'Pro League'),
(4, '精英聯盟', 'Elite League'),
(5, '大師聯盟', 'Master League'),
(6, '傳奇聯盟', 'Legend League'),
(7, '榮譽殿堂', 'Hall of Fame');

-- 建立使用者與聯賽的對應表
CREATE TABLE public.league_user_mapping (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_league_id INTEGER NOT NULL DEFAULT 1 REFERENCES public.leagues(league_id),
    current_group_id UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    hqc_status BOOLEAN DEFAULT false,
    last_promotion_date DATE
);

-- 建立儲存每週使用者聯賽統計的表格
CREATE TABLE public.focus_league_user_stats (
    user_id UUID NOT NULL,
    week_start DATE NOT NULL,
    weekly_honest_minutes INTEGER DEFAULT 0 NOT NULL,
    rank_in_group INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, week_start)
);

-- 為新表格啟用 RLS
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_user_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_league_user_stats ENABLE ROW LEVEL SECURITY;

## 步ql
-- 步驟 4: 啟用資料列層級安全性 (RLS)
-- 這是確保您定義的 POLICY 生效的關鍵
ALTER TAB
-- 步驟 5: 建立開發階段的 RLS (Row Level Security) 策略
-- 警告：以下為開發專用設定，允許任何使用者操作資料。;

-- 允許所有使用者新增目標
CREATE POLICY "Allow all inserts for development"
ON public."Goal"
FOR INSERT
WITH CHECK (true);

-- 允許所有使用者更新目標
CREATE POLICY "Allow all updates for development"
ON public."Goal"
FOR UPDATE
USING (true)
WITH CHECK (true);

-- 允許所有使用者刪除目標
CREATE POLICY "Allow all deletes for development"
ON public."Goal"
FOR DELETE
USING (true);

-- 允許所有使用者讀取所有專注紀錄
CREATE POLICY "Allow all read access for dev (FocusSessionLog)"
ON public."FocusSessionLog"
FOR SELECT
USING (true);

-- 允許所有使用者新增專注紀錄
CREATE POLICY "Allow all inserts for dev (FocusSessionLog)"
ON public."FocusSessionLog"
FOR INSERT
WITH CHECK (true);

-- 允許所有使用者更新專注紀錄
CREATE POLICY "Allow all updates for dev (FocusSessionLog)"
ON public."FocusSessionLog"
FOR UPDATE
USING (true)
WITH CHECK (true);

-- 允許所有使用者刪除專注紀錄
CREATE POLICY "Allow all deletes for dev (FocusSessionLog)"
ON public."FocusSessionLog"
FOR DELETE
USING (true);
```

## 步驟 4: 安裝依賴
```bash
npm install
```

## 步驟 5: 啟動開發伺服器
```bash
npm run dev
```
