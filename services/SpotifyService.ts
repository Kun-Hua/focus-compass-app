import { makeRedirectUri, ResponseType, useAuthRequest } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

// Spotify Configuration
// TODO: Replace with your actual Spotify Client ID from https://developer.spotify.com/dashboard/applications
const CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID';
const DISCOVERY = {
    authorizationEndpoint: 'https://accounts.spotify.com/authorize',
    tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

export interface SpotifyTrack {
    id: string;
    name: string;
    uri: string;
    artists: { name: string }[];
    album: {
        images: { url: string }[];
    };
}

export const useSpotifyAuth = () => {
    const [request, response, promptAsync] = useAuthRequest(
        {
            responseType: ResponseType.Token,
            clientId: CLIENT_ID,
            scopes: ['user-read-private', 'user-read-email', 'streaming', 'app-remote-control'],
            // In order to follow the "Authorization Code Flow" to fetch token after authorizationEndpoint
            // this must be set to false
            usePKCE: false,
            redirectUri: makeRedirectUri({
                native: 'focuscompassapp://spotify-auth',
            }),
        },
        DISCOVERY
    );

    const handlePrompt = async () => {
        if (CLIENT_ID === 'YOUR_SPOTIFY_CLIENT_ID' || !CLIENT_ID) {
            Alert.alert(
                'Spotify Setup Required',
                'Please set your Spotify Client ID in c:/focus-compass-app/services/SpotifyService.ts to use this feature.'
            );
            return;
        }
        return promptAsync();
    };

    return { request, response, promptAsync: handlePrompt };
};

export const searchSpotifyTracks = async (query: string, accessToken: string): Promise<SpotifyTrack[]> => {
    try {
        const result = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const data = await result.json();
        return data.tracks?.items || [];
    } catch (error) {
        console.error('Spotify Search Error:', error);
        return [];
    }
};

export const openSpotifyTrack = (uri: string) => {
    Linking.openURL(uri).catch((err) => {
        console.error('Failed to open Spotify:', err);
        // Fallback or alert user to install Spotify
    });
};
