import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { useAuth } from '@/contexts/AuthContext';
import { leagueApi } from '@/services/leagueApi';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LeagueDebugScreen() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const run = async () => {
        if (!user) {
            setError('User not logged in');
            return;
        }

        setLoading(true);
        setError(null);
        setResult('');

        try {
            const mapping = await leagueApi.getMyLeagueMapping(user.id);
            setResult(JSON.stringify(mapping, null, 2));
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>League Debug</Text>

                <View style={styles.card}>
                    <Text style={styles.description}>
                        Test getMyLeagueMapping() function.
                    </Text>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={run}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={Colors.surface} />
                        ) : (
                            <Text style={styles.buttonText}>Run Test</Text>
                        )}
                    </TouchableOpacity>

                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorTitle}>Error:</Text>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {result ? (
                        <View style={styles.resultContainer}>
                            <Text style={styles.resultTitle}>Result:</Text>
                            <Text style={styles.resultText}>{result}</Text>
                        </View>
                    ) : null}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: Spacing.xl,
    },
    title: {
        fontSize: Typography.h1.fontSize,
        fontWeight: Typography.h1.fontWeight,
        color: Colors.text.primary,
        marginBottom: Spacing.xl,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    description: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.secondary,
        marginBottom: Spacing.lg,
    },
    button: {
        backgroundColor: Colors.primary,
        padding: Spacing.md,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: Colors.surface,
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
    },
    errorContainer: {
        marginTop: Spacing.lg,
        padding: Spacing.md,
        backgroundColor: Colors.error + '20',
        borderRadius: 8,
    },
    errorTitle: {
        color: Colors.error,
        fontWeight: '700',
        marginBottom: 4,
    },
    errorText: {
        color: Colors.error,
    },
    resultContainer: {
        marginTop: Spacing.lg,
        padding: Spacing.md,
        backgroundColor: Colors.background,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    resultTitle: {
        color: Colors.text.primary,
        fontWeight: '700',
        marginBottom: 8,
    },
    resultText: {
        color: Colors.text.secondary,
        fontFamily: 'monospace',
        fontSize: 12,
    },
});
