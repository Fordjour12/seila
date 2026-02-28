import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";

import ConsistencyDetailCard from "../../../components/consistency/ConsistencyDetailCard";
import { habitConsistencyByIdRef, habitHistoryRef } from "../../../lib/productivity-refs";
import { getLocalDayKey } from "../../../lib/date";

type WindowOption = 7 | 30 | 90;
type HistoryFilter = "all" | "completed" | "skipped" | "snoozed" | "missed" | "relapsed";

function toTitleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function eventTypeLabel(type: string) {
  if (type === "habit.completed") return "Completed";
  if (type === "habit.skipped") return "Skipped";
  if (type === "habit.snoozed") return "Snoozed";
  if (type === "habit.missed") return "Missed";
  if (type === "habit.relapsed") return "Relapsed";
  if (type === "habit.created") return "Created";
  if (type === "habit.updated") return "Updated";
  if (type === "habit.archived") return "Archived";
  return toTitleCase(type.replace("habit.", ""));
}

function eventToneClass(type: string) {
  if (type === "habit.completed") return "text-success bg-success/10 border-success/20";
  if (type === "habit.skipped") return "text-warning bg-warning/10 border-warning/20";
  if (type === "habit.snoozed") return "text-primary bg-primary/10 border-primary/20";
  if (type === "habit.missed" || type === "habit.relapsed") {
    return "text-danger bg-danger/10 border-danger/20";
  }
  return "text-muted-foreground bg-muted/30 border-border";
}

function eventMatchesFilter(type: string, filter: HistoryFilter) {
  if (filter === "all") return true;
  return type === `habit.${filter}`;
}

function payloadSummary(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  if (typeof obj.reason === "string") return obj.reason;
  if (typeof obj.snoozedUntil === "number") {
    return `Until ${new Date(obj.snoozedUntil).toLocaleTimeString()}`;
  }
  if (typeof obj.dayKey === "string") return obj.dayKey;
  return null;
}

function MetricPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "primary" | "danger";
}) {
  const cls =
    tone === "success"
      ? "text-success bg-success/10 border-success/20"
      : tone === "warning"
        ? "text-warning bg-warning/10 border-warning/20"
        : tone === "danger"
          ? "text-danger bg-danger/10 border-danger/20"
          : "text-primary bg-primary/10 border-primary/20";

  return (
    <View className={`rounded-xl border px-3 py-2 gap-1 ${cls}`}>
      <Text className="text-[10px] uppercase font-sans-semibold tracking-[0.4px]">{label}</Text>
      <Text className="text-lg font-sans-bold">{value}</Text>
    </View>
  );
}

export default function HabitItemConsistencyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const habitId = (id || "") as Id<"habits">;
  const dayKey = getLocalDayKey();
  const [windowDays, setWindowDays] = React.useState<WindowOption>(30);
  const [historyFilter, setHistoryFilter] = React.useState<HistoryFilter>("all");
  const detail = useQuery(habitConsistencyByIdRef, { habitId, dayKey, windowDays });
  const history = useQuery(habitHistoryRef, { habitId });

  if (detail === null) {
    return (
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
        <Text className="text-2xl font-serif text-foreground">Habit not found</Text>
      </ScrollView>
    );
  }

  if (detail === undefined) {
    return (
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
        <Text className="text-base text-muted-foreground">Loading...</Text>
      </ScrollView>
    );
  }

  const completionPct =
    detail.scheduledDays > 0
      ? Math.round((detail.completedDays / detail.scheduledDays) * 100)
      : 0;

  const filteredHistory = (history || []).filter((event) =>
    eventMatchesFilter(event.type, historyFilter),
  );

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 pt-4 pb-24 gap-4">
      <ConsistencyDetailCard
        title={detail.name}
        subtitle={`${toTitleCase(detail.kind || "build")} · ${toTitleCase(detail.anchor || "anytime")}`}
        scoreLabel={`${windowDays}-day consistency`}
        scoreValue={`${detail.consistencyPct}%`}
        statLine={`Completed ${detail.completedDays}/${detail.scheduledDays} · Current ${detail.currentStreak}d · Best ${detail.bestStreak}d`}
        trend={detail.trend.map((item) => ({ dayKey: item.dayKey, value: item.score }))}
        selectedWindow={windowDays}
        onWindowChange={setWindowDays}
      />

      <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
        <Text className="text-sm font-sans-semibold text-foreground">Status Composition</Text>
        <Text className="text-xs font-sans-medium text-muted-foreground">
          Completion {completionPct}% of scheduled days in this window.
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <MetricPill label="Completed" value={detail.completedDays} tone="success" />
          <MetricPill label="Skipped" value={detail.skippedDays} tone="warning" />
          <MetricPill label="Snoozed" value={detail.snoozedDays} tone="primary" />
          <MetricPill label="Missed" value={detail.missedDays} tone="danger" />
          <MetricPill label="Relapsed" value={detail.relapsedDays} tone="danger" />
        </View>
      </View>

      <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-sans-semibold text-foreground">History</Text>
          <Text className="text-xs font-sans-medium text-muted-foreground">
            {filteredHistory.length} events
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {([
            { id: "all", label: "All" },
            { id: "completed", label: "Done" },
            { id: "skipped", label: "Skip" },
            { id: "snoozed", label: "Snooze" },
            { id: "missed", label: "Missed" },
            { id: "relapsed", label: "Relapse" },
          ] as const).map((option) => {
            const active = historyFilter === option.id;
            return (
              <Pressable
                key={option.id}
                className={`rounded-full border px-3 py-1.5 ${
                  active ? "bg-primary/10 border-primary/30" : "bg-background border-border"
                }`}
                onPress={() => setHistoryFilter(option.id)}
              >
                <Text
                  className={`text-[11px] font-sans-semibold ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {filteredHistory.length === 0 ? (
          <Text className="text-xs text-muted-foreground font-sans-medium">
            No history for this filter.
          </Text>
        ) : (
          filteredHistory.slice(0, 12).map((event, index) => (
            <View
              key={`${event.type}:${event.occurredAt}:${index}`}
              className="rounded-xl border border-border bg-background p-3 gap-2"
            >
              <View className="flex-row items-center justify-between gap-2">
                <View className={`rounded-full border px-2.5 py-1 ${eventToneClass(event.type)}`}>
                  <Text className="text-[10px] uppercase font-sans-bold">
                    {eventTypeLabel(event.type)}
                  </Text>
                </View>
                <Text className="text-xs text-muted-foreground font-sans-medium">
                  {new Date(event.occurredAt).toLocaleString()}
                </Text>
              </View>
              {payloadSummary(event.payload) ? (
                <Text className="text-xs text-muted-foreground font-sans-medium">
                  {payloadSummary(event.payload)}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
