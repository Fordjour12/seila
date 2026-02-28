import { router } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useModeThemeColors } from "@/lib/theme";
import {
  SettingsCard,
  SettingsHeader,
  SettingsSectionLabel,
  SettingsToggle,
} from "./_components/SettingsUI";

const SETTINGS_AVATAR_SOURCE = require("../../../assets/bba8b6ac6c886a26604e0b8f74964127.jpg");

function SettingsRow({
  icon,
  label,
  sublabel,
  onPress,
  chevron = true,
  danger = false,
  right,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  chevron?: boolean;
  danger?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center gap-3 px-4 py-4 active:bg-default"
    >
      <View className="h-8 w-8 items-center justify-center rounded-md border border-border bg-default">
        <Text className="text-xs text-muted-foreground">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text
          className={`text-[15px] ${danger ? "text-danger" : "text-foreground"}`}
        >
          {label}
        </Text>
        {sublabel ? (
          <Text className="text-xs text-muted-foreground">{sublabel}</Text>
        ) : null}
      </View>
      {right ??
        (chevron && onPress ? (
          <Text className="text-xl text-muted-foreground">›</Text>
        ) : null)}
    </Pressable>
  );
}

function Divider() {
  return <View className="ml-14 h-px bg-border" />;
}

export default function SettingsScreen() {
  const [hardModeExitConfirm, setHardModeExitConfirm] = useState(false);
  const [captureAutoSend, setCaptureAutoSend] = useState(false);
  const colors = useModeThemeColors();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <SettingsHeader title="Settings" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6 items-center gap-3 rounded-2xl border border-border bg-surface p-5">
          <View className="h-20 w-20 items-center justify-center rounded-full border-2 border-accent/60 bg-default p-0.5">
            <Image
              source={SETTINGS_AVATAR_SOURCE}
              className="h-full w-full rounded-full"
              resizeMode="cover"
            />
          </View>
          <Text className="text-lg font-semibold text-foreground">Your Profile</Text>
          <Text className="text-xs text-muted-foreground">Settings and preferences</Text>
        </View>

        <SettingsSectionLabel>AI & Memory</SettingsSectionLabel>
        <SettingsCard>
          <SettingsRow
            icon="◎"
            label="What the AI knows"
            sublabel="View your working model and memory"
            onPress={() => router.push("/(tabs)/settings/aicontext")}
          />
          <Divider />
          <SettingsRow
            icon="◇"
            label="Conversational capture"
            sublabel="Auto-submit on return key"
            chevron={false}
            right={
              <SettingsToggle
                value={captureAutoSend}
                onToggle={() => setCaptureAutoSend((prev) => !prev)}
              />
            }
          />
        </SettingsCard>

        <SettingsSectionLabel>Notifications</SettingsSectionLabel>
        <SettingsCard>
          <SettingsRow
            icon="○"
            label="Notification settings"
            sublabel="Per-module, quiet hours, tone"
            onPress={() => router.push("/(tabs)/settings/notifications")}
          />
        </SettingsCard>

        <SettingsSectionLabel>Hard Mode</SettingsSectionLabel>
        <SettingsCard>
          <SettingsRow
            icon="□"
            label="Exit requires confirmation"
            sublabel="Off by default — exit is always one tap"
            chevron={false}
            right={
              <SettingsToggle
                value={hardModeExitConfirm}
                onToggle={() => setHardModeExitConfirm((prev) => !prev)}
              />
            }
          />
          <Divider />
          <SettingsRow
            icon="◈"
            label="Max items per plan"
            sublabel="Currently: AI decides (recommended)"
            onPress={() => {}}
          />
        </SettingsCard>

        <SettingsSectionLabel>Data & Log</SettingsSectionLabel>
        <SettingsCard>
          <SettingsRow
            icon="▷"
            label="Event log"
            sublabel="Every action this system has taken"
            onPress={() => router.push("/(tabs)/settings/eventlog")}
          />
          <Divider />
          <SettingsRow
            icon="◆"
            label="Export all data"
            sublabel="Full event log as JSON"
            onPress={() => {}}
          />
        </SettingsCard>

        <SettingsSectionLabel>Tone Policy</SettingsSectionLabel>
        <SettingsCard>
          <View className="gap-3 p-4">
            <Text className="text-base font-semibold text-foreground">
              Active rules
            </Text>
            {[
              "Never use: fail, missed, behind, should, need to, streak",
              "Never frame absence of action negatively",
              "Suggestions: max 3 at a time, one module at a time",
              "Silence preferred when confidence is low",
            ].map((rule) => (
              <View key={rule} className="flex-row items-start gap-2">
                <View className="mt-2 h-1 w-1 rounded-full bg-muted-foreground" />
                <Text className="flex-1 text-sm leading-5 text-foreground/80">
                  {rule}
                </Text>
              </View>
            ))}
            <Text className="text-xs italic text-muted-foreground">
              These rules apply to all AI output. They cannot be disabled.
            </Text>
          </View>
        </SettingsCard>

        <SettingsSectionLabel>Reset</SettingsSectionLabel>
        <SettingsCard>
          <SettingsRow
            icon="×"
            label="Clear AI memory"
            sublabel="Resets the working model. Cannot be undone."
            danger
            onPress={() => {}}
          />
          <Divider />
          <SettingsRow
            icon="×"
            label="Reset all data"
            sublabel="Wipes the entire event log. Cannot be undone."
            danger
            onPress={() => {}}
          />
        </SettingsCard>

        <Text className="mb-4 text-center text-xs text-muted-foreground">
          Life OS · v0.1.0 · Personal build
        </Text>

        <View className="h-12" />
      </ScrollView>
    </SafeAreaView>
  );
}
