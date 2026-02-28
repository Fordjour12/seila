import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useModeThemeColors } from "@/lib/theme";
import { SettingsCard, SettingsHeader } from "./_components/SettingsUI";

type EventModule =
  | "habits"
  | "checkin"
  | "tasks"
  | "finance"
  | "patterns"
  | "hardMode"
  | "weeklyReview"
  | "capture"
  | "system";

interface EventEntry {
  id: string;
  type: string;
  module: EventModule;
  occurredAt: number;
  payload: Record<string, unknown>;
}

const MOCK_EVENTS: EventEntry[] = [
  {
    id: "1",
    type: "habit.logged",
    module: "habits",
    occurredAt: Date.now() - 1000 * 60 * 30,
    payload: { habitId: "morning-walk", name: "Morning walk" },
  },
  {
    id: "2",
    type: "checkin.daily.submitted",
    module: "checkin",
    occurredAt: Date.now() - 1000 * 60 * 90,
    payload: { mood: 3, energy: 4, flags: ["focused"] },
  },
  {
    id: "3",
    type: "task.completed",
    module: "tasks",
    occurredAt: Date.now() - 1000 * 60 * 120,
    payload: { taskId: "t1", text: "Reply to Dr. Osei email" },
  },
  {
    id: "4",
    type: "hardmode.itemFlagged",
    module: "hardMode",
    occurredAt: Date.now() - 1000 * 60 * 180,
    payload: { itemId: "plan-3", reason: "not_now" },
  },
  {
    id: "5",
    type: "finance.transaction.confirmed",
    module: "finance",
    occurredAt: Date.now() - 1000 * 60 * 240,
    payload: { merchant: "Whole Foods", amount: -67.4 },
  },
  {
    id: "6",
    type: "pattern.dismissed",
    module: "patterns",
    occurredAt: Date.now() - 1000 * 60 * 60 * 5,
    payload: { patternId: "p2" },
  },
  {
    id: "7",
    type: "habit.skipped",
    module: "habits",
    occurredAt: Date.now() - 1000 * 60 * 60 * 6,
    payload: { habitId: "meditation", name: "Meditation" },
  },
  {
    id: "8",
    type: "hardmode.activated",
    module: "hardMode",
    occurredAt: Date.now() - 1000 * 60 * 60 * 7,
    payload: { duration: "1d", modules: ["habits", "tasks"] },
  },
  {
    id: "9",
    type: "checkin.weekly.submitted",
    module: "checkin",
    occurredAt: Date.now() - 1000 * 60 * 60 * 48,
    payload: { mood: 4, energy: 3, reflections: 3 },
  },
  {
    id: "10",
    type: "finance.account.added",
    module: "finance",
    occurredAt: Date.now() - 1000 * 60 * 60 * 72,
    payload: { name: "Marcus Savings", type: "savings" },
  },
  {
    id: "11",
    type: "review.completed",
    module: "weeklyReview",
    occurredAt: Date.now() - 1000 * 60 * 60 * 96,
    payload: { intentions: 2 },
  },
  {
    id: "12",
    type: "aiContext.cleared",
    module: "system",
    occurredAt: Date.now() - 1000 * 60 * 60 * 120,
    payload: {},
  },
];

const ALL_MODULES: Array<{ id: EventModule | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "habits", label: "Habits" },
  { id: "checkin", label: "Check-in" },
  { id: "tasks", label: "Tasks" },
  { id: "finance", label: "Finance" },
  { id: "hardMode", label: "Hard Mode" },
  { id: "weeklyReview", label: "Review" },
  { id: "system", label: "System" },
];

function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatPayload(payload: Record<string, unknown>): string {
  const keys = Object.keys(payload);
  if (keys.length === 0) return "";
  return keys
    .filter((key) => payload[key] !== undefined && payload[key] !== null)
    .map((key) => `${key}: ${JSON.stringify(payload[key])}`)
    .join(" · ");
}

function EventRow({
  event,
  isLast,
  color,
}: {
  event: EventEntry;
  isLast: boolean;
  color: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const payloadStr = formatPayload(event.payload);

  return (
    <Pressable
      onPress={() => {
        if (payloadStr) setExpanded((prev) => !prev);
      }}
      className={`flex-row gap-3 px-4 py-3 ${!isLast ? "border-b border-border" : ""}`}
    >
      <View className="mt-1.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-start justify-between gap-2">
          <Text className="flex-1 text-sm font-medium text-foreground">{event.type}</Text>
          <Text className="text-xs text-muted-foreground">{timeAgo(event.occurredAt)}</Text>
        </View>
        <Text className="text-[11px] uppercase tracking-[0.5px] text-muted-foreground">{event.module}</Text>
        {expanded && payloadStr ? <Text className="mt-1 text-xs text-foreground/80">{payloadStr}</Text> : null}
      </View>
    </Pressable>
  );
}

export default function EventLogScreen() {
  const [filter, setFilter] = useState<EventModule | "all">("all");
  const colors = useModeThemeColors();

  const moduleColorMap: Record<EventModule, string> = {
    habits: colors.success,
    checkin: colors.warning,
    tasks: colors.mutedForeground,
    finance: colors.warning,
    patterns: colors.mutedForeground,
    hardMode: colors.danger,
    weeklyReview: colors.success,
    capture: colors.mutedForeground,
    system: colors.mutedForeground,
  };

  const filtered = useMemo(
    () => (filter === "all" ? MOCK_EVENTS : MOCK_EVENTS.filter((item) => item.module === filter)),
    [filter],
  );

  const handleExport = async () => {
    const json = JSON.stringify(MOCK_EVENTS, null, 2);
    await Share.share({
      message: json,
      title: "Life OS — Event Log Export",
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <SettingsHeader
        title="Event log"
        subtitle={`${MOCK_EVENTS.length} events recorded`}
        right={
          <Pressable onPress={handleExport} className="rounded-md border border-border px-3 py-2">
            <Text className="text-xs font-medium text-foreground/80">Export</Text>
          </Pressable>
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border, flexGrow: 0 }}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 24, paddingVertical: 12 }}
      >
        {ALL_MODULES.map((module) => {
          const isActive = filter === module.id;
          return (
            <Pressable
              key={module.id}
              onPress={() => setFilter(module.id as EventModule | "all")}
              className={`rounded-full border px-3 py-2 ${
                isActive ? "border-accent/40 bg-accent/15" : "border-border bg-surface"
              }`}
            >
              <Text className={`text-xs font-medium ${isActive ? "text-accent" : "text-muted-foreground"}`}>
                {module.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 24, paddingVertical: 24 }}>
          <SettingsCard>
            {filtered.length === 0 ? (
              <View className="items-center p-6">
                <Text className="text-sm text-muted-foreground">No events for this module</Text>
              </View>
            ) : (
              filtered.map((event, index) => (
                <EventRow
                  key={event.id}
                  event={event}
                  isLast={index === filtered.length - 1}
                  color={moduleColorMap[event.module]}
                />
              ))
            )}
          </SettingsCard>

          <Text className="text-center text-xs italic leading-5 text-muted-foreground">
            Tap any event to expand its payload. This log is the source of truth for the entire
            system. Raw events are never edited or deleted.
          </Text>

          <View className="h-12" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
