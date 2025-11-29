import CommitmentCalendar from '@/components/vision/CommitmentCalendar';
import CoreGoalsList from '@/components/vision/CoreGoalsList';
import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VisionScreen() {
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    // Mock data - will be replaced with real data from Supabase
    const [coreGoals] = useState([
        {
            id: '1',
            name: 'Excel at Work',
            description: 'Promotion to Senior Manager by Q4.',
            status: 'core' as const,
        },
        {
            id: '2',
            name: 'Learn Spanish',
            description: 'Reach B2 Level conversation.',
            status: 'core' as const,
        },
        {
            id: '3',
            name: 'Fitness & Health',
            description: 'Run 5k under 25 mins.',
            status: 'core' as const,
        },
    ]);

    const [avoidGoals] = useState([
        {
            id: '4',
            name: 'Start YouTube Channel',
            description: 'Distraction from main career goal.',
            status: 'avoid' as const,
        },
        {
            id: '5',
            name: 'Learn Photography',
            description: 'Requires too much weekend time.',
            status: 'avoid' as const,
        },
    ]);

    // Generate calendar days (mock data)
    const generateCalendarDays = () => {
        const today = new Date().getDate();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

        // Adjust for Monday start (0 = Monday, 6 = Sunday)
        const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

        const days = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < startOffset; i++) {
            days.push({
                date: 0,
                isToday: false,
                tasks: [],
            });
        }

        // Add days of the month
        for (let date = 1; date <= daysInMonth; date++) {
            const isToday = date === today &&
                currentMonth === new Date().getMonth() &&
                currentYear === new Date().getFullYear();

            // Mock tasks for some dates
            const tasks = [];
            if (date === 15) {
                tasks.push(
                    { id: '1', name: 'Finish Report', goalColor: Colors.primary, isMIT: true },
                    { id: '2', name: 'Spanish Lesson', goalColor: '#10B981' }
                );
            } else if (date === 20) {
                tasks.push(
                    { id: '3', name: 'Meeting', goalColor: Colors.primary },
                    { id: '4', name: 'Gym', goalColor: '#F59E0B' },
                    { id: '5', name: 'Study', goalColor: '#10B981' },
                    { id: '6', name: 'Review', goalColor: '#EF4444' }
                );
            }

            days.push({
                date,
                isToday,
                tasks,
            });
        }

        return days;
    };

    const calendarDays = generateCalendarDays();

    const handleGoalPress = (goal: any) => {
        console.log('Goal pressed:', goal.name);
    };

    const handleDatePress = (date: number) => {
        if (date > 0) {
            console.log('Date pressed:', date);
            // TODO: Open Add Task Bottom Sheet
        }
    };

    const handleMonthChange = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            if (currentMonth === 0) {
                setCurrentMonth(11);
                setCurrentYear(currentYear - 1);
            } else {
                setCurrentMonth(currentMonth - 1);
            }
        } else {
            if (currentMonth === 11) {
                setCurrentMonth(0);
                setCurrentYear(currentYear + 1);
            } else {
                setCurrentMonth(currentMonth + 1);
            }
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Vision</Text>
                    <TouchableOpacity style={styles.addButton}>
                        <Text style={styles.addButtonIcon}>+</Text>
                    </TouchableOpacity>
                </View>

                {/* Core Goals List */}
                <CoreGoalsList
                    coreGoals={coreGoals}
                    avoidGoals={avoidGoals}
                    onGoalPress={handleGoalPress}
                />

                {/* Calendar Section */}
                <View style={styles.calendarSection}>
                    <Text style={styles.sectionTitle}>Commitment Calendar</Text>
                    <CommitmentCalendar
                        month={currentMonth}
                        year={currentYear}
                        days={calendarDays}
                        onDatePress={handleDatePress}
                        onMonthChange={handleMonthChange}
                    />
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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: Spacing.xl,
        marginTop: Spacing.lg,
    },
    title: {
        fontSize: Typography.h1.fontSize,
        fontWeight: Typography.h1.fontWeight,
        color: Colors.text.primary,
        lineHeight: Typography.h1.lineHeight,
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.text.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    addButtonIcon: {
        fontSize: 20,
        color: Colors.surface,
        fontWeight: '600',
    },
    calendarSection: {
        marginTop: Spacing.xxl,
    },
    sectionTitle: {
        fontSize: Typography.h2.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: Spacing.lg,
    },
});
