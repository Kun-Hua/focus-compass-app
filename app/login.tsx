import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { useAuth } from '@/core/context/AuthContext';
import Constants from 'expo-constants';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, signUp, signInWithGoogle } = useAuth();

    // Check config on mount
    React.useEffect(() => {
        // @ts-ignore
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || (Constants.expoConfig?.extra?.SUPABASE_URL);
        if (!supabaseUrl) {
            console.error('Supabase URL is missing!');
            Alert.alert('設定錯誤', '找不到 Supabase URL，請檢查環境變數。');
        }
    }, []);

    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert('錯誤', '請輸入 Email 和密碼');
            return;
        }
        setLoading(true);

        // Timeout to prevent infinite loading
        const timeout = setTimeout(() => {
            setLoading(false);
            Alert.alert('連線逾時', '登入請求沒有回應，請檢查網路連線。');
        }, 10000);

        try {
            const { error } = await signIn(email, password);
            clearTimeout(timeout);
            setLoading(false);
            if (error) {
                Alert.alert('登入失敗', error.message || '未知錯誤');
            }
        } catch (e) {
            clearTimeout(timeout);
            setLoading(false);
            Alert.alert('錯誤', '發生未預期的錯誤');
        }
    };

    const handleSignUp = async () => {
        if (!email || !password) {
            Alert.alert('錯誤', '請輸入 Email 和密碼');
            return;
        }
        setLoading(true);
        const { error } = await signUp(email, password);
        setLoading(false);
        if (error) {
            Alert.alert('註冊失敗', error.message);
        } else {
            Alert.alert('成功', '請檢查您的信箱以驗證帳號！');
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        const { error } = await signInWithGoogle();
        setLoading(false);
        if (error) {
            Alert.alert('Google 登入失敗', error.message);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Focus Compass</Text>
                        <Text style={styles.subtitle}>複利指南針 - 導航你的目標</Text>
                    </View>

                    <View style={styles.form}>
                        {/* Google 登入按鈕 */}
                        <TouchableOpacity
                            style={styles.googleButton}
                            onPress={handleGoogleSignIn}
                            disabled={loading}
                        >
                            <Text style={styles.googleIcon}>G</Text>
                            <Text style={styles.googleButtonText}>使用 Google 登入</Text>
                        </TouchableOpacity>

                        {/* 分隔線 */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>或</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Email/Password 表單 */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="hello@example.com"
                                placeholderTextColor={Colors.text.tertiary}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>密碼</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor={Colors.text.tertiary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, styles.signInButton]}
                            onPress={handleSignIn}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={Colors.surface} />
                            ) : (
                                <Text style={styles.signInButtonText}>登入</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.signUpButton]}
                            onPress={handleSignUp}
                            disabled={loading}
                        >
                            <Text style={styles.signUpButtonText}>建立帳號</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    title: {
        ...Typography.h1,
        color: Colors.primary,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        ...Typography.body,
        color: Colors.text.secondary,
    },
    form: {
        backgroundColor: Colors.surface,
        padding: Spacing.xl,
        borderRadius: BorderRadius.lg,
        ...Shadows.medium,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border.default,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    googleIcon: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.primary,
        marginRight: Spacing.sm,
    },
    googleButtonText: {
        ...Typography.body,
        color: Colors.text.primary,
        fontWeight: '600',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Spacing.lg,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.border.default,
    },
    dividerText: {
        ...Typography.caption,
        color: Colors.text.tertiary,
        marginHorizontal: Spacing.md,
    },
    inputContainer: {
        marginBottom: Spacing.lg,
    },
    label: {
        ...Typography.caption,
        color: Colors.text.secondary,
        marginBottom: Spacing.xs,
        fontWeight: '600',
    },
    input: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: Typography.body.fontSize,
        color: Colors.text.primary,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    button: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.sm,
    },
    signInButton: {
        backgroundColor: Colors.primary,
    },
    signInButtonText: {
        ...Typography.body,
        color: Colors.surface,
        fontWeight: '600',
    },
    signUpButton: {
        backgroundColor: 'transparent',
        marginTop: Spacing.xs,
    },
    signUpButtonText: {
        ...Typography.body,
        color: Colors.primary,
        fontWeight: '600',
    },
});
