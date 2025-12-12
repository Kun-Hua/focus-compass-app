import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React, { useEffect, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CalendarViewProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
}

export default function CalendarView({ selectedDate, onSelectDate }: CalendarViewProps) {
    const scrollViewRef = useRef<ScrollView>(null);

    // Generate last 7 days + next 7 days
    const dates = useMemo(() => {
        const result = [];
        const today = new Date();
        for (let i = -7; i <= 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            result.push(d);
        }
        return result;
    }, []);

    // Scroll to center/today initially
    useEffect(() => {
        // Simple timeout to scroll after render. 
        // In a real app we might calculate precise offset.
        setTimeout(() => {
            // 50 is approx width of a day item + margin
            scrollViewRef.current?.scrollTo({ x: 7 * 60, animated: true });
        }, 100);
    }, []);

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {dates.map((date, index) => {
                    const isSelected = isSameDay(date, selectedDate);
                    const isToday = isSameDay(date, new Date());

                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.dayItem,
                                isSelected && styles.dayItemSelected,
                                isToday && !isSelected && styles.dayItemToday
                            ]}
                            onPress={() => onSelectDate(date)}
                        >
                            <Text style={[styles.dayName, isSelected && styles.textSelected]}>
                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                            </Text>
                            <Text style={[styles.dayNumber, isSelected && styles.textSelected]}>
                                {date.getDate()}
                            </Text>
                            {isToday && (
                                <View style={[styles.dot, isSelected && styles.dotSelected]} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.background,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
    },
    scrollContent: {
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
    },
    dayItem: {
        width: 50,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    dayItemSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
        transform: [{ scale: 1.05 }],
    },
    dayItemToday: {
        borderColor: Colors.primary,
    },
    dayName: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.secondary,
        marginBottom: 4,
    },
    dayNumber: {
        fontSize: Typography.body.fontSize,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    textSelected: {
        color: Colors.onPrimary,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.primary,
        marginTop: 4,
    },
    dotSelected: {
        backgroundColor: Colors.onPrimary,
    },
});
