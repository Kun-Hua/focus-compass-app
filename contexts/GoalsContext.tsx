import { goalPlansApi } from '@/services/goalPlansApi';
import { goalsApi } from '@/services/goalsApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

const CALENDAR_STORAGE_KEY = 'commitment_calendar_data';

export type GoalPlan = {
    goalId: string;
    goalName: string;
    annualGoal: string;
    quarterlyGoal: string;
    monthlyGoal: string;
    weeklyGoal: string;
    weeklyCommitmentHours: number;
};

type GoalsContextType = {
    goals: any[];
    plans: GoalPlan[];
    loading: boolean;
    refreshGoals: () => Promise<void>;
    updatePlan: (plan: GoalPlan) => Promise<void>;
    calendarData: Record<string, number>;
    updateCalendarData: (date: string, hours: number) => Promise<void>;
};

const GoalsContext = createContext<GoalsContextType>({
    goals: [],
    plans: [],
    loading: false,
    refreshGoals: async () => { },
    updatePlan: async () => { },
    calendarData: {},
    updateCalendarData: async () => { },
});

export const useGoals = () => useContext(GoalsContext);

export function GoalsProvider({ children, userId }: { children: React.ReactNode; userId: string | null }) {
    const [goals, setGoals] = useState<any[]>([]);
    const [plans, setPlans] = useState<GoalPlan[]>([]);
    const [loading, setLoading] = useState(false);
    const [calendarData, setCalendarData] = useState<Record<string, number>>({});

    useEffect(() => {
        if (userId) {
            refreshGoals();
            loadCalendarData();
        }
    }, [userId]);

    const loadCalendarData = async () => {
        try {
            const stored = await AsyncStorage.getItem(CALENDAR_STORAGE_KEY);
            if (stored) {
                setCalendarData(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load calendar data', e);
        }
    };

    const updateCalendarData = async (date: string, hours: number) => {
        const newData = { ...calendarData, [date]: hours };
        setCalendarData(newData);
        await AsyncStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(newData));
    };

    const refreshGoals = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const [coreGoals, avoidGoals, goalPlans] = await Promise.all([
                goalsApi.getCoreGoals(userId),
                goalsApi.getAvoidanceGoals(userId),
                goalPlansApi.getAll(userId),
            ]);

            const allGoals = [...coreGoals, ...avoidGoals];
            setGoals(allGoals);

            // Map DB plans to UI plans
            const mappedPlans = goalPlans.map((p: any) => ({
                goalId: p.goal_id,
                goalName: allGoals.find((g) => g.goal_id === p.goal_id)?.goal_name || 'Unknown',
                annualGoal: p.annual_goal || '',
                quarterlyGoal: p.quarterly_goal || '',
                monthlyGoal: p.monthly_goal || '',
                weeklyGoal: p.weekly_goal || '',
                weeklyCommitmentHours: p.weekly_commitment_hours || 0,
            }));
            setPlans(mappedPlans);
        } catch (error) {
            console.error('Failed to refresh goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const updatePlan = async (plan: GoalPlan) => {
        if (!userId) return;
        try {
            await goalPlansApi.upsert(plan.goalId, userId, {
                annual_goal: plan.annualGoal,
                quarterly_goal: plan.quarterlyGoal,
                monthly_goal: plan.monthlyGoal,
                weekly_goal: plan.weeklyGoal,
                weekly_commitment_hours: plan.weeklyCommitmentHours,
            });
            await refreshGoals();
        } catch (error) {
            console.error('Failed to update plan:', error);
            throw error;
        }
    };

    return (
        <GoalsContext.Provider
            value={{
                goals,
                plans,
                loading,
                refreshGoals,
                updatePlan,
                calendarData,
                updateCalendarData,
            }}
        >
            {children}
        </GoalsContext.Provider>
    );
}
