import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

import type { Database } from '@/core/types/database';

const extra = Constants.expoConfig?.extra ?? {};
const supabaseUrl = extra.SUPABASE_URL as string | undefined;
const supabaseAnonKey = extra.SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[supabaseClient] SUPABASE_URL / SUPABASE_ANON_KEY 未設定，請在 app.config.ts 或 .env 中提供。');
}

const isBrowser = typeof window !== 'undefined';

export const supabase = createClient<Database>(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    // 在 Web SSR（沒有 window）環境中避免使用 AsyncStorage，否則會觸發 window is not defined
    storage: isBrowser ? (AsyncStorage as unknown as Storage) : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'x-client-info': 'focus-compass-app',
    },
  },
});
