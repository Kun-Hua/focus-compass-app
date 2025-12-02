// Focus Compass App 核心資料模型（移植自 Web 專案）
export type GoalCategory = 'Core' | 'Avoidance';

export interface Goal {
  goal_id: string;
  user_id: string;
  goal_name: string;
  description?: string | null;
  goal_category: GoalCategory;
  linked_role: string | null;
  goal_tags: string[] | null;
  annual_target_hrs: number;
  created_at: string;
}

export interface Subgoal {
  subgoal_id: string;
  goal_id: string;
  name: string;
  order_index: number;
  created_at: string;
}

export interface FocusSessionLog {
  session_id: string;
  goal_id: string;
  subgoal_id?: string | null;
  start_time: string;
  duration_minutes: number;
  honesty_mode: boolean;
  interruption_count: number;
  interruption_reason: string | null;
  created_at: string;
}

export interface User {
  user_id: string;
  mission_statement: string | null;
  roles: string[] | null;
  accountability_partner_id: string | null;
  created_at: string;
}

export interface WeeklyCommitment {
  commitment_id: string;
  goal_id: string;
  week_start_date: string;
  committed_hours: number;
  scheduled_hours: number;
}

export interface HabitTracking {
  habit_id: string;
  user_id: string;
  habit_name: string;
  current_streak: number;
}

export interface AccountabilityPartner {
  id: string;
  owner_user_id: string;
  partner_email: string | null;
  partner_user_id: string | null;
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
  created_at: string;
}

export type DayTask = {
  id: string;
  text: string;
  done: boolean;
  goalId?: string | null;
};

export type CalendarStore = Record<string, DayTask[]>;

export type Database = {
  Goal: Goal;
  FocusSessionLog: FocusSessionLog;
  Subgoal: Subgoal;
  User: User;
  WeeklyCommitment: WeeklyCommitment;
  HabitTracking: HabitTracking;
  AccountabilityPartner: AccountabilityPartner;
};
