import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";

import ConsistencyDetailCard from "../../../components/consistency/ConsistencyDetailCard";
import { taskConsistencyByIdRef } from "../../../lib/productivity-refs";
import { getLocalDayKey } from "../../../lib/date";

type WindowOption = 7 | 30 | 90;

function formatDate(value?: number) {
  if (!value) return "Not set";
  return new Date(value).toLocaleString();
}

export default function TaskItemConsistencyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const taskId = (id || "") as Id<"tasks">;
  const dayKey = getLocalDayKey();
  const [windowDays, setWindowDays] = React.useState<WindowOption>(30);
  const detail = useQuery(taskConsistencyByIdRef, { taskId, dayKey, windowDays });

  if (detail === null) {
    return (
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
        <Text className="text-2xl font-serif text-foreground">Task not found</Text>
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

  const maxCompleted = Math.max(...detail.trend.map((item) => item.completed), 0);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <ConsistencyDetailCard
        title={detail.title}
        subtitle={`Status: ${detail.status}`}
        scoreLabel={`${windowDays}-day title consistency`}
        scoreValue={`${detail.completionRatePct}%`}
        statLine={`Completed ${detail.completedInWindow}/${detail.createdInWindow} matching tasks · Current ${detail.currentStreak}d · Best ${detail.bestStreak}d`}
        trend={detail.trend.map((item) => ({
          dayKey: item.dayKey,
          value: maxCompleted > 0 ? item.completed / maxCompleted : 0,
        }))}
        selectedWindow={windowDays}
        onWindowChange={setWindowDays}
      />

      <View className="bg-surface rounded-2xl border border-border p-4 gap-2 shadow-sm">
        <Text className="text-sm font-medium text-foreground">Task Timeline</Text>
        <Text className="text-xs text-muted-foreground">Created: {formatDate(detail.createdAt)}</Text>
        <Text className="text-xs text-muted-foreground">Focused: {formatDate(detail.focusedAt)}</Text>
        <Text className="text-xs text-muted-foreground">Deferred Until: {formatDate(detail.deferredUntil)}</Text>
        <Text className="text-xs text-muted-foreground">Completed: {formatDate(detail.completedAt)}</Text>
      </View>
    </ScrollView>
  );
}
