
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface DeviceAudioListProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (uri: string, name: string) => void;
}

export default function DeviceAudioList({ visible, onClose, onSelect }: DeviceAudioListProps) {
    const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
    const [loading, setLoading] = useState(false);
    const [permissionError, setPermissionError] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [playingId, setPlayingId] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        if (visible) {
            loadAudioAssets();
        } else {
            stopAudio();
        }

        return () => {
            isMounted = false;
            stopAudio();
        };
    }, [visible]);

    const stopAudio = async () => {
        if (sound) {
            await sound.unloadAsync();
            setSound(null);
            setPlayingId(null);
        }
    };

    const loadAudioAssets = async () => {
        setLoading(true);
        try {
            // Check current status first - this is safer than requesting immediately
            const status = await MediaLibrary.getPermissionsAsync().catch(() => ({ granted: false, canAskAgain: true }));

            if (!status.granted && status.canAskAgain) {
                // Try to request, but be prepared for it to throw a "rejected" error 
                // if it's not in the AndroidManifest (common in Expo Go)
                const permission = await MediaLibrary.requestPermissionsAsync().catch(err => {
                    console.warn('[DeviceAudioList] Permission request rejected:', err.message);
                    return { granted: false };
                });

                if (!permission.granted) {
                    setPermissionError(true);
                    setLoading(false);
                    return;
                }
            } else if (!status.granted) {
                setPermissionError(true);
                setLoading(false);
                return;
            }

            const media = await MediaLibrary.getAssetsAsync({
                mediaType: MediaLibrary.MediaType.audio,
                first: 100, // Limit to 100 songs for performance
                sortBy: [MediaLibrary.SortBy.creationTime],
            });

            // Filter out very short clips (likely notification sounds not suitable for alarm loops if we want songs)
            // or we can keep them. For now let's just show all.
            setAssets(media.assets);
        } catch (error: any) {
            console.warn('[DeviceAudioList] Error fetching audio (likely permission rejected):', error.message);
            // Fallback to permission error state regardless of exact cause to show system picker option
            setPermissionError(true);
        } finally {
            setLoading(false);
        }
    };

    const pickFromSystem = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'audio/*',
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const asset = result.assets[0];
            onSelect(asset.uri, asset.name);
        } catch (e) {
            console.error('Error picking system sound:', e);
            Alert.alert('Error', 'Failed to pick file from system.');
        }
    };

    const previewAudio = async (asset: MediaLibrary.Asset) => {
        try {
            if (playingId === asset.id) {
                await stopAudio();
                return;
            }

            await stopAudio();

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: asset.uri },
                { shouldPlay: true }
            );
            setSound(newSound);
            setPlayingId(asset.id);

            newSound.setOnPlaybackStatusUpdate(status => {
                if (status.isLoaded && status.didJustFinish) {
                    setPlayingId(null);
                }
            });
        } catch (error) {
            console.error('Playback failed', error);
        }
    };

    const renderItem = ({ item }: { item: MediaLibrary.Asset }) => (
        <View style={styles.itemContainer}>
            <TouchableOpacity
                style={styles.itemContent}
                onPress={() => previewAudio(item)}
            >
                <View style={styles.iconContainer}>
                    <Ionicons
                        name={playingId === item.id ? "pause-circle" : "play-circle"}
                        size={32}
                        color={Colors.primary}
                    />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.filename} numberOfLines={1}>{item.filename}</Text>
                    <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.selectButton}
                onPress={() => {
                    stopAudio();
                    onSelect(item.uri, item.filename);
                }}
            >
                <Text style={styles.selectButtonText}>Select</Text>
            </TouchableOpacity>
        </View>
    );

    const formatDuration = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Select Audio</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={Colors.text.primary} />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.loadingText}>Loading audio...</Text>
                    </View>
                ) : permissionError ? (
                    <View style={styles.center}>
                        <Ionicons name="alert-circle-outline" size={48} color={Colors.text.secondary} />
                        <Text style={styles.errorText}>
                            Cannot scan device audio directly.{'\n'}
                            (System limitation in Expo Go)
                        </Text>
                        <TouchableOpacity style={styles.retryButton} onPress={pickFromSystem}>
                            <Text style={styles.retryText}>📂 Open System File Picker</Text>
                        </TouchableOpacity>
                    </View>
                ) : assets.length === 0 ? (
                    <View style={styles.center}>
                        <Text style={styles.emptyText}>No audio files found on device.</Text>
                        <TouchableOpacity style={[styles.retryButton, { marginTop: Spacing.lg }]} onPress={pickFromSystem}>
                            <Text style={styles.retryText}>📂 Try System Picker</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={assets}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
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
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    closeButton: {
        padding: Spacing.sm,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    loadingText: {
        marginTop: Spacing.md,
        color: Colors.text.secondary,
        fontSize: Typography.body.fontSize,
    },
    errorText: {
        color: Colors.error,
        fontSize: Typography.body.fontSize,
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },
    emptyText: {
        color: Colors.text.secondary,
        fontSize: Typography.body.fontSize,
    },
    retryButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    retryText: {
        color: Colors.surface,
        fontWeight: '600',
    },
    listContent: {
        padding: Spacing.md,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: Spacing.sm,
        marginBottom: Spacing.sm,
        borderRadius: BorderRadius.md,
        // Shadow for elevation
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    itemContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        marginRight: Spacing.md,
    },
    textContainer: {
        flex: 1,
        marginRight: Spacing.md,
    },
    filename: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.primary,
        fontWeight: '500',
        marginBottom: 2,
    },
    duration: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.secondary,
    },
    selectButton: {
        backgroundColor: Colors.background,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    selectButtonText: {
        fontSize: Typography.small.fontSize,
        color: Colors.primary,
        fontWeight: '600',
    },
});
