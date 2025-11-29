import { BorderRadius, Colors, Typography } from '@/constants/DesignSystem';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface BadgeProps {
    text: string;
    color?: string;
    style?: ViewStyle;
}

export default function Badge({ text, color = Colors.primary, style }: BadgeProps) {
    const backgroundColor = `${color}15`; // 15 = ~8% opacity in hex

    return (
        <View style={[styles.badge, { backgroundColor }, style]}>
            <Text style={[styles.badgeText, { color }]}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: Typography.small.fontSize,
        fontWeight: '600',
    },
});
