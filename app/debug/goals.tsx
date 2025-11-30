import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { useAuth } from '@/contexts/AuthContext';
import { focusApi } from '@/services/focusApi';
import { goalPlansApi } from '@/services/goalPlansApi';
import { goalsApi } from '@/services/goalsApi';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DebugGoalsScreen() {
    const { user } = useAuth();
    const [goalName, setGoalName] = useState('');
    const [goalDescription, setGoalDescription] = useState('');
    const [isCore, setIsCore] = useState(true);
    const [status, setStatus] = useState('');

    // Goal Plan fields
    const [selectedGoalId, setSelectedGoalId] = useState('');
    const [annualGoal, setAnnualGoal] = useState('');
    const [quarterlyGoal, setQuarterlyGoal] = useState('');
    const [monthlyGoal, setMonthlyGoal] = useState('');
    const [weeklyGoal, setWeeklyGoal] = useState('');
    const [weeklyHours, setWeeklyHours] = useState('');
    const [planStatus, setPlanStatus] = useState('');

    // Focus Session fields
    const [sessionGoalId, setSessionGoalId] = useState('');
    const [sessionMinutes, setSessionMinutes] = useState('');
    const [sessionMode, setSessionMode] = useState<'Pomodoro' | 'Stopwatch' | 'Timelapse'>('Pomodoro');
    const [sessionStatus, setSessionStatus] = useState('');

    const handleCreateGoal = async () => {
        if (!user || !goalName) {
            setStatus('Please enter goal name');
            return;
        }

        try {
            setStatus('Creating goal...');
            await goalsApi.create({
                user_id: user.id,
                goal_name: goalName,
                description: goalDescription || undefined,
                is_core: isCore,
            });
            setStatus('Goal created successfully!');
            setGoalName('');
            setGoalDescription('');
        } catch (error: any) {
            setStatus(`Error: ${error.message}`);
        }
    };

    const handleCreatePlan = async () => {
        if (!user || !selectedGoalId) {
            setPlanStatus('Please enter goal ID');
            return;
        }

        try {
            setPlanStatus('Creating plan...');
            const hours = parseFloat(weeklyHours);
            await goalPlansApi.upsert({
                user_id: user.id,
                goal_id: selectedGoalId,
                annual_goal: annualGoal,
                quarterly_goal: quarterlyGoal,
                monthly_goal: monthlyGoal,
                weekly_goal: weeklyGoal,
                weekly_commitment_hours: Number.isFinite(hours) ? hours : 0,
            });
            setPlanStatus('Plan created successfully!');
            setSelectedGoalId('');
            setAnnualGoal('');
            setQuarterlyGoal('');
            setMonthlyGoal('');
            setWeeklyGoal('');
            setWeeklyHours('');
        } catch (error: any) {
            setPlanStatus(`Error: ${error.message}`);
        }
    };

    const handleCreateSession = async () => {
        if (!user || !sessionGoalId) {
            setSessionStatus('Please enter goal ID');
            return;
        }

        const minutes = parseInt(sessionMinutes, 10);
        if (!Number.isFinite(minutes) || minutes <= 0) {
            setSessionStatus('Please enter valid minutes');
            return;
        }

        try {
            setSessionStatus('Creating session...');
            await focusApi.createSession({
                user_id: user.id,
                goal_id: sessionGoalId,
                duration_minutes: minutes,
                mode: sessionMode,
                honesty_mode: true,
                interruption_count: 0,
            });
            setSessionStatus('Session created successfully!');
            setSessionGoalId('');
            setSessionMinutes('');
        } catch (error: any) {
            setSessionStatus(`Error: ${error.message}`);
        }
    };

    const handleFetchGoals = async () => {
        if (!user) return;
        try {
            setStatus('Fetching goals...');
            const goals = await goalsApi.getAll(user.id);
            Alert.alert('Goals', JSON.stringify(goals, null, 2));
            setStatus(`Fetched ${goals.length} goals`);
        } catch (error: any) {
            setStatus(`Error: ${error.message}`);
        }
    };

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.title}>Please sign in</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Debug: Goals & Plans</Text>

                {/* Create Goal Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Create Goal</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Goal Name"
                        value={goalName}
                        onChangeText={setGoalName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Description (optional)"
                        value={goalDescription}
                        onChangeText={setGoalDescription}
                    />
                    <View style={styles.row}>
                        <TouchableOpacity
                            style={[styles.typeButton, isCore && styles.typeButtonActive]}
                            onPress={() => setIsCore(true)}
                        >
                            <Text style={styles.typeButtonText}>Core</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.typeButton, !isCore && styles.typeButtonActive]}
                            onPress={() => setIsCore(false)}
                        >
                            <Text style={styles.typeButtonText}>Avoid</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.button} onPress={handleCreateGoal}>
                        <Text style={styles.buttonText}>Create Goal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={handleFetchGoals}>
                        <Text style={styles.buttonText}>Fetch All Goals</Text>
                    </TouchableOpacity>
                    {status ? <Text style={styles.status}>{status}</Text> : null}
                </View>

                {/* Create Plan Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Create Goal Plan</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Goal ID"
                        value={selectedGoalId}
                        onChangeText={setSelectedGoalId}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Annual Goal"
                        value={annualGoal}
                        onChangeText={setAnnualGoal}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Quarterly Goal"
                        value={quarterlyGoal}
                        onChangeText={setQuarterlyGoal}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Monthly Goal"
                        value={monthlyGoal}
                        onChangeText={setMonthlyGoal}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Weekly Goal"
                        value={weeklyGoal}
                        onChangeText={setWeeklyGoal}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Weekly Hours"
                        value={weeklyHours}
                        onChangeText={setWeeklyHours}
                        keyboardType="numeric"
                    />
                    <TouchableOpacity style={styles.button} onPress={handleCreatePlan}>
                        <Text style={styles.buttonText}>Create Plan</Text>
                    </TouchableOpacity>
                    {planStatus ? <Text style={styles.status}>{planStatus}</Text> : null}
                </View>

                {/* Create Session Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Create Focus Session</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Goal ID"
                        value={sessionGoalId}
                        onChangeText={setSessionGoalId}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Minutes"
                        value={sessionMinutes}
                        onChangeText={setSessionMinutes}
                        keyboardType="numeric"
                    />
                    <View style={styles.row}>
                        <TouchableOpacity
                            style={[styles.modeButton, sessionMode === 'Pomodoro' && styles.modeButtonActive]}
                            onPress={() => setSessionMode('Pomodoro')}
                        >
                            <Text style={styles.modeButtonText}>Pomodoro</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeButton, sessionMode === 'Stopwatch' && styles.modeButtonActive]}
                            onPress={() => setSessionMode('Stopwatch')}
                        >
                            <Text style={styles.modeButtonText}>Stopwatch</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeButton, sessionMode === 'Timelapse' && styles.modeButtonActive]}
                            onPress={() => setSessionMode('Timelapse')}
                        >
                            <Text style={styles.modeButtonText}>Timelapse</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.button} onPress={handleCreateSession}>
                        <Text style={styles.buttonText}>Create Session</Text>
                    </TouchableOpacity>
                    {sessionStatus ? <Text style={styles.status}>{sessionStatus}</Text> : null}
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
        padding: Spacing.xl,
    },
    title: {
        fontSize: Typography.h1.fontSize,
        fontWeight: Typography.h1.fontWeight,
        color: Colors.text.primary,
        marginBottom: Spacing.xl,
    },
    section: {
        marginBottom: Spacing.xxl,
    },
    sectionTitle: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: Spacing.md,
    },
    input: {
        backgroundColor: Colors.surface,
        borderRadius: 8,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        fontSize: Typography.body.fontSize,
        color: Colors.text.primary,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    row: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    typeButton: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: 8,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border.default,
        alignItems: 'center',
    },
    typeButtonActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    typeButtonText: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.primary,
    },
    modeButton: {
        flex: 1,
        padding: Spacing.sm,
        borderRadius: 8,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border.default,
        alignItems: 'center',
    },
    modeButtonActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    modeButtonText: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.primary,
    },
    button: {
        backgroundColor: Colors.primary,
        borderRadius: 8,
        padding: Spacing.md,
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    buttonText: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.surface,
    },
    status: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.secondary,
        marginTop: Spacing.sm,
    },
});
