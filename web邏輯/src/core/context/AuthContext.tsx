import { supabase } from '@/core/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useContext, useEffect, useState } from 'react';

// Ensure WebBrowser handles redirects correctly
WebBrowser.maybeCompleteAuthSession();

type AuthContextType = {
    session: Session | null;
    user: User | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signUp: (email: string, password: string) => Promise<{ error: any }>;
    signInWithGoogle: () => Promise<{ error: any }>;
    signOut: () => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    isLoading: true,
    signIn: async () => ({ error: null }),
    signUp: async () => ({ error: null }),
    signInWithGoogle: async () => ({ error: null }),
    signOut: async () => ({ error: null }),
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);



    const signIn = async (email: string, password: string) => {
        console.log('[Auth] Signing in with:', email);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                console.error('[Auth] Sign in error:', error);
                return { error };
            }
            console.log('[Auth] Sign in success:', data.user?.id);
            return { error: null };
        } catch (err: any) {
            console.error('[Auth] Sign in exception:', err);
            return { error: err };
        }
    };

    const signUp = async (email: string, password: string) => {
        console.log('[Auth] Signing up with:', email);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) {
                console.error('[Auth] Sign up error:', error);
                return { error };
            }
            console.log('[Auth] Sign up success:', data.user?.id);
            return { error: null };
        } catch (err: any) {
            console.error('[Auth] Sign up exception:', err);
            return { error: err };
        }
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
    };

    const signInWithGoogle = async () => {
        try {
            const redirectUrl = Linking.createURL('/');
            console.log('[Auth] Google Redirect URL:', redirectUrl);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: true,
                },
            });

            if (error) throw error;

            if (data?.url) {
                console.log('[Auth] Opening WebBrowser with URL:', data.url);
                const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

                if (result.type === 'success' && result.url) {
                    console.log('[Auth] WebBrowser success, parsing URL...');
                    // Extract tokens from the URL (hash or query params)
                    const url = result.url;

                    // Helper to extract param
                    const getParam = (name: string) => {
                        const regex = new RegExp(`[?&#]${name}=([^&]+)`);
                        const match = url.match(regex);
                        return match ? decodeURIComponent(match[1]) : null;
                    };

                    const access_token = getParam('access_token');
                    const refresh_token = getParam('refresh_token');

                    if (access_token && refresh_token) {
                        console.log('[Auth] Tokens found, setting session...');
                        const { error: sessionError } = await supabase.auth.setSession({
                            access_token,
                            refresh_token,
                        });
                        if (sessionError) throw sessionError;
                        console.log('[Auth] Session set successfully!');
                    } else {
                        console.log('[Auth] No tokens found in URL:', url);
                        // Sometimes Supabase returns error in URL
                        const errorDesc = getParam('error_description');
                        if (errorDesc) throw new Error(errorDesc);
                    }
                } else {
                    console.log('[Auth] WebBrowser cancelled or failed:', result.type);
                }
            }
            return { error: null };
        } catch (err: any) {
            console.error('[Auth] Google Sign In exception:', err);
            return { error: err };
        }
    };

    const value = {
        session,
        user,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
