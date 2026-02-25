import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useQuery } from "convex/react";

import ConsistencyDetailCard from "../../../components/consistency/ConsistencyDetailCard";
import { habitDayDetailsRef, habitsConsistencyRef } from "../../../lib/productivity-refs";
import { getLocalDayKey } from "../../../lib/date";

type WindowOption = 7 | 30 | 90;

export default function HabitConsistencyScreen() {
  const dayKey = getLocalDayKey();
  const [windowDays, setWindowDays] = React.useState<WindowOption>(30);
  const [selectedDayKey, setSelectedDayKey] = React.useState(dayKey);
  const consistency = useQuery(habitsConsistencyRef, {
    dayKey,
    windowDays,
    trendDays: windowDays,
  });
  const dayDetails = useQuery(habitDayDetailsRef, { dayKey: selectedDayKey });

  const selectedDateLabel = new Date(selectedDayKey).toLocaleDateString();

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <ConsistencyDetailCard
        title="Habit Consistency"
        subtitle="Scheduled days only. Paused and out-of-range days are excluded."
        scoreLabel={`${windowDays}-day consistency`}
        scoreValue={`${consistency?.consistencyPct ?? 0}%`}
        statLine={`Completed ${consistency?.completedScheduledDays ?? 0} of ${consistency?.scheduledDays ?? 0} scheduled · Current ${consistency?.currentStreak ?? 0}d · Best ${consistency?.bestStreak ?? 0}d`}
        trend={(consistency?.trend || []).map((item) => ({
          dayKey: item.dayKey,
          value: item.score,
        }))}
        selectedDayKey={selectedDayKey}
        selectedWindow={windowDays}
        onWindowChange={setWindowDays}
        onDayPress={setSelectedDayKey}
      />

      <View className="bg-surface rounded-2xl border border-border p-4 gap-2 shadow-sm">
        <Text className="text-sm font-medium text-foreground">Signals</Text>
        <Text className="text-xs text-muted-foreground">Missed in last 14 days: {consistency?.missedLast14 ?? 0}</Text>
        <Text className="text-xs text-muted-foreground">Active habits today: {consistency?.activeHabits ?? 0}</Text>
      </View>

      <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
        <Text className="text-sm font-medium text-foreground">Logs for {selectedDateLabel}</Text>
        {(dayDetails?.logs || []).length === 0 ? (
          <Text className="text-xs text-muted-foreground">No logged habit actions for this day.</Text>
        ) : (
          (dayDetails?.logs || []).map((log) => (
            <View key={`${log.habitId}:${log.occurredAt}`} className="rounded-xl border border-border bg-background p-3">
              <Text className="text-sm text-foreground font-medium">{log.name}</Text>
              <Text className="text-xs text-muted-foreground">
                {log.status} at {new Date(log.occurredAt).toLocaleTimeString()}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
