import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import {
  archiveHabitRef,
  clearHabitTodayStatusRef,
  habitLifecycleRef,
  habitsConsistencyRef,
  habitStalePromptsRef,
  logHabitRef,
  relapseHabitRef,
  resolveMissedHabitsRef,
  respondStaleHabitPromptRef,
  restoreArchivedHabitRef,
  resumePausedHabitRef,
  skipHabitRef,
  snoozeHabitRef,
  todayHabitsRef,
  type HabitCadence,
} from "../../../lib/productivity-refs";
import { Button, SectionLabel } from "../../../components/ui";
import { getLocalDayKey } from "../../../lib/date";

const ANCHOR_ORDER = ["morning", "afternoon", "evening", "anytime"] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

function toTitleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toDayKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function buildWeekDays(centerDate: Date) {
  const center = startOfDay(centerDate);
  const weekday = center.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const monday = new Date(center.getTime() + mondayOffset * DAY_MS);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday.getTime() + index * DAY_MS);
    return {
      key: toDayKey(date),
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      dayNumber: date.getDate(),
      date,
    };
  });
}

function formatCadence(cadence: HabitCadence) {
  if (cadence === "daily" || cadence === "weekdays") {
    return toTitleCase(cadence);
  }

  const map = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return cadence.customDays.map((day) => map[day] || "?").join(", ");
}

function formatStatus(status?: "completed" | "skipped" | "snoozed" | "missed" | "relapsed") {
  if (status === "completed") return "Done Today";
  if (status === "skipped") return "Skipped Today";
  if (status === "snoozed") return "Snoozed Today";
  if (status === "missed") return "Missed";
  if (status === "relapsed") return "Relapsed";
  return "Pending";
}

function HeatDots({
  values,
}: {
  values: number[];
}) {
  return (
    <View className="flex-row gap-1">
      {values.map((value, index) => {
        const shade =
          value >= 0.95
            ? "bg-success"
            : value >= 0.5
              ? "bg-warning"
              : value > 0
                ? "bg-warning/40"
                : "bg-muted";
        return <View key={index} className={`h-2.5 flex-1 rounded-full ${shade}`} />;
      })}
    </View>
  );
}

