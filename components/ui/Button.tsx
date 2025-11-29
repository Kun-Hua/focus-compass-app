import { BorderRadius, Colors, Shadows, Typography } from '@/constants/DesignSystem';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    ViewStyle
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
}

export default function Button({
    title,
    onPress,
    variant = 'primary',
    disabled = false,
    loading = false,
    style,
}: ButtonProps) {
    const isPrimary = variant === 'primary';

    return (
        <TouchableOpacity
            style={[
                styles.button,
                isPrimary ? styles.primaryButton : styles.secondaryButton,
                disabled && styles.disabledButton,
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={isPrimary ? Colors.surface : Colors.primary} />
            ) : (
                <Text
                    style={[
                        styles.buttonText,
                        isPrimary ? styles.primaryText : styles.secondaryText,
                        disabled && styles.disabledText,
                    ]}
                >
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        height: 48,
        borderRadius: BorderRadius.sm,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        ...Shadows.soft,
    },
    primaryButton: {
        backgroundColor: Colors.primary,
    },
    secondaryButton: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    disabledButton: {
        opacity: 0.5,
    },
    buttonText: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
    },
    primaryText: {
        color: Colors.surface,
    },
    secondaryText: {
        color: Colors.text.primary,
    },
    disabledText: {
        color: Colors.text.disabled,
    },
});
