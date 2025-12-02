import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScaleDecorator } from 'react-native-draggable-flatlist';

export interface UIGoal {
    id: string;
    name: string;
    description?: string;
    status: 'core' | 'avoid';
}

interface DraggableGoalItemProps {
    item: UIGoal;
    drag: () => void;
    isActive: boolean;
    onEdit: (goal: UIGoal) => void;
    onDelete: (goal: UIGoal) => void;
    onLongPress: () => void;
}

export default function DraggableGoalItem({ item, drag, isActive, onEdit, onDelete, onLongPress }: DraggableGoalItemProps) {
    return (
        <ScaleDecorator>
            <View
                style={[
                    styles.container,
                    item.status === 'avoid' && styles.avoidContainer
                ]}
            >
                <View style={styles.content}>
                    <View style={styles.info}>
                        <Text style={styles.name}>{item.name}</Text>
                        {item.description && (
                            <Text style={styles.description} numberOfLines={1}>
                                {item.description}
                            </Text>
                        )}
                    </View>
                    <View style={styles.actions}>
                        <TouchableOpacity
                            onPress={() => onEdit(item)}
                            style={styles.iconButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="pencil" size={20} color={Colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => onDelete(item)}
                            style={styles.iconButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="trash-outline" size={20} color={Colors.error} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onLongPress={drag}
                            delayLongPress={100}
                            style={styles.dragHandle}
                        >
                            <Text style={styles.dragIcon}>☰</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ScaleDecorator>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        marginBottom: Spacing.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border.default,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    avoidContainer: {
        borderColor: Colors.error,
        borderLeftWidth: 4,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    info: {
        flex: 1,
        marginRight: Spacing.md,
    },
    name: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    description: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.secondary,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    iconButton: {
        padding: Spacing.xs,
    },
    dragHandle: {
        padding: Spacing.sm,
        paddingLeft: Spacing.xs,
    },
    dragIcon: {
        fontSize: 20,
        color: Colors.text.tertiary,
    },
});
