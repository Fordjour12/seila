import React from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { Button } from "../../../../components/ui";
import type {
  HabitAnchor,
  HabitDifficulty,
  HabitKind,
} from "../../../../lib/productivity-refs";
import { formatDayKey, parseDayKey, toLocalDayKey } from "../../../../lib/date";

type HabitAddPremiumProps = {
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
  onNameChange: (value: string) => void;
  onAnchorChange: (value: HabitAnchor) => void;
  onDifficultyChange: (value: HabitDifficulty) => void;
  onKindChange: (value: HabitKind) => void;
  onCadenceTypeChange: (value: "daily" | "weekdays" | "custom") => void;
  onCustomDaysChange: (days: number[]) => void;
  onStartDayKeyChange: (value?: string) => void;
  onEndDayKeyChange: (value?: string) => void;
  onSubmit: () => void;
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

function Segment<T extends string>({
  items,
  value,
  onChange,
}: {
  items: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {items.map((item) => {
        const active = value === item;
        return (
          <Pressable
            key={item}
            className={`rounded-full px-3 py-2 border ${
              active ? "bg-warning/10 border-warning/30" : "bg-background border-border"
            }`}
            onPress={() => onChange(item)}
          >
            <Text className={`text-xs font-medium ${active ? "text-warning" : "text-foreground"}`}>
              {toTitleCase(item)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function CustomDays({
  days,
  onChange,
}: {
  days: number[];
  onChange: (days: number[]) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {DAY_OPTIONS.map((day) => {
        const active = days.includes(day.value);
        return (
          <Pressable
            key={day.value}
            className={`rounded-full px-3 py-2 border ${
              active ? "bg-primary/10 border-primary/30" : "bg-background border-border"
            }`}
            onPress={() => onChange(toggleDay(days, day.value))}
          >
            <Text className={`text-xs font-medium ${active ? "text-primary" : "text-foreground"}`}>
              {day.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ErrorBlock({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <View className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
      <Text className="text-xs text-danger">{error}</Text>
    </View>
  );
}

export function HabitAddPremiumCardVariant({
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
  onNameChange,
  onAnchorChange,
  onDifficultyChange,
  onKindChange,
  onCadenceTypeChange,
  onCustomDaysChange,
  onStartDayKeyChange,
  onEndDayKeyChange,
  onSubmit,
}: HabitAddPremiumProps) {
  const [showStartPicker, setShowStartPicker] = React.useState(false);
  const [showEndPicker, setShowEndPicker] = React.useState(false);

  return (
    <View className="gap-3">
      <View className="bg-surface rounded-3xl border border-border p-5 gap-4 shadow-sm">
        <View className="gap-1">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider">
            Habit Creation Card
          </Text>
          <Text className="text-2xl font-serif text-foreground tracking-tight">
            Compose your next habit
          </Text>
        </View>

        <View className="bg-primary/10 border border-primary/20 rounded-2xl p-3 gap-2">
          <Text className="text-xs text-primary uppercase tracking-wider">Habit Type</Text>
          <Text className="text-sm text-foreground">
            Are you building a behavior or breaking one?
          </Text>
          <Segment items={["build", "break"] as const} value={kind} onChange={onKindChange} />
        </View>

        <TextInput
          className="bg-background border border-border rounded-2xl px-4 py-3 text-base text-foreground"
          placeholder={
            kind === "build"
              ? "What do you want to start doing?"
              : "What do you want to stop doing?"
          }
          placeholderTextColor="#6b7280"
          value={name}
          onChangeText={onNameChange}
        />

        <View className="bg-background rounded-2xl border border-border p-3 gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider">Cadence</Text>
          <Segment
            items={["daily", "weekdays", "custom"] as const}
            value={cadenceType}
            onChange={onCadenceTypeChange}
          />
          {cadenceType === "custom" ? <CustomDays days={customDays} onChange={onCustomDaysChange} /> : null}
        </View>

        <View className="bg-background rounded-2xl border border-border p-3 gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider">Anchor</Text>
          <Segment
            items={["morning", "afternoon", "evening", "anytime"] as const}
            value={anchor}
            onChange={onAnchorChange}
          />
        </View>

        <View className="bg-background rounded-2xl border border-border p-3 gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider">Difficulty</Text>
          <Segment
            items={["low", "medium", "high"] as const}
            value={difficulty}
            onChange={onDifficultyChange}
          />
        </View>

        <View className="bg-background rounded-2xl border border-border p-3 gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider">Schedule</Text>
          <View className="flex-row gap-2">
            <Pressable
              className="flex-1 rounded-xl border border-border px-3 py-2 bg-surface"
              onPress={() => setShowStartPicker(true)}
            >
              <Text className="text-[11px] text-muted-foreground uppercase tracking-wider">Starts</Text>
              <Text className="text-sm text-foreground mt-1">{formatDayKey(startDayKey)}</Text>
            </Pressable>
            <Pressable
              className="flex-1 rounded-xl border border-border px-3 py-2 bg-surface"
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

        <View className="bg-warning/10 border border-warning/20 rounded-2xl p-3">
          <Text className="text-xs text-warning uppercase tracking-wider">Preview</Text>
          <Text className="text-sm text-foreground mt-1">
            {name.trim() || "Unnamed Habit"} · {toTitleCase(kind)} · {toTitleCase(cadenceType)} ·{" "}
            {toTitleCase(anchor)} · {toTitleCase(difficulty)}
          </Text>
        </View>

        <ErrorBlock error={validationError} />

        <Button
          label={
            isSubmitting ? "Saving..." : kind === "build" ? "Create Build Habit" : "Create Break Habit"
          }
          onPress={onSubmit}
          disabled={isSubmitting || !!validationError}
        />

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

export default HabitAddPremiumCardVariant;
