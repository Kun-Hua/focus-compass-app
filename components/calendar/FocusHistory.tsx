import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { FocusSessionLog } from '@/services/focusApi';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

interface FocusHistoryProps {
    sessions: FocusSessionLog[];
}

export default function FocusHistory({ sessions }: FocusHistoryProps) {
    if (sessions.length === 0) {
        return null; // Don't show anything if empty
    }

    // Calculate total
    const totalMinutes = sessions.reduce((acc, curr) => acc + curr.duration_minutes, 0);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Completed Focus</Text>
                <View style={styles.totalBadge}>
                    <Ionicons name="time-outline" size={14} color={Colors.primary} />
                    <Text style={styles.totalText}>{totalMinutes}m</Text>
                </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
                {sessions.map((session) => (
                    <View key={session.session_id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.modeText}>{session.mode || 'Focus'}</Text>
                            <Text style={styles.timeText}>
                                {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>

                        <Text style={styles.durationText}>{session.duration_minutes}m</Text>

                        {/* If we had goal name join, we'd show it here. For now just generic. */}
                        {session.honesty_mode && (
                            <View style={styles.honestBadge}>
                                <Text style={styles.honestText}>Honest</Text>
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: Spacing.lg,
        paddingHorizontal: Spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    totalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        gap: 4,
    },
    totalText: {
        fontSize: Typography.small.fontSize,
        color: Colors.primary,
        fontWeight: '600',
    },
    list: {
        gap: Spacing.md,
        paddingRight: Spacing.xl,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        minWidth: 120,
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary,
        // Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.xs,
    },
    modeText: {
        fontSize: 10,
        color: Colors.text.tertiary,
        textTransform: 'uppercase',
    },
    timeText: {
        fontSize: 10,
        color: Colors.text.tertiary,
    },
    durationText: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    honestBadge: {
        marginTop: Spacing.xs,
        backgroundColor: '#E6F4FE',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
        alignSelf: 'flex-start',
    },
    honestText: {
        fontSize: 10,
        color: Colors.primary,
        fontWeight: '600',
    },
});
