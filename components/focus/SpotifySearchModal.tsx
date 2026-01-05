import { BorderRadius, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { searchSpotifyTracks, SpotifyTrack, useSpotifyAuth } from '@/services/SpotifyService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface SpotifySearchModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectTrack: (track: SpotifyTrack) => void;
}

export default function SpotifySearchModal({
    visible,
    onClose,
    onSelectTrack,
}: SpotifySearchModalProps) {
    const { response, promptAsync } = useSpotifyAuth();
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<SpotifyTrack[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (response?.type === 'success') {
            const { access_token } = response.params;
            setAccessToken(access_token);
        }
    }, [response]);

    const handleSearch = async () => {
        if (!searchQuery.trim() || !accessToken) return;

        setIsLoading(true);
        const tracks = await searchSpotifyTracks(searchQuery, accessToken);
        setResults(tracks);
        setIsLoading(false);
    };

    const renderTrackItem = ({ item }: { item: SpotifyTrack }) => (
        <TouchableOpacity style={styles.trackItem} onPress={() => onSelectTrack(item)}>
            <Image source={{ uri: item.album.images[0]?.url }} style={styles.albumArt} />
            <View style={styles.trackInfo}>
                <Text style={styles.trackName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.artistName} numberOfLines={1}>
                    {item.artists.map((a: any) => a.name).join(', ')}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <Ionicons name="close" size={24} color={Colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Spotify Search</Text>
                    <View style={{ width: 40 }} />
                </View>

                {!accessToken ? (
                    <View style={styles.loginContainer}>
                        <Ionicons name="musical-notes" size={64} color="#1DB954" />
                        <Text style={styles.loginText}>Sign in to search for songs</Text>
                        <TouchableOpacity style={styles.loginButton} onPress={() => promptAsync()}>
                            <Text style={styles.loginButtonText}>Connect Spotify</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.content}>
                        <View style={styles.searchBar}>
                            <TextInput
                                style={styles.input}
                                placeholder="Search songs..."
                                placeholderTextColor={Colors.text.tertiary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                onSubmitEditing={handleSearch}
                                returnKeyType="search"
                                autoFocus
                            />
                            <TouchableOpacity onPress={handleSearch} disabled={isLoading}>
                                {isLoading ? (
                                    <ActivityIndicator size="small" color={Colors.primary} />
                                ) : (
                                    <Ionicons name="search" size={20} color={Colors.primary} />
                                )}
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={results}
                            keyExtractor={(item) => item.id}
                            renderItem={renderTrackItem}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                !isLoading && searchQuery.length > 0 ? (
                                    <Text style={styles.emptyText}>No songs found</Text>
                                ) : null
                            }
                        />
                    </View>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.xl,
        paddingTop: 60,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: Typography.h3.fontSize,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    loginContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xxl,
        gap: Spacing.lg,
    },
    loginText: {
        fontSize: Typography.body.fontSize,
        color: Colors.text.secondary,
        textAlign: 'center',
    },
    loginButton: {
        backgroundColor: '#1DB954',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xxl,
        borderRadius: BorderRadius.full,
    },
    loginButtonText: {
        color: Colors.surface,
        fontWeight: '700',
        fontSize: Typography.body.fontSize,
    },
    content: {
        flex: 1,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        margin: Spacing.lg,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    input: {
        flex: 1,
        paddingVertical: Spacing.md,
        fontSize: Typography.body.fontSize,
        color: Colors.text.primary,
    },
    listContent: {
        padding: Spacing.lg,
    },
    trackItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    albumArt: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.sm,
        marginRight: Spacing.md,
    },
    trackInfo: {
        flex: 1,
    },
    trackName: {
        fontSize: Typography.body.fontSize,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    artistName: {
        fontSize: Typography.small.fontSize,
        color: Colors.text.tertiary,
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.text.tertiary,
        marginTop: Spacing.xxl,
    },
});
