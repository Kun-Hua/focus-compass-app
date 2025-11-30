import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ViewType = 'day' | 'week' | 'month';

interface ViewSwitcherProps {
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
}

export default function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.button, currentView === 'day' && styles.activeButton]}
                onPress={() => onViewChange('day')}
            >
                <Text style={[styles.buttonText, currentView === 'day' && styles.activeButtonText]}>
                    Day
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.button, currentView === 'week' && styles.activeButton]}
                onPress={() => onViewChange('week')}
            >
                <Text style={[styles.buttonText, currentView === 'week' && styles.activeButtonText]}>
                    Week
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.button, currentView === 'month' && styles.activeButton]}
                onPress={() => onViewChange('month')}
            >
                <Text style={[styles.buttonText, currentView === 'month' && styles.activeButtonText]}>
                    Month
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.full,
        padding: 4,
        marginBottom: Spacing.lg,
    },
    button: {
        flex: 1,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
    },
    activeButton: {
        backgroundColor: Colors.primary,
    },
    buttonText: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.secondary,
        fontWeight: '500',
    },
    activeButtonText: {
        color: Colors.surface,
        fontWeight: '600',
    },
});
