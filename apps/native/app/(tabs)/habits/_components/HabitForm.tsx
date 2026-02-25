import React from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { Button } from "../../../../components/ui";
import type {
  HabitAnchor,
  HabitCadence,
  HabitDifficulty,
  HabitKind,
} from "../../../../lib/productivity-refs";
import { formatDayKey, parseDayKey, toLocalDayKey } from "../../../../lib/date";

type Props = {
  title: string;
  name: string;
  anchor: HabitAnchor;
  difficulty: HabitDifficulty;
  kind: HabitKind;
  cadenceType: "daily" | "weekdays" | "custom";
  customDays: number[];
  startDayKey?: string;
  endDayKey?: string;
  validationError: string | null;
  isSubmitting: boolean;
  submitLabel: string;
  onNameChange: (value: string) => void;
  onAnchorChange: (value: HabitAnchor) => void;
  onDifficultyChange: (value: HabitDifficulty) => void;
  onKindChange: (value: HabitKind) => void;
  onCadenceTypeChange: (value: "daily" | "weekdays" | "custom") => void;
  onCustomDaysChange: (days: number[]) => void;
  onStartDayKeyChange: (value?: string) => void;
  onEndDayKeyChange: (value?: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
};

const DAY_OPTIONS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
] as const;

function toTitleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toggleDay(days: number[], day: number) {
  if (days.includes(day)) {
    return days.filter((value) => value !== day);
  }
  return [...days, day].sort((a, b) => a - b);
}

export function buildCadenceFromForm(
  cadenceType: "daily" | "weekdays" | "custom",
  customDays: number[],
): HabitCadence {
  if (cadenceType === "custom") {
    return { customDays };
  }
  return cadenceType;
}

export function HabitForm({
  title,
  name,
  anchor,
  difficulty,
  kind,
  cadenceType,
  customDays,
  startDayKey,
  endDayKey,
  validationError,
  isSubmitting,
  submitLabel,
  onNameChange,
  onAnchorChange,
  onDifficultyChange,
  onKindChange,
  onCadenceTypeChange,
  onCustomDaysChange,
  onStartDayKeyChange,
  onEndDayKeyChange,
  onSubmit,
  onCancel,
}: Props) {
  const [showStartPicker, setShowStartPicker] = React.useState(false);
  const [showEndPicker, setShowEndPicker] = React.useState(false);

  return (
    <View className="gap-3">
      <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
        <Text className="text-base font-medium text-foreground">{title}</Text>

        <TextInput
          className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
          placeholder="Habit name"
          placeholderTextColor="#6b7280"
          value={name}
          onChangeText={onNameChange}
        />

        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider">Cadence</Text>
          <View className="flex-row flex-wrap gap-2">
            {(["daily", "weekdays", "custom"] as const).map((value) => (
              <Pressable
                key={value}
                className={`rounded-full px-3 py-2 border ${
                  cadenceType === value ? "bg-warning/10 border-warning/30" : "bg-background border-border"
                }`}
                onPress={() => onCadenceTypeChange(value)}
              >
                <Text className={`text-xs font-medium ${cadenceType === value ? "text-warning" : "text-foreground"}`}>
                  {toTitleCase(value)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {cadenceType === "custom" ? (
          <View className="gap-2">
            <Text className="text-xs text-muted-foreground uppercase tracking-wider">Custom days</Text>
            <View className="flex-row flex-wrap gap-2">
              {DAY_OPTIONS.map((day) => {
                const active = customDays.includes(day.value);
                return (
                  <Pressable
                    key={day.value}
                    className={`rounded-full px-3 py-2 border ${
                      active ? "bg-primary/10 border-primary/30" : "bg-background border-border"
                    }`}
                    onPress={() => onCustomDaysChange(toggleDay(customDays, day.value))}
                  >
                    <Text className={`text-xs font-medium ${active ? "text-primary" : "text-foreground"}`}>
                      {day.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider">Anchor</Text>
          <View className="flex-row flex-wrap gap-2">
            {(["morning", "afternoon", "evening", "anytime"] as const).map((value) => (
              <Pressable
                key={value}
                className={`rounded-full px-3 py-2 border ${
                  anchor === value ? "bg-warning/10 border-warning/30" : "bg-background border-border"
                }`}
                onPress={() => onAnchorChange(value)}
              >
                <Text className={`text-xs font-medium ${anchor === value ? "text-warning" : "text-foreground"}`}>
                  {toTitleCase(value)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider">Difficulty</Text>
          <View className="flex-row flex-wrap gap-2">
            {(["low", "medium", "high"] as const).map((value) => (
              <Pressable
                key={value}
                className={`rounded-full px-3 py-2 border ${
                  difficulty === value ? "bg-warning/10 border-warning/30" : "bg-background border-border"
                }`}
                onPress={() => onDifficultyChange(value)}
              >
                <Text className={`text-xs font-medium ${difficulty === value ? "text-warning" : "text-foreground"}`}>
                  {toTitleCase(value)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider">Mode</Text>
          <View className="flex-row flex-wrap gap-2">
            {(["build", "break"] as const).map((value) => (
              <Pressable
                key={value}
                className={`rounded-full px-3 py-2 border ${
                  kind === value ? "bg-warning/10 border-warning/30" : "bg-background border-border"
                }`}
                onPress={() => onKindChange(value)}
              >
                <Text className={`text-xs font-medium ${kind === value ? "text-warning" : "text-foreground"}`}>
                  {toTitleCase(value)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider">Schedule</Text>
          <View className="flex-row gap-2">
            <Pressable
              className="flex-1 rounded-xl border border-border px-3 py-2 bg-background"
              onPress={() => setShowStartPicker(true)}
            >
              <Text className="text-[11px] text-muted-foreground uppercase tracking-wider">Starts</Text>
              <Text className="text-sm text-foreground mt-1">{formatDayKey(startDayKey)}</Text>
            </Pressable>
            <Pressable
              className="flex-1 rounded-xl border border-border px-3 py-2 bg-background"
              onPress={() => setShowEndPicker(true)}
            >
              <Text className="text-[11px] text-muted-foreground uppercase tracking-wider">Ends</Text>
              <Text className="text-sm text-foreground mt-1">{formatDayKey(endDayKey)}</Text>
            </Pressable>
          </View>
          <View className="flex-row gap-2">
            <Button label="Clear Starts" variant="ghost" onPress={() => onStartDayKeyChange(undefined)} />
            <Button label="Forever" variant="ghost" onPress={() => onEndDayKeyChange(undefined)} />
          </View>
        </View>

        {validationError ? (
          <View className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
            <Text className="text-xs text-danger">{validationError}</Text>
          </View>
        ) : null}

        <View className="flex-row gap-2">
          <Button
            label={isSubmitting ? "Saving..." : submitLabel}
            onPress={onSubmit}
            disabled={isSubmitting || !!validationError}
          />
          {onCancel ? <Button label="Cancel" variant="ghost" onPress={onCancel} /> : null}
        </View>

        {showStartPicker ? (
          <DateTimePicker
            value={parseDayKey(startDayKey)}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_event, date) => {
              setShowStartPicker(Platform.OS === "ios");
              if (date) {
                onStartDayKeyChange(toLocalDayKey(date));
              }
            }}
          />
        ) : null}

        {showEndPicker ? (
          <DateTimePicker
            value={parseDayKey(endDayKey || startDayKey)}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_event, date) => {
              setShowEndPicker(Platform.OS === "ios");
              if (date) {
                onEndDayKeyChange(toLocalDayKey(date));
              }
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

export default HabitForm;
