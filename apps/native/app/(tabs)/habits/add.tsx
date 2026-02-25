import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { useToast } from "heroui-native";

import { createHabitRef } from "../../../lib/productivity-refs";
import { buildCadenceFromForm } from "./_components/HabitForm";
import { HabitAddPremiumCardVariant } from "./_components/AddHabitVariants";
import { getLocalDayKey } from "../../../lib/date";

export default function AddHabitScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const createHabit = useMutation(createHabitRef);

  const [name, setName] = React.useState("");
  const [anchor, setAnchor] = React.useState<"morning" | "afternoon" | "evening" | "anytime">(
    "morning",
  );
  const [difficulty, setDifficulty] = React.useState<"low" | "medium" | "high">("low");
  const [kind, setKind] = React.useState<"build" | "break">("build");
  const [cadenceType, setCadenceType] = React.useState<"daily" | "weekdays" | "custom">("daily");
  const [customDays, setCustomDays] = React.useState<number[]>([1, 2, 3, 4, 5]);
  const [startDayKey, setStartDayKey] = React.useState<string | undefined>(getLocalDayKey());
  const [endDayKey, setEndDayKey] = React.useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validationError = React.useMemo(() => {
    if (!name.trim()) return "Habit name is required";
    if (cadenceType === "custom" && customDays.length === 0) {
      return "Choose at least one day for custom cadence";
    }
    if (startDayKey && endDayKey && endDayKey < startDayKey) {
      return "End date must be on or after start date";
    }
    return null;
  }, [cadenceType, customDays.length, endDayKey, name, startDayKey]);

  const handleSubmit = async () => {
    if (validationError) {
      toast.show({ variant: "warning", label: validationError });
      return;
    }

    setIsSubmitting(true);
    try {
      await createHabit({
        idempotencyKey: `habits.create:${Date.now()}`,
        name: name.trim(),
        cadence: buildCadenceFromForm(cadenceType, customDays),
        anchor,
        difficulty,
        kind,
        startDayKey,
        endDayKey,
      });
      toast.show({ variant: "success", label: "Habit created" });
      router.back();
    } catch {
      toast.show({ variant: "danger", label: "Failed to create habit" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Add Habit</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Create either a build habit or a break habit.
        </Text>
      </View>

      <HabitAddPremiumCardVariant
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
        onNameChange={setName}
        onAnchorChange={setAnchor}
        onDifficultyChange={setDifficulty}
        onKindChange={setKind}
        onCadenceTypeChange={setCadenceType}
        onCustomDaysChange={setCustomDays}
        onStartDayKeyChange={setStartDayKey}
        onEndDayKeyChange={setEndDayKey}
        onSubmit={handleSubmit}
      />
    </ScrollView>
  );
}
