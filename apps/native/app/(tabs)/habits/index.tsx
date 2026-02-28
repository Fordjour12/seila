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
  skipHabitRef,
  snoozeHabitRef,
  todayHabitsRef,
  type HabitCadence,
} from "../../../lib/productivity-refs";
import { Button, SectionLabel } from "../../../components/ui";
import { getLocalDayKey } from "../../../lib/date";
import { BentoDashboard } from "./_components/BentoDashboard";
import { DaySelector } from "./_components/DaySelector";
import { HabitCard } from "./_components/HabitCard";
import { GestureHandlerRootView } from "react-native-gesture-handler";

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

function statusToneClass(status: ReturnType<typeof formatStatus>) {
  if (status === "Done Today") return "text-success bg-success/10 border-success/20";
  if (status === "Skipped Today") return "text-warning bg-warning/10 border-warning/20";
  if (status === "Snoozed Today") return "text-primary bg-primary/10 border-primary/20";
  if (status === "Relapsed" || status === "Missed") {
    return "text-danger bg-danger/10 border-danger/20";
  }
  return "text-muted-foreground bg-muted/30 border-border";
}



function ActionPill({
  label,
  tone,
  onPress,
  disabled,
}: {
  label: string;
  tone: "success" | "warning" | "primary" | "danger";
  onPress: () => void;
  disabled?: boolean;
}) {
  const className =
    tone === "success"
      ? "bg-success/10 border-success/20 text-success"
      : tone === "warning"
        ? "bg-warning/10 border-warning/20 text-warning"
        : tone === "danger"
          ? "bg-danger/10 border-danger/20 text-danger"
          : "bg-primary/10 border-primary/20 text-primary";

  return (
    <Pressable
      className={`rounded-lg border px-3 py-2 ${className} ${disabled ? "opacity-50" : ""}`}
      onPress={onPress}
      disabled={disabled}
    >
      <Text className="text-xs font-sans-semibold">{label}</Text>
    </Pressable>
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
  const consistency = useQuery(habitsConsistencyRef, {
    dayKey,
    windowDays: 30,
    trendDays: 14,
  });
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

  const runHabitAction = async ({
    operation,
    successLabel,
    errorLabel,
    successVariant = "success",
  }: {
    operation: () => Promise<unknown>;
    successLabel: string;
    errorLabel: string;
    successVariant?: "success" | "warning" | "default";
  }) => {
    setIsSubmitting(true);
    try {
      await operation();
      toast.show({ variant: successVariant, label: successLabel });
    } catch {
      toast.show({ variant: "danger", label: errorLabel });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLog = async (habitId: string) => {
    await runHabitAction({
      operation: () =>
        logHabit({
          idempotencyKey: `habits.log:${habitId}:${Date.now()}`,
          habitId: habitId as Id<"habits">,
          dayKey,
        }),
      successLabel: "Marked Done for Today",
      errorLabel: "Failed to log habit",
    });
  };

  const handleSkip = async (habitId: string) => {
    await runHabitAction({
      operation: () =>
        skipHabit({
          idempotencyKey: `habits.skip:${habitId}:${Date.now()}`,
          habitId: habitId as Id<"habits">,
          dayKey,
        }),
      successLabel: "Marked Skipped for Today",
      errorLabel: "Failed to skip habit",
    });
  };

  const handleSnooze = async (habitId: string) => {
    await runHabitAction({
      operation: () =>
        snoozeHabit({
          idempotencyKey: `habits.snooze:${habitId}:${Date.now()}`,
          habitId: habitId as Id<"habits">,
          dayKey,
          snoozedUntil: Date.now() + 60 * 60 * 1000,
        }),
      successLabel: "Snoozed for Today (1 Hour)",
      errorLabel: "Failed to snooze habit",
    });
  };

  const handleUndoToday = async (habitId: string) => {
    await runHabitAction({
      operation: () =>
        clearHabitTodayStatus({
          idempotencyKey: `habits.clearToday:${habitId}:${dayKey}:${Date.now()}`,
          habitId: habitId as Id<"habits">,
          dayKey,
        }),
      successLabel: "Cleared Today Status",
      errorLabel: "Failed to clear today status",
    });
  };

  const handleArchive = async (habitId: string) => {
    await runHabitAction({
      operation: () =>
        archiveHabit({
          idempotencyKey: `habits.archive:${habitId}:${Date.now()}`,
          habitId: habitId as Id<"habits">,
        }),
      successLabel: "Habit archived",
      errorLabel: "Failed to archive habit",
    });
  };

  const handleRelapse = async (habitId: string) => {
    await runHabitAction({
      operation: () =>
        relapseHabit({
          idempotencyKey: `habits.relapse:${habitId}:${Date.now()}`,
          habitId: habitId as Id<"habits">,
          dayKey,
        }),
      successLabel: "Relapse logged for today",
      errorLabel: "Failed to log relapse",
      successVariant: "warning",
    });
  };

  const handleStalePrompt = async (
    habitId: string,
    action: "keep" | "pause_30" | "archive",
  ) => {
    const successLabel =
      action === "keep"
        ? "Habit kept active"
        : action === "pause_30"
          ? "Habit paused for 30 days"
          : "Habit archived";

    await runHabitAction({
      operation: () =>
        respondStaleHabitPrompt({
          idempotencyKey: `habits.stalePrompt:${habitId}:${action}:${Date.now()}`,
          habitId: habitId as Id<"habits">,
          dayKey,
          action,
        }),
      successLabel,
      errorLabel: "Failed to update stale habit",
    });
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 pt-4 pb-24 gap-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-sans-extrabold text-foreground">Habits</Text>
            <Text className="text-sm font-sans-medium text-muted-foreground mt-1">
              {isTodayView ? "Today" : "Selected day"} {doneCount}/{totalCount} completed
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Button label="+" onPress={() => router.push("/(tabs)/habits/add")} />
          </View>
        </View>

        <BentoDashboard consistency={consistency} />
        <View className="flex-row gap-2 mt-2 bg-surface rounded-2xl border border-border p-2">
          <Button
            label="View Consistency"
            variant="ghost"
            style={{ flex: 1 }}
            onPress={() => router.push("/(tabs)/habits/consistency")}
          />
          <Button
            label="Manage"
            variant="ghost"
            style={{ flex: 1 }}
            onPress={() => router.push("/(tabs)/habits/manage")}
          />
        </View>

        <DaySelector
          days={weekDays}
          selectedDayKey={selectedDayKey}
          localTodayKey={localTodayKey}
          onSelect={setSelectedDayKey}
        />

        {(lifecycle?.paused.length || 0) > 0 || (lifecycle?.archived.length || 0) > 0 ? (
          <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
            <SectionLabel>Lifecycle Summary</SectionLabel>
            <Text className="text-sm text-foreground font-sans-semibold">
              Paused: {(lifecycle?.paused || []).length} · Archived: {(lifecycle?.archived || []).length}
            </Text>
            <Text className="text-xs text-muted-foreground font-sans-medium">
              Resume and restore actions live in Manage Habits.
            </Text>
            <Button
              label="Open Manage Habits"
              variant="ghost"
              onPress={() => router.push("/(tabs)/habits/manage")}
            />
          </View>
        ) : null}

        {isTodayView && (stalePrompts || []).length > 0 ? (
          <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
            <SectionLabel>Still Relevant?</SectionLabel>
            {(stalePrompts || []).map((prompt) => (
              <View key={prompt.habitId} className="border border-border rounded-xl p-3 gap-3 bg-background">
                <Text className="text-sm text-foreground font-sans-semibold">{prompt.name}</Text>
                <Text className="text-xs text-muted-foreground font-sans-medium">
                  No engagement for {prompt.inactiveDays} days
                  {prompt.stage === "overdue" ? " · Action recommended" : ""}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  <ActionPill
                    label="Keep"
                    tone="success"
                    onPress={() => handleStalePrompt(String(prompt.habitId), "keep")}
                    disabled={isSubmitting}
                  />
                  <ActionPill
                    label="Pause 30d"
                    tone="primary"
                    onPress={() => handleStalePrompt(String(prompt.habitId), "pause_30")}
                    disabled={isSubmitting}
                  />
                  <ActionPill
                    label="Archive"
                    tone="danger"
                    onPress={() => handleStalePrompt(String(prompt.habitId), "archive")}
                    disabled={isSubmitting}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
          <SectionLabel>Quick Actions</SectionLabel>
          <Button label="Add Habit" onPress={() => router.push("/(tabs)/habits/add")} />
          <Button
            label="Manage Paused/Archived"
            variant="ghost"
            onPress={() => router.push("/(tabs)/habits/manage")}
          />
          {!isTodayView ? (
            <Text className="text-xs text-muted-foreground font-sans-medium">
              Viewing history. Switch to today to log actions.
            </Text>
          ) : null}
        </View>

        {isLoading ? (
          <View className="py-12 items-center justify-center">
            <Text className="text-base text-muted-foreground font-sans-medium">Loading...</Text>
          </View>
        ) : groupedHabits.length === 0 ? (
          <View className="py-12 items-center justify-center">
            <Text className="text-base text-muted-foreground font-sans-semibold">No habits yet</Text>
            <Text className="text-sm text-muted-foreground mt-1 font-sans-medium">
              Add your first habit to get started
            </Text>
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
                    <HabitCard
                      key={habit.habitId}
                      habit={habit}
                      status={status}
                      hasTodayStatus={hasTodayStatus}
                      resolved={resolved}
                      isTodayView={isTodayView}
                      isSubmitting={isSubmitting}
                      onLog={() => handleLog(habit.habitId)}
                      onSkip={() => handleSkip(habit.habitId)}
                      onSnooze={() => handleSnooze(habit.habitId)}
                      onRelapse={() => handleRelapse(habit.habitId)}
                      onUndo={() => handleUndoToday(habit.habitId)}
                      onArchive={() => handleArchive(habit.habitId)}
                      onEdit={() => router.push({ pathname: "/(tabs)/habits/edit", params: { id: habit.habitId } })}
                      onStats={() => router.push({ pathname: "/(tabs)/habits/habit-consistency", params: { id: habit.habitId } })}
                    />
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </GestureHandlerRootView>
  );
}