export default function HabitsScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const localTodayKey = getLocalDayKey();
  const [selectedDayKey, setSelectedDayKey] = React.useState(localTodayKey);
  const dayKey = selectedDayKey;
  const isTodayView = selectedDayKey === localTodayKey;
  const weekDays = React.useMemo(() => buildWeekDays(new Date()), []);

  const habits = useQuery(todayHabitsRef, { dayKey });
  const consistency = useQuery(habitsConsistencyRef, { dayKey, windowDays: 30, trendDays: 14 });
  const lifecycle = useQuery(habitLifecycleRef, { dayKey });
  const stalePrompts = useQuery(habitStalePromptsRef, { dayKey });
  const logHabit = useMutation(logHabitRef);
  const skipHabit = useMutation(skipHabitRef);
  const snoozeHabit = useMutation(snoozeHabitRef);
  const relapseHabit = useMutation(relapseHabitRef);
  const archiveHabit = useMutation(archiveHabitRef);
  const clearHabitTodayStatus = useMutation(clearHabitTodayStatusRef);
  const respondStaleHabitPrompt = useMutation(respondStaleHabitPromptRef);
  const resolveMissedHabits = useMutation(resolveMissedHabitsRef);
  const resumePausedHabit = useMutation(resumePausedHabitRef);
  const restoreArchivedHabit = useMutation(restoreArchivedHabitRef);

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const groupedHabits = React.useMemo(() => {
    const list = habits || [];
    return ANCHOR_ORDER.map((anchor) => ({
      anchor,
      items: list.filter((habit) => (habit.anchor || "anytime") === anchor),
    })).filter((group) => group.items.length > 0);
  }, [habits]);

  const doneCount = (habits || []).filter((habit) => habit.todayStatus === "completed").length;
  const totalCount = (habits || []).length;
  const isLoading = habits === undefined;

  React.useEffect(() => {
    void resolveMissedHabits({ dayKey, lookbackDays: 21 }).catch(() => undefined);
  }, [dayKey, resolveMissedHabits]);

  const handleLog = async (habitId: string) => {
    setIsSubmitting(true);
    try {
      await logHabit({
        idempotencyKey: `habits.log:${habitId}:${Date.now()}`,
        habitId: habitId as Id<"habits">,
        dayKey,
      });
      toast.show({ variant: "success", label: "Marked Done for Today" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to log habit" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async (habitId: string) => {
    setIsSubmitting(true);
    try {
      await skipHabit({
        idempotencyKey: `habits.skip:${habitId}:${Date.now()}`,
        habitId: habitId as Id<"habits">,
        dayKey,
      });
      toast.show({ variant: "success", label: "Marked Skipped for Today" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to skip habit" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSnooze = async (habitId: string) => {
    setIsSubmitting(true);
    try {
      await snoozeHabit({
        idempotencyKey: `habits.snooze:${habitId}:${Date.now()}`,
        habitId: habitId as Id<"habits">,
        dayKey,
        snoozedUntil: Date.now() + 60 * 60 * 1000,
      });
      toast.show({ variant: "success", label: "Snoozed for Today (1 Hour)" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to snooze habit" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUndoToday = async (habitId: string) => {
    setIsSubmitting(true);
    try {
      await clearHabitTodayStatus({
        idempotencyKey: `habits.clearToday:${habitId}:${dayKey}:${Date.now()}`,
        habitId: habitId as Id<"habits">,
        dayKey,
      });
      toast.show({ variant: "success", label: "Cleared Today Status" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to clear today status" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (habitId: string) => {
    setIsSubmitting(true);
    try {
      await archiveHabit({
        idempotencyKey: `habits.archive:${habitId}:${Date.now()}`,
        habitId: habitId as Id<"habits">,
      });
      toast.show({ variant: "success", label: "Habit archived" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to archive habit" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRelapse = async (habitId: string) => {
    setIsSubmitting(true);
    try {
      await relapseHabit({
        idempotencyKey: `habits.relapse:${habitId}:${Date.now()}`,
        habitId: habitId as Id<"habits">,
        dayKey,
      });
      toast.show({ variant: "warning", label: "Relapse logged for today" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to log relapse" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStalePrompt = async (
    habitId: string,
    action: "keep" | "pause_30" | "archive",
  ) => {
    setIsSubmitting(true);
    try {
      await respondStaleHabitPrompt({
        idempotencyKey: `habits.stalePrompt:${habitId}:${action}:${Date.now()}`,
        habitId: habitId as Id<"habits">,
        dayKey,
        action,
      });
      toast.show({
        variant: "success",
        label:
          action === "keep"
            ? "Habit kept active"
            : action === "pause_30"
              ? "Habit paused for 30 days"
              : "Habit archived",
      });
    } catch {
      toast.show({ variant: "danger", label: "Failed to update stale habit" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResumePaused = async (habitId: Id<"habits">) => {
    setIsSubmitting(true);
    try {
      await resumePausedHabit({
        idempotencyKey: `habits.resume:${habitId}:${Date.now()}`,
        habitId,
      });
      toast.show({ variant: "success", label: "Habit resumed" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to resume habit" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreArchived = async (habitId: Id<"habits">) => {
    setIsSubmitting(true);
    try {
      await restoreArchivedHabit({
        idempotencyKey: `habits.restore:${habitId}:${Date.now()}`,
        habitId,
      });
      toast.show({ variant: "success", label: "Habit restored as new" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to restore habit" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Habits</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          {isTodayView ? "Today" : "Selected Day"} {doneCount}/{totalCount} completed.
        </Text>
      </View>

      <View className="bg-surface rounded-2xl border border-border p-3 shadow-sm">
        <View className="flex-row items-center justify-between gap-2">
          {weekDays.map((day) => {
            const isSelected = day.key === selectedDayKey;
            const isToday = day.key === localTodayKey;
            return (
              <Pressable
                key={day.key}
                className={`flex-1 rounded-xl px-2 py-2 items-center ${isSelected ? "bg-background border border-border" : ""}`}
                onPress={() => setSelectedDayKey(day.key)}
              >
                <Text className={`text-[11px] ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                  {day.label}
                </Text>
                <Text className={`text-base font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                  {day.dayNumber}
                </Text>
                {isToday ? <View className="mt-1 h-1 w-1 rounded-full bg-primary" /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
        <SectionLabel>Consistency (30d)</SectionLabel>
        <View className="flex-row items-end justify-between">
          <Text className="text-4xl font-serif text-foreground">{consistency?.consistencyPct ?? 0}%</Text>
          <Text className="text-xs text-muted-foreground">
            {consistency?.completedScheduledDays ?? 0}/{consistency?.scheduledDays ?? 0} scheduled
          </Text>
        </View>
        <Text className="text-xs text-muted-foreground">
          Streak {consistency?.currentStreak ?? 0}d · Best {consistency?.bestStreak ?? 0}d · Missed 14d{" "}
          {consistency?.missedLast14 ?? 0}
        </Text>
        <HeatDots values={(consistency?.trend || []).map((item) => item.score)} />
        <Button
          label="View Details"
          variant="ghost"
          onPress={() => router.push("/(tabs)/habits/consistency" as any)}
        />
      </View>

      <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
        <SectionLabel>Quick Actions</SectionLabel>
        <Button label="Add Habit" onPress={() => router.push("/(tabs)/habits/add" as any)} />
        <Button label="Manage Paused/Archived" variant="ghost" onPress={() => router.push("/(tabs)/habits/manage" as any)} />
        {!isTodayView ? (
          <Text className="text-xs text-muted-foreground">Viewing history. Switch to today to log actions.</Text>
        ) : null}
      </View>

      {(lifecycle?.paused.length || 0) > 0 ? (
        <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
          <SectionLabel>Paused Habits</SectionLabel>
          {lifecycle?.paused.map((habit) => (
            <View key={habit.habitId} className="rounded-xl border border-border bg-background p-3 gap-2">
              <Text className="text-sm text-foreground font-medium">{habit.name}</Text>
              <Text className="text-xs text-muted-foreground">Paused until {habit.pausedUntilDayKey}</Text>
              <Pressable
                className="self-start bg-primary/10 border border-primary/20 rounded-lg px-3 py-2"
                onPress={() => handleResumePaused(habit.habitId)}
                disabled={isSubmitting}
              >
                <Text className="text-xs font-medium text-primary">Resume</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {isTodayView && (stalePrompts || []).length > 0 ? (
        <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
          <SectionLabel>Still Relevant?</SectionLabel>
          {(stalePrompts || []).map((prompt) => (
            <View key={prompt.habitId} className="border border-border rounded-xl p-3 gap-3 bg-background">
              <Text className="text-sm text-foreground font-medium">{prompt.name}</Text>
              <Text className="text-xs text-muted-foreground">
                No engagement for {prompt.inactiveDays} days
                {prompt.stage === "overdue" ? " · Action recommended" : ""}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                <Pressable
                  className="bg-success/10 border border-success/20 rounded-lg px-3 py-2"
                  onPress={() => handleStalePrompt(String(prompt.habitId), "keep")}
                  disabled={isSubmitting}
                >
                  <Text className="text-xs font-medium text-success">Keep</Text>
                </Pressable>
                <Pressable
                  className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2"
                  onPress={() => handleStalePrompt(String(prompt.habitId), "pause_30")}
                  disabled={isSubmitting}
                >
                  <Text className="text-xs font-medium text-primary">Pause 30d</Text>
                </Pressable>
                <Pressable
                  className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2"
                  onPress={() => handleStalePrompt(String(prompt.habitId), "archive")}
                  disabled={isSubmitting}
                >
                  <Text className="text-xs font-medium text-danger">Archive</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {isLoading ? (
        <View className="py-12 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading...</Text>
        </View>
      ) : groupedHabits.length === 0 ? (
        <View className="py-12 items-center justify-center">
          <Text className="text-base text-muted-foreground">No habits yet</Text>
          <Text className="text-sm text-muted-foreground mt-1">Add your first habit to get started</Text>
        </View>
      ) : (
        groupedHabits.map((group) => (
          <View key={group.anchor} className="gap-3">
            <SectionLabel>{toTitleCase(group.anchor)}</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
              {group.items.map((habit) => {
                const status = formatStatus(habit.todayStatus);
                const resolved =
                  status === "Done Today" ||
                  status === "Skipped Today" ||
                  status === "Relapsed" ||
                  status === "Missed";
                const hasTodayStatus = status !== "Pending";

                return (
                  <View key={habit.habitId} className="border border-border rounded-xl p-3 gap-3 bg-background">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-base font-medium text-foreground flex-1 mr-3">{habit.name}</Text>
                      <Text
                        className={`text-xs uppercase ${
                          status === "Done Today"
                            ? "text-success"
                            : status === "Skipped Today"
                              ? "text-warning"
                              : status === "Relapsed"
                                ? "text-danger"
                                : status === "Missed"
                                  ? "text-danger"
                              : status === "Snoozed Today"
                                ? "text-primary"
                                : "text-muted-foreground"
                        }`}
                      >
                        {status}
                      </Text>
                    </View>

                    <Text className="text-xs text-muted-foreground">
                      {formatCadence(habit.cadence)} · {toTitleCase(habit.difficulty || "low")}
                      {habit.targetValue ? ` · ${habit.targetValue} ${habit.targetUnit || "units"}` : ""}
                    </Text>

                    <View className="self-start bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1">
                      <Text className="text-[11px] text-primary font-medium uppercase">
                        {toTitleCase(habit.kind || "build")}
                      </Text>
                    </View>

                    <View className="flex-row flex-wrap gap-2">
                      {!resolved ? (
                        <>
                          <Pressable
                            className="bg-success/10 border border-success/20 rounded-lg px-3 py-2"
                            onPress={() => handleLog(habit.habitId)}
                            disabled={isSubmitting || !isTodayView}
                          >
                            <Text className="text-xs font-medium text-success">Done Today</Text>
                          </Pressable>
                          <Pressable
                            className="bg-warning/10 border border-warning/20 rounded-lg px-3 py-2"
                            onPress={() => handleSkip(habit.habitId)}
                            disabled={isSubmitting || !isTodayView}
                          >
                            <Text className="text-xs font-medium text-warning">Skip Today</Text>
                          </Pressable>
                          <Pressable
                            className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2"
                            onPress={() => handleSnooze(habit.habitId)}
                            disabled={isSubmitting || !isTodayView}
                          >
                            <Text className="text-xs font-medium text-primary">Snooze Today</Text>
                          </Pressable>
                          {habit.kind === "break" ? (
                            <Pressable
                              className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2"
                              onPress={() => handleRelapse(habit.habitId)}
                              disabled={isSubmitting || !isTodayView}
                            >
                              <Text className="text-xs font-medium text-danger">Relapse</Text>
                            </Pressable>
                          ) : null}
                        </>
                      ) : null}

                      {hasTodayStatus ? (
                        <Pressable
                          className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2"
                          onPress={() => handleUndoToday(habit.habitId)}
                          disabled={isSubmitting || !isTodayView}
                        >
                          <Text className="text-xs font-medium text-primary">Undo Today</Text>
                        </Pressable>
                      ) : null}

                      <Pressable
                        className="bg-warning/10 border border-warning/20 rounded-lg px-3 py-2"
                        onPress={() =>
                          router.push({ pathname: "/(tabs)/habits/edit", params: { id: habit.habitId } } as any)
                        }
                      >
                        <Text className="text-xs font-medium text-warning">Edit</Text>
                      </Pressable>

                      <Pressable
                        className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2"
                        onPress={() =>
                          router.push({
                            pathname: "/(tabs)/habits/habit-consistency",
                            params: { id: habit.habitId },
                          } as any)
                        }
                      >
                        <Text className="text-xs font-medium text-primary">Stats</Text>
                      </Pressable>

                      <Pressable
                        className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2"
                        onPress={() => handleArchive(habit.habitId)}
                        disabled={isSubmitting}
                      >
                        <Text className="text-xs font-medium text-danger">Archive</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))
      )}

      {(lifecycle?.archived.length || 0) > 0 ? (
        <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
          <SectionLabel>Archived Habits</SectionLabel>
          {(lifecycle?.archived || []).slice(0, 4).map((habit) => (
            <View key={habit.habitId} className="rounded-xl border border-border bg-background p-3 gap-2">
              <Text className="text-sm text-foreground font-medium">{habit.name}</Text>
              <Pressable
                className="self-start bg-warning/10 border border-warning/20 rounded-lg px-3 py-2"
                onPress={() => handleRestoreArchived(habit.habitId)}
                disabled={isSubmitting}
              >
                <Text className="text-xs font-medium text-warning">Restore as New</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
