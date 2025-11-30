// R1: 類型安全 - 這是 Focus Compass APP 的數據模型定義
// 確保 Cursor 在操作 Supabase 數據時，不會出現類型錯誤。

// Step 2 定義的 ENUM 類型：用於 R7 強制聚焦
export type GoalCategory = 'Core' | 'Avoidance';

// 1. Goal (目標) 實體 - 核心聚焦邏輯
export interface Goal {
  goal_id: string; // UUID
  user_id: string; // UUID (FK to User)
  goal_name: string;
  
  // R7 強制聚焦：確保只能是 Core 或 Avoidance
  goal_category: GoalCategory; 
  
  linked_role: string | null; // e.g., 'Parent', 'Creator'
  goal_tags: string[] | null; // Array of Text
  annual_target_hrs: number;
  created_at: string; // TIMESTAMPTZ
}

// 2.1 Subgoal (小目標) 實體 - 目標拆解
export interface Subgoal {
  subgoal_id: string; // UUID
  goal_id: string; // UUID (FK to Goal)
  name: string;
  order_index: number; // 用於排序
  created_at: string; // TIMESTAMPTZ
}

// 2. Focus_Session_Log (專注會話紀錄) 實體 - 數據誠實邏輯
export interface FocusSessionLog {
  session_id: string; // UUID
  goal_id: string; // UUID (FK to Goal)
  subgoal_id?: string | null; // UUID (FK to Subgoal)
  start_time: string; // TIMESTAMPTZ
  duration_minutes: number; 

  // R5 數據誠實：標記是否為高誠實度時長
  honesty_mode: boolean; 
  
  interruption_count: number;
  interruption_reason: string | null; // 用於程式化優化建議
  created_at: string;
}

// 3. User (使用者) 實體 - 錨定與問責
export interface User {
  user_id: string; // UUID
  mission_statement: string | null;
  roles: string[] | null;
  accountability_partner_id: string | null; // UUID (FK to self)
  created_at: string;
}

// 4. Weekly_Commitment (每週承諾) 實體 - 時間複利基礎
export interface WeeklyCommitment {
  commitment_id: string; // UUID
  goal_id: string; // UUID (FK to Goal)
  week_start_date: string; // DATE
  committed_hours: number;
  scheduled_hours: number;
}

// 5. Habit_Tracking (習慣追蹤) 實體 - 原子清單
export interface HabitTracking {
  habit_id: string; // UUID
  user_id: string; // UUID (FK to User)
  habit_name: string;
  current_streak: number; // 火焰圖標顯示基礎
}

// 6. AccountabilityPartner (問責夥伴) 實體 - 外部問責
export interface AccountabilityPartner {
  id: string; // UUID
  owner_user_id: string; // UUID (FK to User)
  partner_email: string | null;
  partner_user_id: string | null; // UUID (FK to User)
  role: 'mentor' | 'peer' | 'spouse' | 'other';
  visibility: {
    netCommittedMinutes?: boolean;
    honestyRatio?: boolean;
    interruptionFrequency?: boolean;
    totalDurationMinutes?: boolean;
    commitmentRate?: boolean;
  };
  status: 'pending' | 'active' | 'revoked';
  invite_token: string | null;
  created_at: string; // TIMESTAMPTZ
}

// 7. Calendar / Day Task types (front-end only structures)
export type DayTask = {
  id: string;
  text: string;
  done: boolean;
  goalId?: string | null;
};

export type CalendarStore = Record<string, DayTask[]>;

// 導出所有表格類型的總集合，方便 Cursor 引用
export type Database = {
  Goal: Goal;
  FocusSessionLog: FocusSessionLog;
  Subgoal: Subgoal;
  User: User;
  WeeklyCommitment: WeeklyCommitment;
  HabitTracking: HabitTracking;
  AccountabilityPartner: AccountabilityPartner;
};