import "@/global.css";
import React, { useCallback } from "react";
import { Stack } from "expo-router";

import { AppThemeProvider } from "@/contexts/app-theme-context";
import { HeroUINativeProvider, type HeroUINativeConfig } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
// import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { env } from "@seila/env/native";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { KeyboardAvoidingView, KeyboardProvider } from "react-native-keyboard-controller";

const convex = new ConvexReactClient(env.EXPO_PUBLIC_CONVEX_URL, {
   unsavedChangesWarning: false,
});

export default function AppRoot() {

   const contentWrapper = useCallback(
      (children: React.ReactNode) => (
         <KeyboardAvoidingView
            pointerEvents="box-none"
            behavior="padding"
            keyboardVerticalOffset={12}
            className="flex-1"
         >
            {children}
         </KeyboardAvoidingView>
      ),
      []
   );

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
      toast: {
         contentWrapper,
         defaultProps: {
            variant: "default",
            placement: "bottom",
         },
         insets: {
            top: 20,
            bottom: 20,
            left: 20,
            right: 20,

         },
         maxVisibleToasts: 3,
      },
   };


   return (
      <ConvexProvider client={convex}>
         <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
               <AppThemeProvider>
                  <HeroUINativeProvider config={config}>
                     <RootLayout />
                  </HeroUINativeProvider>
               </AppThemeProvider>
            </KeyboardProvider>
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
