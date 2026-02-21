import "@/global.css";
import React from "react";
import { Stack } from "expo-router";

import { HeroUINativeProvider, type HeroUINativeConfig } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
// import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { env } from "@seila/env/native";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(env.EXPO_PUBLIC_CONVEX_URL, {
  unsavedChangesWarning: false,
});

const config: HeroUINativeConfig = {
  // Global text configuration
  textProps: {
    minimumFontScale: 0.5,
    maxFontSizeMultiplier: 1.5,
    allowFontScaling: true,
    adjustsFontSizeToFit: false,
  },
  // Global animation configuration
  // Developer information messages configuration
  devInfo: {
    stylingPrinciples: true, // Optional: disable styling principles message
  },
  // Global toast configuration
  // Option 1: Configure toast with custom settings
  toast: {
    defaultProps: {
      variant: "default",
      placement: "top",
    },
    insets: {
      top: 0,
      bottom: 6,
      left: 12,
      right: 12,
    },
    maxVisibleToasts: 3,
  },
  // Option 2: Disable toast entirely
  // toast: false,
  // or
  // toast: 'disabled',
};

export default function AppRoot() {
  return (
    <ConvexProvider client={convex}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <HeroUINativeProvider config={config}>
          <RootLayout />
        </HeroUINativeProvider>
      </GestureHandlerRootView>
    </ConvexProvider>
  );
}

function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      {/* Tab navigator */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      <Stack.Screen
        name="recovery"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />

      {/* Modal screens */}
      <Stack.Screen
        name="hardmode"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}
