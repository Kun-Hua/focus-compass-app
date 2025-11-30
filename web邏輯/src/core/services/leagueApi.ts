import Constants from 'expo-constants';

import { supabase } from '@/core/lib/supabaseClient';

export type LeagueMapping = {
  user_id: string;
  current_league_id: number;
  current_group_id: string | null;
  updated_at: string;
  hqc_status?: boolean;
  last_promotion_date?: string | null;
};

export type League = {
  league_id: number;
  league_name: string;
  league_name_en: string | null;
};

export type AnonymousBoardRow = {
  league_id: number;
  group_index: number;
  rank_in_group: number | null;
  masked_id: string;
  weekly_honest_minutes: number;
};

export type LeagueHistoryRow = {
  history_id: string;
  user_id: string;
  week_start: string;
  prev_league_id: number;
  new_league_id: number;
  group_id: string | null;
  rank_in_group: number | null;
  weekly_honest_minutes: number;
  movement: 'up' | 'down' | 'stay';
  created_at: string;
};

export type UserBadgeRow = {
  user_id: string;
  badge_id: string;
  granted_at: string;
  reason: any;
  badge?: { badge_id: string; badge_code: string; badge_name: string; badge_desc: string | null };
};

export function getWeekStartISO(date = new Date(), timeZone: string = 'Asia/Taipei') {
  const tzNow = new Date(date.toLocaleString('en-US', { timeZone }));
  const day = tzNow.getDay();
  const diffToMonday = (day + 6) % 7;
  tzNow.setDate(tzNow.getDate() - diffToMonday);
  tzNow.setHours(0, 0, 0, 0);
  return tzNow.toISOString().slice(0, 10);
}

export async function getMyLeagueMapping(): Promise<LeagueMapping | null> {
  const { data, error } = await supabase.from('league_user_mapping').select('*').maybeSingle();
  if (error) throw error;
  return data as LeagueMapping | null;
}

export async function getMyAnonymousBoard(weekStart?: string): Promise<AnonymousBoardRow[]> {
  const { data, error } = await (supabase.rpc as any)(
    'get_my_group_anonymous_board',
    weekStart ? { p_week_start: weekStart } : undefined,
  );
  if (error) throw error;
  return (data || []) as AnonymousBoardRow[];
}

export async function getMyLeagueHistory(limit = 50): Promise<LeagueHistoryRow[]> {
  const { data, error } = await supabase
    .from('league_history')
    .select('*')
    .order('week_start', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as LeagueHistoryRow[];
}

export async function getMyBadges(): Promise<UserBadgeRow[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select(
      'user_id,badge_id,granted_at,reason,badge:badge_id(badge_id,badge_code,badge_name,badge_desc)',
    )
    .order('granted_at', { ascending: false });
  if (error) throw error;
  return (data || []) as UserBadgeRow[];
}

export async function invokeFocusLeagueEdge(): Promise<{
  ok: boolean;
  week_start?: string;
  error?: string;
}> {
  console.log('[leagueApi] invokeFocusLeagueEdge: Triggered.');

  const extra = Constants.expoConfig?.extra ?? {};
  const anonKey = (extra.SUPABASE_ANON_KEY as string | undefined) ?? undefined;

  if (!anonKey) {
    console.error('[leagueApi] invokeFocusLeagueEdge: Supabase anon key is not configured.');
    return { ok: false, error: 'Supabase anon key is not configured.' };
  }

  console.log('[leagueApi] invokeFocusLeagueEdge: Anon key loaded.');

  const headers = {
    Authorization: `Bearer ${anonKey}`,
    apikey: anonKey,
  };

  console.log('[leagueApi] invokeFocusLeagueEdge: Invoking with headers:', {
    Authorization: `Bearer ${anonKey.substring(0, 8)}...`,
    apikey: `${anonKey.substring(0, 8)}...`,
  });

  const { data, error } = await supabase.functions.invoke('focus-league', { headers });

  if (error) {
    console.error('[leagueApi] invokeFocusLeagueEdge: Invocation failed.', error);
    return { ok: false, error: (error as any).message };
  }

  console.log('[leagueApi] invokeFocusLeagueEdge: Invocation successful. Data:', data);
  return (data as any) ?? { ok: true };
}

export async function getLeagues(): Promise<League[]> {
  const { data, error } = await supabase
    .from('leagues')
    .select('league_id,league_name,league_name_en')
    .order('league_id', { ascending: true });
  if (error) throw error;
  return (data || []) as League[];
}

export function getLeagueName(leagues: League[] | null | undefined, id: number): string {
  const m = (leagues || []).find((l) => l.league_id === id);
  return m ? m.league_name : `L${id}`;
}

export async function getMyMaskedId(weekStart?: string): Promise<string | undefined> {
  try {
    const { data, error } = await (supabase.rpc as any)(
      'get_my_masked_id',
      weekStart ? { p_week_start: weekStart } : undefined,
    );
    if (error) return undefined;
    if (!data) return undefined;
    if (typeof data === 'string') return data;
    if (Array.isArray(data) && data.length > 0 && typeof data[0]?.masked_id === 'string') {
      return data[0].masked_id;
    }
    if (typeof (data as any).masked_id === 'string') return (data as any).masked_id;
    return undefined;
  } catch {
    return undefined;
  }
}


