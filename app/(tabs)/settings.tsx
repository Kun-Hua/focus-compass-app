import Card from '@/components/ui/Card';
import { Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const { user, signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                        router.replace('/login');
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Text style={styles.title}>Settings</Text>

                {/* User Info */}
                <Card style={styles.userCard}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>
                            {user?.email?.[0].toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>
                            {user?.user_metadata?.full_name || 'User'}
                        </Text>
                        <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
                    </View>
                </Card>

                {/* Account Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <Card style={styles.settingsCard}>
                        <TouchableOpacity style={styles.settingItem}>
                            <Text style={styles.settingLabel}>Edit Profile</Text>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.settingItem, styles.settingItemNoBorder]}>
                            <Text style={styles.settingLabel}>Change Password</Text>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                    </Card>
                </View>

                {/* Preferences */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>
                    <Card style={styles.settingsCard}>
                        <TouchableOpacity style={styles.settingItem}>
                            <Text style={styles.settingLabel}>Notifications</Text>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.settingItem}>
                            <Text style={styles.settingLabel}>Focus Modes</Text>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.settingItem, styles.settingItemNoBorder]}>
                            <Text style={styles.settingLabel}>Theme</Text>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                    </Card>
                </View>

                {/* About */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Card style={styles.settingsCard}>
                        <TouchableOpacity style={styles.settingItem}>
                            <Text style={styles.settingLabel}>Help & Support</Text>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.settingItem}>
                            <Text style={styles.settingLabel}>Terms of Service</Text>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.settingItem, styles.settingItemNoBorder]}>
                            <Text style={styles.settingLabel}>Privacy Policy</Text>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                    </Card>
                </View>

                {/* Sign Out */}
                <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>

                {/* Version */}
                <Text style={styles.version}>Version 1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl,
    },
    title: {
        fontSize: Typography.h1.fontSize,
        fontWeight: Typography.h1.fontWeight,
        color: Colors.text.primary,
        lineHeight: Typography.h1.lineHeight,
        marginBottom: Spacing.xl,
        marginTop: Spacing.lg,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xl,
        padding: Spacing.lg,
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.surface,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.secondary,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
        color: Colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: Spacing.sm,
    },
    settingsCard: {
        padding: 0,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
    },
    settingItemNoBorder: {
        borderBottomWidth: 0,
    },
    settingLabel: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.primary,
    },
    chevron: {
        fontSize: 20,
        color: Colors.text.tertiary,
    },
    signOutButton: {
        backgroundColor: Colors.error,
        borderRadius: 12,
        padding: Spacing.lg,
        alignItems: 'center',
        marginTop: Spacing.lg,
        marginBottom: Spacing.md,
    },
    signOutText: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.surface,
    },
    version: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.tertiary,
        textAlign: 'center',
        marginTop: Spacing.md,
    },
});
