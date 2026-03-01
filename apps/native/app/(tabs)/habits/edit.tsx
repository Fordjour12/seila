import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import { todayHabitsRef, updateHabitRef } from "../../../lib/productivity-refs";
import { Button } from "../../../components/ui";
import { HabitForm } from "./_components/HabitForm";
import { getLocalDayKey } from "../../../lib/date";

export default function EditHabitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const habitIdParam = id ?? "";
  const dayKey = getLocalDayKey();
  const { toast } = useToast();
  const habits = useQuery(todayHabitsRef, { dayKey });
  const updateHabit = useMutation(updateHabitRef);

  const habit = React.useMemo(
    () => (habits || []).find((item) => String(item.habitId) === habitIdParam),
    [habits, habitIdParam],
  );

  const [name, setName] = React.useState("");
  const [kind, setKind] = React.useState<"build" | "break">("build");
  const [targetType, setTargetType] = React.useState<"binary" | "quantity" | "duration">("binary");
  const [breakGoal, setBreakGoal] = React.useState<"quit" | "limit">("quit");
  const [breakMetric, setBreakMetric] = React.useState<"times" | "minutes">("times");
  const [frequencyType, setFrequencyType] = React.useState<"daily" | "weekly">("daily");
  const [frequencyEveryXDays, setFrequencyEveryXDays] = React.useState("");
  const [frequencyWeekdays, setFrequencyWeekdays] = React.useState<number[]>([1, 2, 3, 4, 5]);
  const [targetValue, setTargetValue] = React.useState("");
  const [targetUnit, setTargetUnit] = React.useState("");
  const [identityTags, setIdentityTags] = React.useState<string[]>([]);
  const [energyLevel, setEnergyLevel] = React.useState<"low" | "medium" | "high">("low");
  const [timePreference, setTimePreference] = React.useState<
    "morning" | "afternoon" | "evening" | "flexible"
  >("flexible");
  const [hydratedHabitId, setHydratedHabitId] = React.useState<Id<"habits"> | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!habit) return;
    if (hydratedHabitId === habit.habitId) return;

    setName(habit.name);
    setKind(habit.kind || "build");
    setTargetType(habit.targetType || "binary");
    setTargetValue(typeof habit.targetValue === "number" ? String(habit.targetValue) : "");
    setTargetUnit(habit.targetType === "duration" ? "minutes" : habit.targetUnit || "");
    setIdentityTags(habit.identityTags || []);
    setEnergyLevel(habit.energyLevel || "low");
    setTimePreference(habit.timePreference || "flexible");
    setBreakGoal(habit.breakGoal || (habit.kind === "break" && habit.targetValue === 0 ? "quit" : "limit"));
    setBreakMetric(habit.breakMetric || (habit.targetType === "duration" ? "minutes" : "times"));

    if (habit.frequencyType === "weekly") {
      setFrequencyType("weekly");
      setFrequencyWeekdays(habit.frequencyConfig?.weekdays || [1, 2, 3, 4, 5]);
      setFrequencyEveryXDays("");
    } else {
      setFrequencyType("daily");
      setFrequencyEveryXDays(
        typeof habit.frequencyConfig?.everyXDays === "number"
          ? String(habit.frequencyConfig.everyXDays)
          : "",
      );
      if (habit.cadence !== "daily" && habit.cadence !== "weekdays") {
        setFrequencyWeekdays(habit.cadence.customDays);
      }
    }

    setHydratedHabitId(habit.habitId);
  }, [habit, hydratedHabitId]);

  const validationError = React.useMemo(() => {
    if (!habit) return "Habit not found";
    if (!name.trim()) return "Habit name is required";
    if (frequencyType === "weekly" && frequencyWeekdays.length === 0) {
      return "Choose at least one weekday";
    }
    if (frequencyType === "daily" && frequencyEveryXDays.trim()) {
      const everyX = Number(frequencyEveryXDays);
      if (!Number.isInteger(everyX) || everyX <= 0) {
        return "Every X days must be a positive integer";
      }
    }
    if ((targetType === "quantity" || targetType === "duration") && !targetValue.trim()) {
      return "Target value is required for quantity and duration habits";
    }
    if ((targetType === "quantity" || targetType === "duration") && Number(targetValue) <= 0) {
      return "Target value must be greater than 0";
    }
    if (targetType === "duration" && targetUnit.trim()) {
      return "Duration unit is fixed to minutes in V1";
    }
    if (kind === "break" && breakGoal === "limit") {
      if (!targetValue.trim()) return "Limit value is required";
      if (Number(targetValue) < 1) return "Limit value must be at least 1";
    }
    return null;
  }, [
    breakGoal,
    frequencyEveryXDays,
    frequencyType,
    frequencyWeekdays.length,
    habit,
    kind,
    name,
    targetType,
    targetUnit,
    targetValue,
  ]);

  const isLoading = habits === undefined;

  const handleSubmit = async () => {
    if (!habit) {
      toast.show({ variant: "danger", label: "Habit not found" });
      return;
    }

    if (validationError) {
      toast.show({ variant: "warning", label: validationError });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateHabit({
        idempotencyKey: `habits.update:${habit.habitId}:${Date.now()}`,
        habitId: habit.habitId as Id<"habits">,
        name: name.trim(),
        cadence:
          frequencyType === "weekly"
            ? { customDays: frequencyWeekdays }
            : "daily",
        anchor: timePreference === "flexible" ? "anytime" : timePreference,
        difficulty: energyLevel,
        kind,
        breakGoal: kind === "break" ? breakGoal : undefined,
        breakMetric: kind === "break" ? breakMetric : undefined,
        targetType:
          kind === "break"
            ? breakGoal === "quit"
              ? "quantity"
              : breakMetric === "minutes"
                ? "duration"
                : "quantity"
            : targetType,
        targetValue:
          kind === "break"
            ? breakGoal === "quit"
              ? 0
              : Number(targetValue)
            : targetType === "quantity" || targetType === "duration"
              ? Number(targetValue)
              : undefined,
        targetUnit:
          kind === "break"
            ? breakMetric === "minutes"
              ? "minutes"
              : "times"
            : targetType === "duration"
              ? "minutes"
              : targetType === "quantity"
                ? targetUnit.trim() || undefined
                : undefined,
        frequencyType,
        frequencyConfig:
          frequencyType === "daily"
            ? {
                everyXDays: frequencyEveryXDays.trim()
                  ? Number(frequencyEveryXDays)
                  : undefined,
              }
            : {
                weekdays: frequencyWeekdays,
              },
        identityTags,
        energyLevel,
        timePreference,
        startDayKey: habit.startDayKey,
        endDayKey: habit.endDayKey,
      });
      toast.show({ variant: "success", label: "Habit updated" });
      router.back();
    } catch {
      toast.show({ variant: "danger", label: "Failed to update habit" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoading && !habit) {
    return (
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
        <Text className="text-2xl font-serif text-foreground">Habit not found</Text>
        <Button label="Go Back" onPress={() => router.back()} />
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Edit Habit</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Update target, frequency, and optional preference fields.
        </Text>
      </View>

      {isLoading ? (
        <View className="py-12 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading...</Text>
        </View>
      ) : (
        <HabitForm
          title="Habit Details"
          name={name}
          kind={kind}
          targetType={targetType}
          breakGoal={breakGoal}
          breakMetric={breakMetric}
          frequencyType={frequencyType}
          frequencyEveryXDays={frequencyEveryXDays}
          frequencyWeekdays={frequencyWeekdays}
          targetValue={targetValue}
          targetUnit={targetUnit}
          identityTags={identityTags}
          energyLevel={energyLevel}
          timePreference={timePreference}
          validationError={validationError}
          isSubmitting={isSubmitting}
          submitLabel="Save Habit"
          onNameChange={setName}
          onKindChange={setKind}
          onTargetTypeChange={setTargetType}
          onBreakGoalChange={setBreakGoal}
          onBreakMetricChange={setBreakMetric}
          onFrequencyTypeChange={setFrequencyType}
          onFrequencyEveryXDaysChange={setFrequencyEveryXDays}
          onFrequencyWeekdaysChange={setFrequencyWeekdays}
          onTargetValueChange={setTargetValue}
          onTargetUnitChange={setTargetUnit}
          onIdentityTagsChange={setIdentityTags}
          onEnergyLevelChange={setEnergyLevel}
          onTimePreferenceChange={setTimePreference}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
        />
      )}
    </ScrollView>
  );
}
