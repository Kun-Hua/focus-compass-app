import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
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
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
    const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);

    const handleEmailLogin = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }

        if (!isForgotPassword && !password) {
            Alert.alert('Error', 'Please enter your password');
            return;
        }

        setLoading(true);

        try {
            if (isForgotPassword) {
                const { error } = await resetPassword(email);
                if (error) throw error;
                Alert.alert('Success', 'Password reset instructions sent to your email');
                setIsForgotPassword(false);
            } else if (isSignUp) {
                const { error } = await signUp(email, password);
                if (error) throw error;
                Alert.alert('Success', 'Account created! Please check your email to verify your account.');
                setIsSignUp(false);
            } else {
                const { error } = await signIn(email, password);
                if (error) throw error;
                router.replace('/(tabs)');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await signInWithGoogle();
        setLoading(false);

        if (error) {
            Alert.alert('Login Failed', error.message || 'Please try again');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <Text style={styles.logo}>🎯</Text>
                        <Text style={styles.title}>
                            {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Focus Compass'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {isForgotPassword
                                ? 'Enter your email to receive reset instructions'
                                : isSignUp
                                    ? 'Join us to achieve your goals'
                                    : 'Your productivity companion'}
                        </Text>
                    </View>

                    {/* Login Form */}
                    <View style={styles.formContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor={Colors.text.tertiary}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {!isForgotPassword && (
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor={Colors.text.tertiary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                            />
                        )}

                        <TouchableOpacity
                            style={[styles.button, styles.primaryButton]}
                            onPress={handleEmailLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={Colors.surface} />
                            ) : (
                                <Text style={styles.primaryButtonText}>
                                    {isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Sign Up' : 'Sign In'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {!isSignUp && !isForgotPassword && (
                            <TouchableOpacity
                                style={styles.forgotPasswordButton}
                                onPress={() => setIsForgotPassword(true)}
                            >
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        )}

                        {!isForgotPassword && (
                            <>
                                <View style={styles.divider}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>OR</Text>
                                    <View style={styles.dividerLine} />
                                </View>

                                <TouchableOpacity
                                    style={[styles.button, styles.googleButton]}
                                    onPress={handleGoogleLogin}
                                    disabled={loading}
                                >
                                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        {isForgotPassword ? (
                            <TouchableOpacity onPress={() => setIsForgotPassword(false)}>
                                <Text style={styles.link}>Back to Login</Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.footerText}>
                                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                                <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                                    <Text style={styles.link}>{isSignUp ? 'Sign In' : 'Sign Up'}</Text>
                                </TouchableOpacity>
                            </Text>
                        )}
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
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.xxl,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    logo: {
        fontSize: 64,
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: Typography.h1.fontSize,
        fontWeight: Typography.h1.fontWeight,
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.secondary,
    },
    formContainer: {
        marginBottom: Spacing.xl,
    },
    input: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        fontSize: Typography.body.fontSize,
        color: Colors.text.primary,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    button: {
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    primaryButton: {
        backgroundColor: Colors.primary,
        marginBottom: Spacing.lg,
        ...Shadows.medium,
    },
    primaryButtonText: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.surface,
    },
    googleButton: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    googleButtonText: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
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
        marginHorizontal: Spacing.md,
        fontSize: Typography.small.fontSize,
        color: Colors.text.tertiary,
    },
    footer: {
        alignItems: 'center',
        marginTop: Spacing.xl,
    },
    footerText: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.secondary,
    },
    link: {
        color: Colors.primary,
        fontWeight: '600',
    },
    forgotPasswordButton: {
        alignSelf: 'center',
        marginBottom: Spacing.lg,
    },
    forgotPasswordText: {
        color: Colors.text.secondary,
        fontSize: Typography.small.fontSize,
    },
});
