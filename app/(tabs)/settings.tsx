import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const [language, setLanguage] = useState<'en' | 'zh'>('en');
    const [dailyReminder, setDailyReminder] = useState(true);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Text style={styles.title}>Settings</Text>

                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <TouchableOpacity style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>F</Text>
                        </View>
                        <View style={styles.avatarOverlay}>
                            <Text style={styles.avatarOverlayIcon}>📷</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.profileFields}>
                        <View style={styles.field}>
                            <Text style={styles.fieldLabel}>Nickname</Text>
                            <View style={styles.fieldInput}>
                                <TextInput
                                    style={styles.input}
                                    value="Felix"
                                    placeholder="Enter nickname"
                                    placeholderTextColor={Colors.text.tertiary}
                                />
                                <Text style={styles.editIcon}>✏️</Text>
                            </View>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.fieldLabel}>Email</Text>
                            <Text style={styles.fieldValue}>felix@example.com</Text>
                        </View>
                    </View>
                </View>

                {/* Preferences Group */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PREFERENCES</Text>
                    <View style={styles.settingsGroup}>
                        {/* Language */}
                        <View style={styles.settingItem}>
                            <Text style={styles.settingLabel}>Language / 語言</Text>
                            <View style={styles.segmentedControl}>
                                <TouchableOpacity
                                    style={[styles.segment, language === 'en' && styles.segmentActive]}
                                    onPress={() => setLanguage('en')}
                                >
                                    <Text style={[styles.segmentText, language === 'en' && styles.segmentTextActive]}>
                                        English
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.segment, language === 'zh' && styles.segmentActive]}
                                    onPress={() => setLanguage('zh')}
                                >
                                    <Text style={[styles.segmentText, language === 'zh' && styles.segmentTextActive]}>
                                        繁體中文
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Notifications */}
                        <View style={[styles.settingItem, styles.settingItemNoBorder]}>
                            <View style={styles.settingLeft}>
                                <Text style={styles.settingLabel}>Daily Reminder</Text>
                                <Text style={styles.settingSubtext}>09:00 AM daily plan</Text>
                            </View>
                            <Switch
                                value={dailyReminder}
                                onValueChange={setDailyReminder}
                                trackColor={{ false: Colors.border.default, true: Colors.primary }}
                                thumbColor={Colors.surface}
                            />
                        </View>
                    </View>
                </View>

                {/* About Group */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ABOUT</Text>
                    <View style={styles.settingsGroup}>
                        <View style={styles.settingItem}>
                            <Text style={styles.settingLabel}>Version</Text>
                            <Text style={styles.settingValue}>1.0.0</Text>
                        </View>
                        <TouchableOpacity style={styles.settingItem}>
                            <Text style={styles.settingLabel}>Terms of Service</Text>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.settingItem, styles.settingItemNoBorder]}>
                            <Text style={styles.settingLabel}>Privacy Policy</Text>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Log Out Button */}
                <TouchableOpacity style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <Text style={styles.userId}>User ID: 88349201</Text>
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
        paddingBottom: Spacing.xxl,
    },
    title: {
        fontSize: Typography.h1.fontSize,
        fontWeight: Typography.h1.fontWeight,
        color: Colors.text.primary,
        lineHeight: Typography.h1.lineHeight,
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.xl,
        marginTop: Spacing.lg,
    },
    profileSection: {
        backgroundColor: Colors.surface,
        paddingVertical: Spacing.xl,
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.xxl,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: Colors.border.default,
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: Spacing.lg,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.border.default,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    avatarOverlay: {
        position: 'absolute',
        inset: 0,
        borderRadius: 40,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0,
    },
    avatarOverlayIcon: {
        fontSize: 24,
    },
    profileFields: {
        width: '100%',
        maxWidth: 320,
        gap: Spacing.lg,
    },
    field: {
        gap: 4,
    },
    fieldLabel: {
        fontSize: Typography.small.fontSize,
        fontWeight: '600',
        color: Colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    fieldInput: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
        paddingVertical: 4,
    },
    input: {
        flex: 1,
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
        padding: 0,
    },
    editIcon: {
        fontSize: 16,
    },
    fieldValue: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.tertiary,
    },
    section: {
        marginBottom: Spacing.xxl,
        paddingHorizontal: Spacing.xl,
    },
    sectionTitle: {
        fontSize: Typography.small.fontSize,
        fontWeight: '600',
        color: Colors.text.tertiary,
        letterSpacing: 1,
        marginBottom: Spacing.sm,
    },
    settingsGroup: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        borderColor: Colors.border.default,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
    },
    settingItemNoBorder: {
        borderBottomWidth: 0,
    },
    settingLeft: {
        flex: 1,
    },
    settingLabel: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    settingSubtext: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    settingValue: {
        fontSize: Typography.caption.fontSize,
        color: Colors.text.secondary,
    },
    chevron: {
        fontSize: 20,
        color: Colors.text.tertiary,
    },
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: Colors.background,
        padding: 2,
        borderRadius: BorderRadius.sm,
        gap: 2,
    },
    segment: {
        flex: 1,
        paddingVertical: 6,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.sm - 2,
        alignItems: 'center',
    },
    segmentActive: {
        backgroundColor: Colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    segmentText: {
        fontSize: Typography.caption.fontSize,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    segmentTextActive: {
        color: Colors.text.primary,
    },
    logoutButton: {
        marginHorizontal: Spacing.xl,
        paddingVertical: Spacing.lg,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border.default,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    logoutText: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.error,
    },
    userId: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.tertiary,
        textAlign: 'center',
        marginTop: Spacing.lg,
    },
});
