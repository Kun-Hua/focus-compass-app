import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TimelapseVideo {
    session_id: string;
    public_url: string;
    expiration_date: string;
    created_at: string;
}

interface TimelapseHistoryModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function TimelapseHistoryModal({ visible, onClose }: TimelapseHistoryModalProps) {
    const { user } = useAuth();
    const [videos, setVideos] = useState<TimelapseVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    // Fetch videos on open
    useEffect(() => {
        if (visible && user) {
            fetchVideos();
        }
    }, [visible, user]);

    const fetchVideos = async () => {
        setLoading(true);
        try {
            // Fetch videos that haven't expired
            const { data, error } = await supabase
                .from('timelapse_videos')
                .select('*')
                .gt('expiration_date', new Date().toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVideos(data || []);
        } catch (err: any) {
            console.error('[TimelapseHistory] Fetch error:', err);
            Alert.alert('Error', 'Failed to load history');
        } finally {
            setLoading(false);
        }
    };

    // Helper: Ensure video is local
    const ensureLocalVideo = async (uri: string): Promise<string> => {
        if (uri.startsWith('http')) {
            const timestamp = Date.now();
            const localPath = `${FileSystem.cacheDirectory}timelapse_history_${timestamp}.mp4`;
            const { uri: downloadedUri } = await FileSystem.downloadAsync(uri, localPath);
            return downloadedUri;
        }
        return uri;
    };

    const handleDownload = async (video: TimelapseVideo) => {
        setDownloadingId(video.session_id);
        try {
            const localUri = await ensureLocalVideo(video.public_url);

            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Please allow access to save video.');
                return;
            }

            await MediaLibrary.saveToLibraryAsync(localUri);
            Alert.alert('Saved', 'Video saved to Photos');
        } catch (err: any) {
            console.error(err);
            Alert.alert('Error', 'Failed to save video');
        } finally {
            setDownloadingId(null);
        }
    };

    const handleShare = async (video: TimelapseVideo) => {
        setDownloadingId(video.session_id); // Re-use loading state
        try {
            if (!(await Sharing.isAvailableAsync())) {
                Alert.alert('Error', 'Sharing not supported on this device');
                return;
            }

            const localUri = await ensureLocalVideo(video.public_url);
            await Sharing.shareAsync(localUri, {
                mimeType: 'video/mp4',
                UTI: 'public.movie',
            });
        } catch (err: any) {
            console.error(err);
            Alert.alert('Error', 'Failed to share video');
        } finally {
            setDownloadingId(null);
        }
    };

    const renderItem = ({ item }: { item: TimelapseVideo }) => {
        const date = new Date(item.created_at).toLocaleString();
        const isProcessing = downloadingId === item.session_id;

        return (
            <View style={styles.card}>
                <View style={styles.cardInfo}>
                    <Ionicons name="videocam-outline" size={24} color={Colors.primary} />
                    <View style={styles.textContainer}>
                        <Text style={styles.dateText}>{date}</Text>
                        <Text style={styles.expirationText}>
                            Expires: {new Date(item.expiration_date).toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                {isProcessing ? (
                    <ActivityIndicator color={Colors.primary} />
                ) : (
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => handleDownload(item)}
                        >
                            <Ionicons name="download-outline" size={20} color={Colors.text.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => handleShare(item)}
                        >
                            <Ionicons name="share-outline" size={20} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Recent Timelapses</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeText}>Close</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
                ) : videos.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No recent videos found.</Text>
                        <Text style={styles.emptySubtext}>Videos are stored for 48 hours.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={videos}
                        keyExtractor={(item) => item.session_id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
    },
    title: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    closeButton: {
        padding: Spacing.sm,
    },
    closeText: {
        color: Colors.primary,
        fontWeight: '600',
    },
    loader: {
        marginTop: Spacing.xl,
    },
    listContent: {
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.surface,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    cardInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        flex: 1,
    },
    textContainer: {
        flex: 1,
    },
    dateText: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    expirationText: {
        fontSize: Typography.small.fontSize,
        color: Colors.error,
        marginTop: 2,
    },
    actions: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    iconButton: {
        padding: Spacing.sm,
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.full,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    emptyText: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.secondary,
        fontWeight: '600',
    },
    emptySubtext: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.tertiary,
        marginTop: Spacing.sm,
    },
});
