import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import { todayHabitsRef, updateHabitRef } from "../../../lib/productivity-refs";
import { Button } from "../../../components/ui";
import { HabitForm, buildCadenceFromForm } from "./_components/HabitForm";
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
  const [anchor, setAnchor] = React.useState<"morning" | "afternoon" | "evening" | "anytime">(
    "morning",
  );
  const [difficulty, setDifficulty] = React.useState<"low" | "medium" | "high">("low");
  const [kind, setKind] = React.useState<"build" | "break">("build");
  const [cadenceType, setCadenceType] = React.useState<"daily" | "weekdays" | "custom">("daily");
  const [customDays, setCustomDays] = React.useState<number[]>([1, 2, 3, 4, 5]);
  const [startDayKey, setStartDayKey] = React.useState<string | undefined>();
  const [endDayKey, setEndDayKey] = React.useState<string | undefined>();
  const [hydratedHabitId, setHydratedHabitId] = React.useState<Id<"habits"> | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!habit) return;
    if (hydratedHabitId === habit.habitId) return;

    setName(habit.name);
    setAnchor(habit.anchor || "morning");
    setDifficulty(habit.difficulty || "low");
    setKind(habit.kind || "build");
    setStartDayKey(habit.startDayKey);
    setEndDayKey(habit.endDayKey);

    if (habit.cadence === "daily" || habit.cadence === "weekdays") {
      setCadenceType(habit.cadence);
      setCustomDays([1, 2, 3, 4, 5]);
    } else {
      setCadenceType("custom");
      setCustomDays(habit.cadence.customDays);
    }

    setHydratedHabitId(habit.habitId);
  }, [habit, hydratedHabitId]);

  const validationError = React.useMemo(() => {
    if (!habit) return "Habit not found";
    if (!name.trim()) return "Habit name is required";
    if (cadenceType === "custom" && customDays.length === 0) {
      return "Choose at least one day for custom cadence";
    }
    if (startDayKey && endDayKey && endDayKey < startDayKey) {
      return "End date must be on or after start date";
    }
    return null;
  }, [cadenceType, customDays.length, endDayKey, habit, name, startDayKey]);

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
        cadence: buildCadenceFromForm(cadenceType, customDays),
        anchor,
        difficulty,
        kind,
        startDayKey,
        endDayKey,
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
          Update cadence, anchor, and difficulty for this habit.
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
          anchor={anchor}
          difficulty={difficulty}
          kind={kind}
          cadenceType={cadenceType}
          customDays={customDays}
          startDayKey={startDayKey}
          endDayKey={endDayKey}
          validationError={validationError}
          isSubmitting={isSubmitting}
          submitLabel="Save Habit"
          onNameChange={setName}
          onAnchorChange={setAnchor}
          onDifficultyChange={setDifficulty}
          onKindChange={setKind}
          onCadenceTypeChange={setCadenceType}
          onCustomDaysChange={setCustomDays}
          onStartDayKeyChange={setStartDayKey}
          onEndDayKeyChange={setEndDayKey}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
        />
      )}
    </ScrollView>
  );
}
