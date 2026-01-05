import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

console.log('[supabaseClient] Initializing...');
console.log('[supabaseClient] Config check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    platform: Platform.OS
});

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[supabaseClient] SUPABASE_URL / SUPABASE_ANON_KEY not configured. Please provide them in app.config.ts or .env');
}

const ExpoSecureStoreAdapter = {
    getItem: (key: string) => {
        if (Platform.OS === 'web') {
            if (typeof window === 'undefined') return Promise.resolve(null);
            return AsyncStorage.getItem(key);
        }
        return SecureStore.getItemAsync(key);
    },
    setItem: (key: string, value: string) => {
        if (Platform.OS === 'web') {
            if (typeof window === 'undefined') return Promise.resolve();
            return AsyncStorage.setItem(key, value);
        }
        return SecureStore.setItemAsync(key, value);
    },
    removeItem: (key: string) => {
        if (Platform.OS === 'web') {
            if (typeof window === 'undefined') return Promise.resolve();
            return AsyncStorage.removeItem(key);
        }
        return SecureStore.deleteItemAsync(key);
    },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: ExpoSecureStoreAdapter as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
    global: {
        fetch: (...args) => fetch(...args),
    },
});
