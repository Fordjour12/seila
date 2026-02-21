import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const TABS = [
  { name: "index", label: "Today", icon: "home-outline" },
  { name: "habits/index", label: "Habits", icon: "leaf-outline" },
  { name: "checkin/index", label: "Check-in", icon: "pulse-outline" },
  { name: "tasks/index", label: "Tasks", icon: "checkbox-outline" },
  { name: "finance", label: "Finance", icon: "wallet-outline" },
  { name: "patterns/index", label: "Patterns", icon: "analytics-outline" },
  { name: "review/index", label: "Review", icon: "document-text-outline" },
] as const satisfies ReadonlyArray<{ name: string; label: string; icon: IconName }>;

const TAB_MAP: Record<string, (typeof TABS)[number]> = Object.fromEntries(
  TABS.map((tab) => [tab.name, tab]),
);

function getTabIconName(icon: IconName, isFocused: boolean): IconName {
  if (isFocused && icon.endsWith("-outline")) {
    return icon.replace("-outline", "") as IconName;
  }
  return icon;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => {
        const tab = TAB_MAP[route.name];
        return {
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={getTabIconName(tab?.icon || "ellipse-outline", focused)}
              size={size}
              color={color}
            />
          ),
        };
      }}
    />
  );
}
