import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { useAuth } from '@/contexts/AuthContext';
import { Todo, todosApi } from '@/services/todosApi';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MonthlyViewProps {
    currentMonth: Date; // Date representing the month (any day in that month)
    onMonthChange: (newDate: Date) => void;
    onAddTodo: (date: Date) => void;
    onTodoPress: (todo: Todo) => void;
}

export default function MonthlyView({ currentMonth, onMonthChange, onAddTodo, onTodoPress }: MonthlyViewProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [todos, setTodos] = useState<Todo[]>([]);

    useEffect(() => {
        loadMonthData();
    }, [user, currentMonth]);

    const loadMonthData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth() + 1; // 1-indexed
            const monthTodos = await todosApi.getTodosByMonth(user.id, year, month);
            setTodos(monthTodos);
        } catch (err) {
            console.error('Failed to load month data', err);
        } finally {
            setLoading(false);
        }
    };

    // Generate calendar grid
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
    const daysInMonth = lastDayOfMonth.getDate();

    // Calculate days to show (including previous/next month padding)
    const totalCells = Math.ceil((startDayOfWeek + daysInMonth) / 7) * 7;
    const calendarDays: (Date | null)[] = [];

    // Fill previous month days
    for (let i = 0; i < startDayOfWeek; i++) {
        const prevDay = new Date(year, month, -(startDayOfWeek - i - 1));
        calendarDays.push(prevDay);
    }

    // Fill current month days
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push(new Date(year, month, i));
    }

    // Fill next month days
    const remainingCells = totalCells - calendarDays.length;
    for (let i = 1; i <= remainingCells; i++) {
        calendarDays.push(new Date(year, month + 1, i));
    }

    // Group todos by date
    const getTodosForDate = (date: Date | null) => {
        if (!date) return [];
        const dateStr = date.toISOString().split('T')[0];
        return todos.filter(t => t.due_date === dateStr);
    };

    const isCurrentMonth = (date: Date | null) => {
        if (!date) return false;
        return date.getMonth() === month;
    };

    const isToday = (date: Date | null) => {
        if (!date) return false;
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const handlePrevMonth = () => {
        const prev = new Date(currentMonth);
        prev.setMonth(currentMonth.getMonth() - 1);
        onMonthChange(prev);
    };

    const handleNextMonth = () => {
        const next = new Date(currentMonth);
        next.setMonth(currentMonth.getMonth() + 1);
        onMonthChange(next);
    };

    if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;

    // Split into weeks
    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
        weeks.push(calendarDays.slice(i, i + 7));
    }

    return (
        <View style={styles.container}>
            {/* Month Navigation */}
            <View style={styles.monthNav}>
                <TouchableOpacity onPress={handlePrevMonth}>
                    <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.monthTitle}>
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
                <TouchableOpacity onPress={handleNextMonth}>
                    <Ionicons name="chevron-forward" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Weekday Headers */}
                <View style={styles.weekdayHeader}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <View key={day} style={styles.weekdayCell}>
                            <Text style={styles.weekdayText}>{day}</Text>
                        </View>
                    ))}
                </View>

                {/* Calendar Grid */}
                {weeks.map((week, weekIdx) => (
                    <View key={weekIdx} style={styles.weekRow}>
                        {week.map((date, dayIdx) => {
                            const dateTodos = getTodosForDate(date);
                            const isCurMonth = isCurrentMonth(date);
                            const isTodayDate = isToday(date);
                            const visibleTodos = dateTodos.slice(0, 3); // Max 3 visible
                            const hiddenCount = Math.max(0, dateTodos.length - 3);

                            return (
                                <TouchableOpacity
                                    key={dayIdx}
                                    style={[
                                        styles.dayCell,
                                        !isCurMonth && styles.otherMonthCell,
                                        isTodayDate && styles.todayCell
                                    ]}
                                    onPress={() => date && onAddTodo(date)}
                                >
                                    <Text style={[
                                        styles.dateNumber,
                                        !isCurMonth && styles.otherMonthText,
                                        isTodayDate && styles.todayText
                                    ]}>
                                        {date?.getDate()}
                                    </Text>
                                    <View style={styles.todoContainer}>
                                        {visibleTodos.map(todo => (
                                            <TouchableOpacity
                                                key={todo.todo_id}
                                                style={[styles.todoPill, todo.completed && styles.completedPill]}
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    onTodoPress(todo);
                                                }}
                                            >
                                                <Text style={styles.todoPillText} numberOfLines={1}>
                                                    {todo.title}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                        {hiddenCount > 0 && (
                                            <Text style={styles.moreText}>+{hiddenCount} more</Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const DAY_CELL_HEIGHT = 100;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    monthNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    monthTitle: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    scrollContent: {
        paddingHorizontal: Spacing.sm,
    },
    weekdayHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
        backgroundColor: Colors.surface,
    },
    weekdayCell: {
        flex: 1,
        paddingVertical: Spacing.sm,
        alignItems: 'center',
    },
    weekdayText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text.secondary,
        textTransform: 'uppercase',
    },
    weekRow: {
        flexDirection: 'row',
    },
    dayCell: {
        flex: 1,
        height: DAY_CELL_HEIGHT,
        borderWidth: 1,
        borderColor: Colors.border.default,
        padding: 4,
        backgroundColor: Colors.surface,
    },
    otherMonthCell: {
        backgroundColor: '#F9FAFB',
    },
    todayCell: {
        backgroundColor: Colors.primaryLight || '#E6F4FE',
    },
    dateNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    otherMonthText: {
        color: Colors.text.disabled,
    },
    todayText: {
        color: Colors.primary,
        fontWeight: '700',
    },
    todoContainer: {
        gap: 2,
    },
    todoPill: {
        backgroundColor: Colors.primary + '30',
        borderRadius: 4,
        padding: 2,
        paddingHorizontal: 4,
    },
    completedPill: {
        opacity: 0.5,
        textDecorationLine: 'line-through',
    },
    todoPillText: {
        fontSize: 10,
        color: Colors.text.primary,
    },
    moreText: {
        fontSize: 9,
        color: Colors.text.tertiary,
        fontStyle: 'italic',
        marginTop: 2,
    },
});
