import React from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import {
  habitLifecycleRef,
  restoreArchivedHabitRef,
  resumePausedHabitRef,
} from "../../../lib/productivity-refs";
import { getLocalDayKey } from "../../../lib/date";

export default function ManageHabitsScreen() {
  const dayKey = getLocalDayKey();
  const { toast } = useToast();
  const lifecycle = useQuery(habitLifecycleRef, { dayKey });
  const resumePausedHabit = useMutation(resumePausedHabitRef);
  const restoreArchivedHabit = useMutation(restoreArchivedHabitRef);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Manage Habits</Text>
        <Text className="text-sm text-muted-foreground mt-1">Resume paused habits or restore archived ones.</Text>
      </View>

      <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
        <Text className="text-sm font-medium text-foreground">Paused</Text>
        {(lifecycle?.paused || []).length === 0 ? (
          <Text className="text-xs text-muted-foreground">No paused habits.</Text>
        ) : (
          (lifecycle?.paused || []).map((habit) => (
            <View key={habit.habitId} className="rounded-xl border border-border bg-background p-3 gap-2">
              <Text className="text-sm text-foreground font-medium">{habit.name}</Text>
              <Text className="text-xs text-muted-foreground">Until {habit.pausedUntilDayKey}</Text>
              <Pressable
                className="self-start bg-primary/10 border border-primary/20 rounded-lg px-3 py-2"
                onPress={async () => {
                  try {
                    await resumePausedHabit({
                      idempotencyKey: `habits.resume.manage:${habit.habitId}:${Date.now()}`,
                      habitId: habit.habitId,
                    });
                    toast.show({ variant: "success", label: "Habit resumed" });
                  } catch {
                    toast.show({ variant: "danger", label: "Failed to resume habit" });
                  }
                }}
              >
                <Text className="text-xs font-medium text-primary">Resume</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>

      <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
        <Text className="text-sm font-medium text-foreground">Archived</Text>
        {(lifecycle?.archived || []).length === 0 ? (
          <Text className="text-xs text-muted-foreground">No archived habits.</Text>
        ) : (
          (lifecycle?.archived || []).map((habit) => (
            <View key={habit.habitId} className="rounded-xl border border-border bg-background p-3 gap-2">
              <Text className="text-sm text-foreground font-medium">{habit.name}</Text>
              <Pressable
                className="self-start bg-warning/10 border border-warning/20 rounded-lg px-3 py-2"
                onPress={async () => {
                  try {
                    await restoreArchivedHabit({
                      idempotencyKey: `habits.restore.manage:${habit.habitId}:${Date.now()}`,
                      habitId: habit.habitId,
                    });
                    toast.show({ variant: "success", label: "Habit restored as new" });
                  } catch {
                    toast.show({ variant: "danger", label: "Failed to restore habit" });
                  }
                }}
              >
                <Text className="text-xs font-medium text-warning">Restore as New</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
