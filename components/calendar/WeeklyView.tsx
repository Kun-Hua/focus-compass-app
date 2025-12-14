import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { useAuth } from '@/contexts/AuthContext';
import { Todo, todosApi } from '@/services/todosApi';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COL_WIDTH = 100;
const TIME_COL_WIDTH = 60;
const ROW_HEIGHT = 60;

interface WeeklyViewProps {
    currentWeek: Date; // Start of week (Sunday)
    onWeekChange: (newStartDate: Date) => void;
    onAddTodo: (date: Date, startTime?: Date) => void;
    onTodoPress: (todo: Todo) => void;
}

export default function WeeklyView({ currentWeek, onWeekChange, onAddTodo, onTodoPress }: WeeklyViewProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [todos, setTodos] = useState<Todo[]>([]);
    const scrollViewRef = useRef<ScrollView>(null);
    const horizontalScrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        loadWeekData();
    }, [user, currentWeek]);

    // Auto-scroll to current time and today's column on mount
    useEffect(() => {
        if (!loading) {
            const today = new Date();
            const currentHour = today.getHours();
            const currentDay = today.getDay(); // 0=Sunday, 1=Monday, etc.

            // Scroll vertically to current hour (minus 2 for context)
            if (scrollViewRef.current) {
                const scrollToHour = Math.max(0, currentHour - 2);
                const scrollY = scrollToHour * ROW_HEIGHT;
                setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: scrollY, animated: true });
                }, 400);
            }

            // Scroll horizontally to today's column (center it if possible)
            if (horizontalScrollRef.current) {
                const scrollX = currentDay * COL_WIDTH;
                setTimeout(() => {
                    horizontalScrollRef.current?.scrollTo({ x: scrollX, animated: true });
                }, 400);
            }
        }
    }, [loading]);

    const loadWeekData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const weekTodos = await todosApi.getTodosByWeek(user.id, currentWeek);
            setTodos(weekTodos);
        } catch (err) {
            console.error('Failed to load week data', err);
        } finally {
            setLoading(false);
        }
    };

    // Generate 7 days for the week
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(currentWeek);
        day.setDate(currentWeek.getDate() + i);
        return day;
    });

    // Time slots (full 24 hours: 0-23)
    const startHour = 0;
    const endHour = 23;
    const timeSlots = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

    // Group todos by day and time
    const getTodosForDayAndHour = (date: Date, hour: number) => {
        // Format date string locally YYYY-MM-DD
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        return todos.filter(t => {
            if (t.due_date !== dateStr) return false;
            if (t.is_all_day) return false; // All-day shown separately

            if (!t.start_time) return false;
            const todoHour = new Date(t.start_time).getHours();
            return todoHour === hour;
        });
    };

    const getAllDayTodosForDay = (date: Date) => {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return todos.filter(t => t.due_date === dateStr && t.is_all_day);
    };

    const handlePrevWeek = () => {
        const prev = new Date(currentWeek);
        prev.setDate(currentWeek.getDate() - 7);
        onWeekChange(prev);
    };

    const handleNextWeek = () => {
        const next = new Date(currentWeek);
        next.setDate(currentWeek.getDate() + 7);
        onWeekChange(next);
    };

    // Check if a date is today
    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    // Check if an hour is the current hour
    const isCurrentHour = (hour: number) => {
        return new Date().getHours() === hour;
    };

    if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;

    return (
        <View style={styles.container}>
            {/* Week Navigation */}
            <View style={styles.weekNav}>
                <TouchableOpacity onPress={handlePrevWeek}>
                    <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.weekTitle}>
                    {currentWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
                <TouchableOpacity onPress={handleNextWeek}>
                    <Ionicons name="chevron-forward" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView ref={horizontalScrollRef} horizontal showsHorizontalScrollIndicator={false}>
                <View>
                    {/* Header Row */}
                    <View style={styles.headerRow}>
                        <View style={styles.timeColumnHeader} />
                        {weekDays.map((day, idx) => (
                            <View key={idx} style={[styles.dayColumn, isToday(day) && styles.todayColumn]}>
                                <Text style={[styles.dayName, isToday(day) && styles.todayText]}>{day.toLocaleDateString('en-US', { weekday: 'short' })}</Text>
                                <Text style={[styles.dayNumber, isToday(day) && styles.todayText]}>{day.getDate()}</Text>
                            </View>
                        ))}
                    </View>

                    {/* All-Day Row */}
                    <View style={styles.allDayRow}>
                        <View style={styles.timeLabel}>
                            <Text style={styles.timeLabelText}>All Day</Text>
                        </View>
                        {weekDays.map((day, idx) => {
                            const allDayTodos = getAllDayTodosForDay(day);
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    style={[styles.allDayCell, isToday(day) && styles.todayCell]}
                                    onPress={() => onAddTodo(day)}
                                >
                                    {allDayTodos.map(todo => (
                                        <TouchableOpacity
                                            key={todo.todo_id}
                                            style={[styles.allDayTodo, todo.completed && styles.completedTodo]}
                                            onPress={() => onTodoPress(todo)}
                                        >
                                            <Text style={styles.todoTitle} numberOfLines={1}>{todo.title}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Time Slots */}
                    <ScrollView ref={scrollViewRef} style={styles.timeSlotScroll}>
                        {timeSlots.map(hour => (
                            <View key={hour} style={styles.timeRow}>
                                <View style={styles.timeLabel}>
                                    <Text style={styles.timeLabelText}>{`${hour.toString().padStart(2, '0')}:00`}</Text>
                                </View>
                                {weekDays.map((day, idx) => {
                                    const hourTodos = getTodosForDayAndHour(day, hour);
                                    const isTodayAndNow = isToday(day) && isCurrentHour(hour);
                                    return (
                                        <TouchableOpacity
                                            key={idx}
                                            style={[
                                                styles.timeCell,
                                                isToday(day) && styles.todayCell,
                                                isTodayAndNow && styles.currentHourCell
                                            ]}
                                            onPress={() => {
                                                const timeSlot = new Date(day);
                                                timeSlot.setHours(hour, 0, 0, 0);
                                                onAddTodo(day, timeSlot);
                                            }}
                                        >
                                            {hourTodos.map(todo => (
                                                <TouchableOpacity
                                                    key={todo.todo_id}
                                                    style={[styles.timedTodo, todo.completed && styles.completedTodo]}
                                                    onPress={() => onTodoPress(todo)}
                                                >
                                                    <Text style={styles.todoTitle} numberOfLines={2}>{todo.title}</Text>
                                                    {todo.start_time && (
                                                        <Text style={styles.todoTime}>
                                                            {new Date(todo.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                        </Text>
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    weekNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    weekTitle: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    headerRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
        backgroundColor: Colors.surface,
    },
    timeColumnHeader: {
        width: TIME_COL_WIDTH,
    },
    dayColumn: {
        width: COL_WIDTH,
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    todayColumn: {
        backgroundColor: Colors.primaryLight || '#E6F4FE',
    },
    dayName: {
        fontSize: 12,
        color: Colors.text.secondary,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    dayNumber: {
        fontSize: 18,
        color: Colors.text.primary,
        fontWeight: '600',
        marginTop: 4,
    },
    todayText: {
        color: Colors.primary,
        fontWeight: '700',
    },
    allDayRow: {
        flexDirection: 'row',
        minHeight: 40,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
        backgroundColor: '#F9FAFB',
    },
    timeSlotScroll: {
        maxHeight: 500,
    },
    timeRow: {
        flexDirection: 'row',
        height: ROW_HEIGHT,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
    },
    timeLabel: {
        width: TIME_COL_WIDTH,
        paddingRight: 8,
        paddingTop: 4,
        alignItems: 'flex-end',
    },
    timeLabelText: {
        fontSize: 10,
        color: Colors.text.tertiary,
    },
    timeCell: {
        width: COL_WIDTH,
        borderLeftWidth: 1,
        borderLeftColor: Colors.border.default,
        padding: 2,
    },
    todayCell: {
        backgroundColor: Colors.primaryLight || '#E6F4FE',
    },
    currentHourCell: {
        backgroundColor: '#B3E0FF',
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    allDayCell: {
        width: COL_WIDTH,
        borderLeftWidth: 1,
        borderLeftColor: Colors.border.default,
        padding: 2,
        minHeight: 40,
    },
    allDayTodo: {
        backgroundColor: Colors.primary + '20',
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary,
        padding: 4,
        borderRadius: 4,
        marginBottom: 2,
    },
    timedTodo: {
        backgroundColor: Colors.primary + '20',
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary,
        padding: 4,
        borderRadius: 4,
        marginBottom: 2,
    },
    completedTodo: {
        opacity: 0.5,
    },
    todoTitle: {
        fontSize: 11,
        color: Colors.text.primary,
        fontWeight: '500',
    },
    todoTime: {
        fontSize: 9,
        color: Colors.text.tertiary,
        marginTop: 2,
    },
});
