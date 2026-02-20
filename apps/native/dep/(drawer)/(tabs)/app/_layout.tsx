/**
 * Life OS — Root Layout
 * Route: app/_layout.tsx
 *
 * Handles:
 *   - Font loading (DM Serif Display + DM Sans)
 *   - Splash screen
 *   - Root stack navigator
 *   - Safe area provider
 */

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import {
  DMSerifDisplay_400Regular,
  DMSerifDisplay_400Regular_Italic,
} from '@expo-google-fonts/dm-serif-display';
import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
} from '@expo-google-fonts/dm-sans';
import { Colors } from '../constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = React.useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          DMSerifDisplay_400Regular,
          DMSerifDisplay_400Regular_Italic,
          DMSans_300Light,
          DMSans_400Regular,
          DMSans_500Medium,
        });
      } catch (e) {
        console.warn('Font load error:', e);
      } finally {
        setFontsLoaded(true);
        await SplashScreen.hideAsync();
      }
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) return <View style={styles.splash} />;

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bg },
          animation: 'slide_from_right',
        }}
      >
        {/* Tab navigator */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Modal screens */}
        <Stack.Screen
          name="hardmode"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="settings/index"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="settings/aicontext"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="settings/eventlog"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="settings/notifications"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="recovery/index"
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
});
