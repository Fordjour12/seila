import { Ionicons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";
import React, { useCallback } from "react";
import { Text } from "react-native";

import { ThemeToggle } from "@/components/theme-toggle";
import { useSafeThemeColor } from "@/lib/safe-theme-color";

function DrawerLayout() {
  const themeColorForeground = useSafeThemeColor("foreground", "#111827");
  const themeColorBackground = useSafeThemeColor("background", "#F7F6F2");

  const renderThemeToggle = useCallback(() => <ThemeToggle />, []);

  return (
    <Drawer
      screenOptions={{
        headerTintColor: themeColorForeground,
        headerStyle: { backgroundColor: themeColorBackground },
        headerTitleStyle: {
          fontWeight: "600",
          color: themeColorForeground,
        },
        headerRight: renderThemeToggle,
        drawerStyle: { backgroundColor: themeColorBackground },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          headerTitle: "Home",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : themeColorForeground }}>Home</Text>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={focused ? color : themeColorForeground}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="finance"
        options={{
          headerTitle: "Finance",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : themeColorForeground }}>Finance</Text>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="wallet-outline"
              size={size}
              color={focused ? color : themeColorForeground}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="patterns"
        options={{
          headerTitle: "Patterns",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : themeColorForeground }}>Patterns</Text>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="analytics-outline"
              size={size}
              color={focused ? color : themeColorForeground}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="hard-mode"
        options={{
          headerTitle: "Hard Mode",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : themeColorForeground }}>Hard Mode</Text>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="shield-outline"
              size={size}
              color={focused ? color : themeColorForeground}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="recovery-context"
        options={{
          headerTitle: "Recovery Context",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : themeColorForeground }}>Recovery Context</Text>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="document-text-outline"
              size={size}
              color={focused ? color : themeColorForeground}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="ai-memory"
        options={{
          headerTitle: "AI Memory",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : themeColorForeground }}>AI Memory</Text>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="sparkles-outline"
              size={size}
              color={focused ? color : themeColorForeground}
            />
          ),
        }}
      />
    </Drawer>
  );
}

export default DrawerLayout;
