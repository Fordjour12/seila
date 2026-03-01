import { Container } from "@/components/container";
import { getLocalDayKey } from "@/lib/date";
import {
  gentleReturnSuggestionRef,
  habitAnalyticsRef,
  logHabitRef,
  skipHabitRef,
  snoozeHabitRef,
  todayHabitsRef,
} from "@/lib/productivity-refs";
import { useModeThemeColors } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Button, useToast } from "heroui-native";
import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { HabitCard } from "./_components/HabitCard";

function idempotencyKey(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

export default function HabitsScreen() {
  const colors = useModeThemeColors();
  const router = useRouter();
  const dayKey = getLocalDayKey();
  const { toast } = useToast();

  const [lowEnergyMode, setLowEnergyMode] = React.useState(false);
  const [pendingValueHabit, setPendingValueHabit] = React.useState<
    | {
        habitId: Id<"habits">;
        name: string;
        targetType?: "binary" | "quantity" | "duration";
        targetValue?: number;
        targetUnit?: string;
      }
    | null
  >(null);
  const [pendingValue, setPendingValue] = React.useState("");

  const habits = useQuery(todayHabitsRef, { dayKey, lowEnergyMode }) ?? [];
  const gentleReturn = useQuery(gentleReturnSuggestionRef, { dayKey });
  const analytics = useQuery(habitAnalyticsRef, { dayKey });

  const logHabit = useMutation(logHabitRef);
  const skipHabit = useMutation(skipHabitRef);
  const snoozeHabit = useMutation(snoozeHabitRef);

  const doneCount = habits.filter((habit) => habit.todayStatus === "completed").length;
  const completionRate = habits.length > 0 ? Math.round((doneCount / habits.length) * 100) : 0;
  const remainingCount = Math.max(habits.length - doneCount, 0);

  const handleComplete = async (habit: (typeof habits)[number], value?: number) => {
    try {
      await logHabit({
        idempotencyKey: idempotencyKey("habits.log"),
        habitId: habit.habitId,
        dayKey,
        value,
      });
      toast.show({ variant: "success", label: value === undefined ? "Habit logged" : "Habit value logged" });
      setPendingValueHabit(null);
      setPendingValue("");
    } catch {
      toast.show({ variant: "danger", label: "Failed to log habit" });
    }
  };

  const handleSnooze = async (habitId: Id<"habits">) => {
    try {
      await snoozeHabit({
        idempotencyKey: idempotencyKey("habits.snooze"),
        habitId,
        dayKey,
        snoozedUntil: Date.now() + 60 * 60 * 1000,
      });
      toast.show({ variant: "success", label: "Habit snoozed for 1 hour" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to snooze habit" });
    }
  };

  const handleSkip = async (habitId: Id<"habits">) => {
    try {
      await skipHabit({
        idempotencyKey: idempotencyKey("habits.skip"),
        habitId,
        dayKey,
      });
      toast.show({ variant: "success", label: "Habit skipped" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to skip habit" });
    }
  };

  return (
    <Container className="flex-1 bg-background" isScrollable={false}>
      <View className="px-4 pt-4">
        <View className="flex-row items-start justify-between">
          <Text className="text-3xl font-sans-extrabold text-foreground">Habits</Text>
          <View className="flex-row gap-1">
            <Button
              variant="ghost"
              onPress={() => setLowEnergyMode((value) => !value)}
              isIconOnly
            >
              <Ionicons
                name={lowEnergyMode ? "battery-half" : "battery-half-outline"}
                size={18}
                color={colors.foreground}
              />
            </Button>
            <Button variant="ghost" onPress={() => router.push("/(tabs)/habits/add")} isIconOnly>
              <Ionicons name="add" size={22} color={colors.foreground} />
            </Button>
            <Button
              variant="ghost"
              onPress={() => router.push("/(tabs)/habits/consistency")}
              isIconOnly
            >
              <Ionicons name="map-outline" size={20} color={colors.foreground} />
            </Button>
          </View>
        </View>
        <Text className="text-sm font-sans-medium text-muted-foreground mt-1">
          {doneCount}/{habits.length} done today
          {lowEnergyMode ? " · low-energy mode" : ""}
        </Text>
      </View>

      {gentleReturn ? (
        <View className="mx-4 mt-3 rounded-2xl border border-border bg-surface px-4 py-3">
          <Text className="text-xs uppercase tracking-[0.6px] text-muted-foreground font-sans-semibold">
            Gentle Return
          </Text>
          <Text className="text-sm text-foreground font-sans-semibold mt-1">Start with: {gentleReturn.name}</Text>
          <Text className="text-xs text-muted-foreground mt-1">Inactive for 3+ days detected.</Text>
        </View>
      ) : null}

      <View className="mx-4 mt-3 rounded-3xl border border-border bg-surface px-4 py-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-sans-semibold text-foreground">{"Today's progress"}</Text>
          <Text className="text-sm font-sans-bold text-foreground">{completionRate}%</Text>
        </View>
        <View className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <View className="h-full rounded-full bg-primary" style={{ width: `${completionRate}%` }} />
        </View>
        <Text className="mt-3 text-xs font-sans-medium text-muted-foreground">
          {remainingCount > 0
            ? `${remainingCount} habit${remainingCount === 1 ? "" : "s"} left to complete`
            : habits.length === 0
              ? "Add your first habit to start tracking progress."
              : "Everything is complete for today."}
        </Text>
        {analytics ? (
          <Text className="mt-2 text-xs text-muted-foreground">
            7d: {analytics.completion7d.ratePct}% · 30d: {analytics.completion30d.ratePct}% ·
            Low energy: {analytics.energyCompletion.low}%
          </Text>
        ) : null}
      </View>

      {pendingValueHabit ? (
        <View className="mx-4 mt-3 rounded-2xl border border-border bg-surface px-4 py-3 gap-2">
          <Text className="text-sm text-foreground font-sans-semibold">Log value for {pendingValueHabit.name}</Text>
          <TextInput
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground font-sans-medium"
            keyboardType="decimal-pad"
            value={pendingValue}
            onChangeText={setPendingValue}
            placeholder={
              pendingValueHabit.targetType === "duration"
                ? "Minutes"
                : pendingValueHabit.targetUnit || "Value"
            }
            placeholderTextColor="#6b7280"
          />
          <View className="flex-row gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onPress={() => {
                setPendingValueHabit(null);
                setPendingValue("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="flex-1"
              onPress={() => {
                const value = Number(pendingValue);
                if (!Number.isFinite(value)) {
                  toast.show({ variant: "warning", label: "Enter a valid numeric value" });
                  return;
                }
                const matching = habits.find((habit) => habit.habitId === pendingValueHabit.habitId);
                if (!matching) {
                  toast.show({ variant: "danger", label: "Habit not found" });
                  return;
                }
                void handleComplete(matching, value);
              }}
            >
              Log Value
            </Button>
          </View>
        </View>
      ) : null}

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-4 pb-24 gap-3"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {habits.length === 0 ? (
          <View className="rounded-3xl border border-dashed border-border bg-surface px-6 py-10 items-center justify-center">
            <View className="h-12 w-12 rounded-full bg-primary/10 items-center justify-center">
              <Ionicons name="leaf-outline" size={24} color={colors.accent} />
            </View>
            <Text className="mt-4 text-base text-foreground font-sans-semibold">No habits due today</Text>
            <Text className="text-sm text-muted-foreground/80 text-center mt-1 font-sans-medium">
              Add a habit or switch off low-energy mode.
            </Text>
            <Pressable
              className="mt-5 rounded-xl bg-primary px-4 py-2.5"
              onPress={() => router.push("/(tabs)/habits/add")}
            >
              <Text className="text-sm font-sans-semibold text-primary-foreground">Create habit</Text>
            </Pressable>
          </View>
        ) : (
          habits.map((habit) => (
            <HabitCard
              key={habit.habitId}
              habit={habit}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/habits/[id]",
                  params: { id: habit.habitId },
                })
              }
              onEditPress={() =>
                router.push({ pathname: "/(tabs)/habits/edit", params: { id: habit.habitId } })
              }
              onStatsPress={() =>
                router.push({
                  pathname: "/(tabs)/habits/[id]",
                  params: { id: habit.habitId },
                })
              }
              onCompletePress={() => {
                if ((habit.kind ?? "build") === "break") {
                  const breakGoal = habit.breakGoal ?? (habit.targetValue === 0 ? "quit" : "limit");
                  const breakMetric = habit.breakMetric ?? (habit.targetType === "duration" ? "minutes" : "times");
                  if (breakGoal === "limit" && breakMetric === "minutes") {
                    setPendingValueHabit({
                      habitId: habit.habitId,
                      name: habit.name,
                      targetType: "duration",
                      targetValue: habit.targetValue,
                      targetUnit: "minutes",
                    });
                    setPendingValue("");
                    return;
                  }
                  void handleComplete(habit, 1);
                  return;
                }

                if (habit.targetType === "quantity" || habit.targetType === "duration") {
                  setPendingValueHabit({
                    habitId: habit.habitId,
                    name: habit.name,
                    targetType: habit.targetType,
                    targetValue: habit.targetValue,
                    targetUnit: habit.targetUnit,
                  });
                  setPendingValue("");
                  return;
                }
                void handleComplete(habit);
              }}
              onSkipPress={() => void handleSkip(habit.habitId)}
              onSnoozePress={() => void handleSnooze(habit.habitId)}
            />
          ))
        )}
      </ScrollView>
    </Container>
  );
}
