import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FocusScreen() {
    const router = useRouter();
    const [selectedTab, setSelectedTab] = useState<'stopwatch' | 'pomodoro' | 'timelapse'>('stopwatch');
    const [honestyMode, setHonestyMode] = useState(true);
    const [isRunning, setIsRunning] = useState(false);

    const mockGoal = 'Work';
    const mockSubgoal = 'Finish Q4 Report';
    const mockTime = '00:24:15';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Focus</Text>
                    </View>
                    <View style={styles.headerSpacer} />
                </View>

                {/* Goal Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Goal</Text>
                    <TouchableOpacity style={styles.dropdown}>
                        <Text style={styles.dropdownText}>{mockGoal}</Text>
                        <Text style={styles.dropdownIcon}>▼</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Subgoal / Task</Text>
                    <TouchableOpacity style={[styles.dropdown, styles.dropdownSecondary]}>
                        <Text style={styles.dropdownTextSecondary}>{mockSubgoal}</Text>
                        <Text style={styles.dropdownIcon}>▼</Text>
                    </TouchableOpacity>
                </View>

                {/* Honesty Mode Toggle */}
                <TouchableOpacity
                    style={styles.honestyModeContainer}
                    onPress={() => setHonestyMode(!honestyMode)}
                >
                    <Text style={styles.honestyModeIcon}>🛡️</Text>
                    <Text style={styles.honestyModeText}>
                        Honesty Mode: {honestyMode ? 'ON' : 'OFF'}
                    </Text>
                </TouchableOpacity>

                {/* Timer Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'stopwatch' && styles.activeTab]}
                        onPress={() => setSelectedTab('stopwatch')}
                    >
                        <Text style={[styles.tabText, selectedTab === 'stopwatch' && styles.activeTabText]}>
                            Stopwatch
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'pomodoro' && styles.activeTab]}
                        onPress={() => setSelectedTab('pomodoro')}
                    >
                        <Text style={[styles.tabText, selectedTab === 'pomodoro' && styles.activeTabText]}>
                            Pomodoro
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'timelapse' && styles.activeTab]}
                        onPress={() => setSelectedTab('timelapse')}
                    >
                        <Text style={[styles.tabText, selectedTab === 'timelapse' && styles.activeTabText]}>
                            Timelapse
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Timer Display */}
                <View style={styles.timerContainer}>
                    <Text style={styles.timerDisplay}>{mockTime}</Text>
                    <Text style={styles.timerLabel}>HH : MM : SS</Text>
                </View>

                {/* Control Buttons */}
                <View style={styles.controlsContainer}>
                    {/* Stop Button */}
                    <TouchableOpacity style={styles.stopButton}>
                        <View style={styles.stopIcon} />
                    </TouchableOpacity>

                    {/* Pause/Play Button */}
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => setIsRunning(!isRunning)}
                    >
                        <Text style={styles.primaryButtonIcon}>
                            {isRunning ? '❚❚' : '▶'}
                        </Text>
                    </TouchableOpacity>
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl,
        alignItems: 'center',
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.xxl,
        marginTop: Spacing.lg,
    },
    backButton: {
        padding: Spacing.sm,
        marginLeft: -Spacing.sm,
    },
    backIcon: {
        fontSize: 24,
        color: Colors.text.secondary,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: Typography.h2.fontSize,
        fontWeight: Typography.h2.fontWeight,
        color: Colors.text.primary,
    },
    headerSpacer: {
        width: 32,
    },
    section: {
        width: '100%',
        marginBottom: Spacing.md,
    },
    sectionLabel: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
        color: Colors.text.secondary,
        marginBottom: Spacing.sm,
    },
    dropdown: {
        width: '100%',
        height: 48,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        borderColor: Colors.border.default,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
    },
    dropdownSecondary: {
        backgroundColor: Colors.background,
        height: 40,
    },
    dropdownText: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    dropdownTextSecondary: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.primary,
    },
    dropdownIcon: {
        fontSize: 12,
        color: Colors.text.tertiary,
    },
    honestyModeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: `${Colors.primary}20`,
        marginTop: Spacing.lg,
        marginBottom: Spacing.xxl,
    },
    honestyModeIcon: {
        fontSize: 20,
        marginRight: Spacing.sm,
    },
    honestyModeText: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
        color: Colors.primary,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.border.default,
        borderRadius: BorderRadius.sm,
        padding: 4,
        width: '100%',
        marginBottom: Spacing.xxl,
    },
    tab: {
        flex: 1,
        paddingVertical: 6,
        alignItems: 'center',
        borderRadius: BorderRadius.sm - 2,
    },
    activeTab: {
        backgroundColor: Colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    activeTabText: {
        color: Colors.text.primary,
    },
    timerContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xxl * 2,
    },
    timerDisplay: {
        fontSize: 72,
        fontWeight: '600',
        color: Colors.text.primary,
        letterSpacing: -2,
        fontVariant: ['tabular-nums'],
    },
    timerLabel: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.tertiary,
        marginTop: Spacing.sm,
        fontVariant: ['tabular-nums'],
    },
    controlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xxl,
    },
    stopButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FEE2E2',
        borderWidth: 2,
        borderColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stopIcon: {
        width: 24,
        height: 24,
        backgroundColor: Colors.error,
        borderRadius: 4,
    },
    primaryButton: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: Colors.warning,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    primaryButtonIcon: {
        fontSize: 40,
        color: Colors.surface,
    },
});
