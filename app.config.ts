import type { ConfigContext, ExpoConfig } from '@expo/config';
import 'dotenv/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: 'focus-compass-app',
    slug: 'focus-compass-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'focuscompassapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: false,
    ios: {
      ...config.ios,
      supportsTablet: true,
    },
    android: {
      ...config.android,
      package: 'com.albert7463.focuscompassapp',
      // Required for timelapse video recording with audio
      permissions: ['RECORD_AUDIO'],
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      ...config.web,
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-web-browser',
      [
        'expo-camera',
        {
          cameraPermission: 'Allow $(PRODUCT_NAME) to access your camera for timelapse recording.',
          microphonePermission: 'Allow $(PRODUCT_NAME) to access your microphone for video recording.',
          recordAudioAndroid: true,
        },
      ],
      [
        'expo-media-library',
        {
          photosPermission: 'Allow $(PRODUCT_NAME) to access your photos to save timelapse videos.',
          savePhotosPermission: 'Allow $(PRODUCT_NAME) to save timelapse videos to your gallery.',
          isAccessMediaLocationEnabled: true,
        },
      ],
      [
        'expo-av',
        {
          microphonePermission: 'Allow $(PRODUCT_NAME) to access your microphone.',
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
    ],
    experiments: {
      ...config.experiments,
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      ...config.extra,
      eas: {
        projectId: '2e345126-2e57-42c4-89f7-96aa140320ba',
      },
      SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
      SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
  };
};
