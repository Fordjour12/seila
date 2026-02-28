import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

export function SettingsHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-3 border-b border-border px-4 py-4">
      <Pressable onPress={() => router.back()} className="px-1 py-1">
        <Text className="text-2xl leading-7 text-muted-foreground">‹</Text>
      </Pressable>
      <View className="flex-1">
        <Text className="text-2xl font-bold text-foreground">{title}</Text>
        {subtitle ? <Text className="text-xs text-muted-foreground">{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function SettingsSectionLabel({ children }: { children: React.ReactNode }) {
  return <Text className="mb-2 text-[11px] uppercase tracking-[0.5px] text-muted-foreground">{children}</Text>;
}

export function SettingsCard({ children }: { children: React.ReactNode }) {
  return <View className="mb-6 overflow-hidden rounded-2xl border border-border bg-surface">{children}</View>;
}

export function SettingsToggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <Pressable
      onPress={onToggle}
      className={`h-7 w-12 rounded-full justify-center ${value ? "bg-accent/35" : "bg-border"}`}
    >
      <View
        className={`h-5 w-5 rounded-full ${value ? "translate-x-6 bg-accent" : "translate-x-1 bg-muted-foreground"}`}
      />
    </Pressable>
  );
}
