import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useModeThemeColors } from "@/lib/theme";
import {
  SettingsCard,
  SettingsHeader,
  SettingsSectionLabel,
  SettingsToggle,
} from "./_components/SettingsUI";

interface ModuleNotifConfig {
  id: string;
  icon: string;
  label: string;
  description: string;
  enabled: boolean;
  exampleCopy: string;
}

const MODULES: ModuleNotifConfig[] = [
  {
    id: "checkin",
    icon: "○",
    label: "Check-in",
    description: "Daily prompt to log mood and energy",
    enabled: true,
    exampleCopy: "How are you doing today?",
  },
  {
    id: "habits",
    icon: "◇",
    label: "Habits",
    description: "Gentle reminder if morning anchor approaches",
    enabled: true,
    exampleCopy: "Morning walk is still open.",
  },
  {
    id: "finance",
    icon: "◈",
    label: "Finance",
    description: "Import inbox when new transactions arrive",
    enabled: false,
    exampleCopy: "3 transactions waiting in your inbox.",
  },
  {
    id: "review",
    icon: "▷",
    label: "Weekly review",
    description: "Sunday reminder to close the week",
    enabled: true,
    exampleCopy: "Ready to close the week when you are.",
  },
  {
    id: "patterns",
    icon: "⋮",
    label: "Patterns",
    description: "When a new pattern is detected",
    enabled: false,
    exampleCopy: "The AI noticed something worth seeing.",
  },
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 === 0 ? 12 : i % 12;
  const ampm = i < 12 ? "AM" : "PM";
  return { value: i, label: `${h}:00 ${ampm}` };
});

function TimePicker({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  const slots = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

  return (
    <View className="gap-3">
      <Text className="text-[11px] uppercase tracking-[0.5px] text-muted-foreground">{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-0.5 py-0.5">
        {slots.map((hour) => {
          const hDisplay = hour > 12 ? hour - 12 : hour;
          const ampm = hour < 12 ? "AM" : "PM";
          const isSelected = value === hour;

          return (
            <Pressable
              key={hour}
              onPress={() => onChange(hour)}
              className={`rounded-full border px-3 py-2 ${
                isSelected
                  ? "border-accent/40 bg-accent/15"
                  : "border-border bg-default"
              }`}
            >
              <Text className={`text-xs font-medium ${isSelected ? "text-accent" : "text-muted-foreground"}`}>
                {hDisplay}
                {ampm}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function ModuleNotifRow({
  config,
  onToggle,
}: {
  config: ModuleNotifConfig;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View className="border-b border-border last:border-b-0">
      <Pressable
        onPress={() => config.enabled && setExpanded((prev) => !prev)}
        className="flex-row items-center gap-3 px-4 py-4 active:bg-default"
      >
        <View className="h-8 w-8 items-center justify-center rounded-md border border-border bg-default">
          <Text className="text-xs text-muted-foreground">{config.icon}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-[15px] text-foreground">{config.label}</Text>
          <Text className="text-xs text-muted-foreground">{config.description}</Text>
        </View>
        <SettingsToggle value={config.enabled} onToggle={onToggle} />
      </Pressable>

      {config.enabled && expanded ? (
        <View className="ml-[60px] gap-1 px-4 pb-4">
          <Text className="text-[11px] uppercase tracking-[0.5px] text-muted-foreground">Example copy</Text>
          <Text className="text-sm italic text-foreground/80">"{config.exampleCopy}"</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function NotificationsScreen() {
  const [modules, setModules] = useState(MODULES);
  const [quietStart, setQuietStart] = useState(22);
  const [quietEnd, setQuietEnd] = useState(8);
  const [quietEnabled, setQuietEnabled] = useState(true);
  const colors = useModeThemeColors();

  const toggleModule = (id: string) => {
    setModules((prev) => prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <SettingsHeader title="Notifications" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6 rounded-xl border border-accent/35 bg-accent/10 p-4">
          <Text className="text-sm italic leading-5 text-foreground/80">
            All notifications follow the tone policy. No urgency language, no streak pressure, no
            guilt.
          </Text>
        </View>

        <SettingsSectionLabel>By module</SettingsSectionLabel>
        <SettingsCard>
          {modules.map((module) => (
            <ModuleNotifRow key={module.id} config={module} onToggle={() => toggleModule(module.id)} />
          ))}
        </SettingsCard>

        <SettingsSectionLabel>Quiet hours</SettingsSectionLabel>
        <SettingsCard>
          <View className="flex-row items-center justify-between gap-3 p-4">
            <View className="flex-1">
              <Text className="text-[15px] text-foreground">Enable quiet hours</Text>
              <Text className="text-xs text-muted-foreground">No notifications during this window</Text>
            </View>
            <SettingsToggle value={quietEnabled} onToggle={() => setQuietEnabled((prev) => !prev)} />
          </View>

          {quietEnabled ? (
            <>
              <View className="h-px bg-border" />
              <View className="gap-5 p-4">
                <TimePicker value={quietStart} onChange={setQuietStart} label="Start (evening)" />
                <TimePicker value={quietEnd} onChange={setQuietEnd} label="End (morning)" />
              </View>
              <Text className="pb-4 text-center text-xs italic text-muted-foreground">
                No notifications from {HOURS[quietStart]?.label ?? "-"} to {HOURS[quietEnd]?.label ?? "-"}
              </Text>
            </>
          ) : null}
        </SettingsCard>

        <SettingsSectionLabel>Preferred window</SettingsSectionLabel>
        <SettingsCard>
          <View className="p-4">
            <Text className="text-sm leading-5 text-foreground/80">
              Prefer notifications in the morning or afternoon? The system avoids sending check-in
              reminders after your quiet hours begin.
            </Text>
          </View>
          <View className="h-px bg-border" />
          <View className="p-4">
            <TimePicker value={9} onChange={() => {}} label="Earliest delivery time" />
          </View>
        </SettingsCard>

        <View className="h-12" />
      </ScrollView>
    </SafeAreaView>
  );
}
