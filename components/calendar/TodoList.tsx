import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { Todo } from '@/services/todosApi';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TodoListProps {
    todos: Todo[];
    onToggle: (todoId: string, currentStatus: boolean) => void;
    onStartFocus: (todo: Todo) => void;
    onDelete: (todoId: string) => void;
}

export default function TodoList({ todos, onToggle, onStartFocus, onDelete }: TodoListProps) {
    if (todos.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No tasks for this day</Text>
                <Text style={styles.emptySubtext}>Add a task to start focusing</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {todos.map((todo) => (
                <View key={todo.todo_id} style={[styles.todoItem, todo.completed && styles.todoItemCompleted]}>
                    <TouchableOpacity
                        style={styles.checkboxArea}
                        onPress={() => onToggle(todo.todo_id, todo.completed)}
                    >
                        <Ionicons
                            name={todo.completed ? "checkbox" : "square-outline"}
                            size={24}
                            color={todo.completed ? Colors.text.tertiary : Colors.text.primary}
                        />
                    </TouchableOpacity>

                    <View style={styles.contentArea}>
                        <Text
                            style={[styles.title, todo.completed && styles.titleCompleted]}
                            numberOfLines={1}
                        >
                            {todo.title}
                        </Text>

                        {/* Goal Tag if exists */}
                        {todo.Goal && (
                            <View style={styles.tagContainer}>
                                <View style={[styles.tagDot, { backgroundColor: Colors.primary }]} />
                                <Text style={styles.tagName}>
                                    {(todo.Goal as any).goal_name}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Play Button - Only show if not completed */}
                    {!todo.completed && (
                        <TouchableOpacity
                            style={styles.playButton}
                            onPress={() => onStartFocus(todo)}
                        >
                            <Ionicons name="play" size={20} color={Colors.primary} />
                        </TouchableOpacity>
                    )}

                    {/* Delete Action (can be improved with swipe later) */}
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => onDelete(todo.todo_id)}
                    >
                        <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: Spacing.sm,
        gap: Spacing.md,
    },
    emptyContainer: {
        padding: Spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        height: 200,
    },
    emptyText: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.secondary,
        fontWeight: '600',
    },
    emptySubtext: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.tertiary,
        marginTop: Spacing.xs,
    },
    todoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        // Shadow for depth
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    todoItemCompleted: {
        opacity: 0.6,
        backgroundColor: Colors.background,
    },
    checkboxArea: {
        marginRight: Spacing.md,
    },
    contentArea: {
        flex: 1,
    },
    title: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.primary,
        fontWeight: '500',
    },
    titleCompleted: {
        textDecorationLine: 'line-through',
        color: Colors.text.tertiary,
    },
    tagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    tagDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    tagName: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.secondary,
    },
    playButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border.default,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.sm,
    },
    deleteButton: {
        padding: Spacing.sm,
    },
});
