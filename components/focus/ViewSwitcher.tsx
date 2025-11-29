import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ViewMode = 'day' | 'week' | 'month';

interface ViewSwitcherProps {
    currentView: ViewMode;
    onViewChange: (view: ViewMode) => void;
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
        backgroundColor: Colors.border.default,
        borderRadius: BorderRadius.sm,
        padding: 3,
        gap: 3,
    },
    button: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.sm - 2,
        alignItems: 'center',
    },
    activeButton: {
        backgroundColor: Colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    buttonText: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    activeButtonText: {
        color: Colors.text.primary,
    },
});
