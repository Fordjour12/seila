import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";

import ConsistencyDetailCard from "../../../components/consistency/ConsistencyDetailCard";
import { habitConsistencyByIdRef, habitHistoryRef } from "../../../lib/productivity-refs";
import { getLocalDayKey } from "../../../lib/date";

type WindowOption = 7 | 30 | 90;

function toTitleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function HabitItemConsistencyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const habitId = (id || "") as Id<"habits">;
  const dayKey = getLocalDayKey();
  const [windowDays, setWindowDays] = React.useState<WindowOption>(30);
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

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
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

      <View className="bg-surface rounded-2xl border border-border p-4 gap-2 shadow-sm">
        <Text className="text-sm font-medium text-foreground">Status Breakdown</Text>
        <Text className="text-xs text-muted-foreground">Completed: {detail.completedDays}</Text>
        <Text className="text-xs text-muted-foreground">Skipped: {detail.skippedDays}</Text>
        <Text className="text-xs text-muted-foreground">Snoozed: {detail.snoozedDays}</Text>
        <Text className="text-xs text-muted-foreground">Missed: {detail.missedDays}</Text>
        <Text className="text-xs text-muted-foreground">Relapsed: {detail.relapsedDays}</Text>
      </View>

      <View className="bg-surface rounded-2xl border border-border p-4 gap-2 shadow-sm">
        <Text className="text-sm font-medium text-foreground">History</Text>
        {(history || []).length === 0 ? (
          <Text className="text-xs text-muted-foreground">No history available.</Text>
        ) : (
          (history || []).slice(0, 8).map((event, index) => (
            <View key={`${event.type}:${event.occurredAt}:${index}`} className="rounded-xl border border-border bg-background p-3">
              <Text className="text-sm text-foreground">{event.type}</Text>
              <Text className="text-xs text-muted-foreground">{new Date(event.occurredAt).toLocaleString()}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
