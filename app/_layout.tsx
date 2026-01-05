import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { GoalsProvider } from '@/contexts/GoalsContext';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
    const { user, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(tabs)';
        const inLoginScreen = segments[0] === 'login';

        console.log('[RootLayout] Auth check:', {
            user: user?.id,
            isLoading,
            segments,
            inAuthGroup,
            inLoginScreen
        });

        if (!user && !inLoginScreen) {
            // Redirect to the login page if the user is not authenticated and not already on login
            console.log('[RootLayout] Redirecting to login');
            router.replace('/login');
        } else if (user && !inAuthGroup) {
            // Redirect to the tabs page if the user is authenticated and not in tabs
            console.log('[RootLayout] Redirecting to tabs');
            router.replace('/(tabs)');
        }
    }, [user, isLoading, segments]);


    // Return null while loading to prevent the authentication screen (or tabs) from flashing
    if (isLoading) {
        return null;
    }

    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
    );
}

function GoalsProviderWrapper({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const userId = React.useMemo(() => user?.id ?? null, [user?.id]);

    return <GoalsProvider userId={userId}>{children}</GoalsProvider>;
}

const MemoizedGoalsProviderWrapper = React.memo(GoalsProviderWrapper);

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const [loaded] = useFonts({});

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
            // Diagnostic network check
            console.log('[Diagnostic] Testing network connectivity...');
            fetch('https://google.com')
                .then(res => console.log('[Diagnostic] Google check success:', res.status))
                .catch(err => console.error('[Diagnostic] Google check failed:', err.message));

            const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
            if (supabaseUrl) {
                fetch(`${supabaseUrl}/auth/v1/health`)
                    .then(res => console.log('[Diagnostic] Supabase health check success:', res.status))
                    .catch(err => console.error('[Diagnostic] Supabase health check failed:', err.message));
            }
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
                <MemoizedGoalsProviderWrapper>
                    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                        <RootLayoutNav />
                        <StatusBar style="auto" />
                    </ThemeProvider>
                </MemoizedGoalsProviderWrapper>
            </AuthProvider>
        </GestureHandlerRootView>
    );
}
