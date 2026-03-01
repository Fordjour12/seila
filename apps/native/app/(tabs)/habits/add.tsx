import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { useToast } from "heroui-native";

import { createHabitRef } from "../../../lib/productivity-refs";
import { HabitForm } from "./_components/HabitForm";
import { getLocalDayKey } from "../../../lib/date";

export default function AddHabitScreen() {
   const router = useRouter();
   const { toast } = useToast();
   const createHabit = useMutation(createHabitRef);
   const dayKey = getLocalDayKey();

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
   const [isSubmitting, setIsSubmitting] = React.useState(false);

   const validationError = React.useMemo(() => {
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
      kind,
      name,
      targetType,
      targetUnit,
      targetValue,
   ]);

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
            startDayKey: dayKey,
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
               Create a habit with target and frequency.
            </Text>
         </View>

         <HabitForm
            title="Habit Composer"
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
            submitLabel="Create Habit"
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
      </ScrollView>
   );
}
