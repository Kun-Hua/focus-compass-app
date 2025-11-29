import { BorderRadius, Colors, Shadows } from '@/constants/DesignSystem';
import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface CardProps {
    children: ReactNode;
    style?: ViewStyle;
    borderColor?: string;
}

export default function Card({ children, style, borderColor }: CardProps) {
    return (
        <View
            style={[
                styles.card,
                borderColor && { borderLeftWidth: 4, borderLeftColor: borderColor },
                style,
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: 16,
        ...Shadows.soft,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
});
