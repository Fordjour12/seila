import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useQuery } from "convex/react";

import ConsistencyDetailCard from "../../../components/consistency/ConsistencyDetailCard";
import { taskDayDetailsRef, tasksConsistencyRef } from "../../../lib/productivity-refs";
import { getLocalDayKey } from "../../../lib/date";

type WindowOption = 7 | 30 | 90;

export default function TaskConsistencyScreen() {
  const dayKey = getLocalDayKey();
  const [windowDays, setWindowDays] = React.useState<WindowOption>(30);
  const [selectedDayKey, setSelectedDayKey] = React.useState(dayKey);
  const consistency = useQuery(tasksConsistencyRef, {
    dayKey,
    windowDays,
    trendDays: windowDays,
  });
  const dayDetails = useQuery(taskDayDetailsRef, { dayKey: selectedDayKey });

  const trend = consistency?.trend || [];
  const maxCompleted = Math.max(...trend.map((item) => item.completed), 0);
  const selectedDateLabel = new Date(selectedDayKey).toLocaleDateString();

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <ConsistencyDetailCard
        title="Task Consistency"
        subtitle="Completion rate based on tasks created and completed in window."
        scoreLabel={`${windowDays}-day completion`}
        scoreValue={`${consistency?.completionRatePct ?? 0}%`}
        statLine={`Completed ${consistency?.completedInWindow ?? 0} of ${consistency?.createdInWindow ?? 0} created · Current ${consistency?.currentStreak ?? 0}d · Best ${consistency?.bestStreak ?? 0}d`}
        trend={trend.map((item) => ({
          dayKey: item.dayKey,
          value: maxCompleted > 0 ? item.completed / maxCompleted : 0,
        }))}
        selectedDayKey={selectedDayKey}
        selectedWindow={windowDays}
        onWindowChange={setWindowDays}
        onDayPress={setSelectedDayKey}
      />

      <View className="bg-surface rounded-2xl border border-border p-4 gap-2 shadow-sm">
        <Text className="text-sm font-medium text-foreground">Signals</Text>
        <Text className="text-xs text-muted-foreground">Completed in window: {consistency?.completedInWindow ?? 0}</Text>
        <Text className="text-xs text-muted-foreground">Created in window: {consistency?.createdInWindow ?? 0}</Text>
      </View>

      <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
        <Text className="text-sm font-medium text-foreground">Task Events for {selectedDateLabel}</Text>

        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider">Completed</Text>
          {(dayDetails?.completed || []).length === 0 ? (
            <Text className="text-xs text-muted-foreground">No completed tasks.</Text>
          ) : (
            (dayDetails?.completed || []).map((task) => (
              <View key={`completed:${task.taskId}:${task.at}`} className="rounded-xl border border-border bg-background p-3">
                <Text className="text-sm text-foreground font-medium">{task.title}</Text>
                <Text className="text-xs text-muted-foreground">{new Date(task.at).toLocaleTimeString()}</Text>
              </View>
            ))
          )}
        </View>

        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider">Created</Text>
          {(dayDetails?.created || []).length === 0 ? (
            <Text className="text-xs text-muted-foreground">No created tasks.</Text>
          ) : (
            (dayDetails?.created || []).map((task) => (
              <View key={`created:${task.taskId}:${task.at}`} className="rounded-xl border border-border bg-background p-3">
                <Text className="text-sm text-foreground font-medium">{task.title}</Text>
                <Text className="text-xs text-muted-foreground">{new Date(task.at).toLocaleTimeString()}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}
