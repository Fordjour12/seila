import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui";
import type {
  HabitBreakGoal,
  HabitBreakMetric,
  HabitEnergyLevel,
  HabitFrequencyType,
  HabitKind,
  HabitTargetType,
  HabitTimePreference,
} from "@/lib/productivity-refs";

type Props = {
  title: string;
  name: string;
  kind: HabitKind;
  targetType: HabitTargetType;
  breakGoal: HabitBreakGoal;
  breakMetric: HabitBreakMetric;
  frequencyType: HabitFrequencyType;
  frequencyEveryXDays: string;
  frequencyWeekdays: number[];
  targetValue: string;
  targetUnit: string;
  identityTags: string[];
  energyLevel: HabitEnergyLevel;
  timePreference: HabitTimePreference;
  validationError: string | null;
  isSubmitting: boolean;
  submitLabel: string;
  onNameChange: (value: string) => void;
  onKindChange: (value: HabitKind) => void;
  onTargetTypeChange: (value: HabitTargetType) => void;
  onBreakGoalChange: (value: HabitBreakGoal) => void;
  onBreakMetricChange: (value: HabitBreakMetric) => void;
  onFrequencyTypeChange: (value: HabitFrequencyType) => void;
  onFrequencyEveryXDaysChange: (value: string) => void;
  onFrequencyWeekdaysChange: (days: number[]) => void;
  onTargetValueChange: (value: string) => void;
  onTargetUnitChange: (value: string) => void;
  onIdentityTagsChange: (tags: string[]) => void;
  onEnergyLevelChange: (value: HabitEnergyLevel) => void;
  onTimePreferenceChange: (value: HabitTimePreference) => void;
  onSubmit: () => void;
  onCancel?: () => void;
};

const IDENTITY_TAG_OPTIONS = [
  "Health",
  "Faith",
  "Learning",
  "Discipline",
  "Finance",
  "Relationships",
  "Custom",
] as const;

const WEEKDAYS = [
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
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toggleNumber(items: number[], value: number) {
  if (items.includes(value)) {
    return items.filter((item) => item !== value);
  }
  return [...items, value].sort((a, b) => a - b);
}

function toggleString(items: string[], value: string) {
  if (items.includes(value)) {
    return items.filter((item) => item !== value);
  }
  return [...items, value];
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
            className={`rounded-full border px-3 py-2 ${
              active ? "bg-primary/10 border-primary/30" : "bg-background border-border"
            }`}
            onPress={() => onChange(item)}
          >
            <Text className={`text-xs font-sans-semibold ${active ? "text-primary" : "text-foreground"}`}>
              {toTitleCase(item)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function HabitForm({
  title,
  name,
  kind,
  targetType,
  breakGoal,
  breakMetric,
  frequencyType,
  frequencyEveryXDays,
  frequencyWeekdays,
  targetValue,
  targetUnit,
  identityTags,
  energyLevel,
  timePreference,
  validationError,
  isSubmitting,
  submitLabel,
  onNameChange,
  onKindChange,
  onTargetTypeChange,
  onBreakGoalChange,
  onBreakMetricChange,
  onFrequencyTypeChange,
  onFrequencyEveryXDaysChange,
  onFrequencyWeekdaysChange,
  onTargetValueChange,
  onTargetUnitChange,
  onIdentityTagsChange,
  onEnergyLevelChange,
  onTimePreferenceChange,
  onSubmit,
  onCancel,
}: Props) {
  const showBuildValue = kind === "build" && (targetType === "quantity" || targetType === "duration");
  const showBreakLimit = kind === "break" && breakGoal === "limit";

  return (
    <View className="gap-4">
      <View className="rounded-2xl border border-border bg-surface p-4 gap-3">
        <Text className="text-xs uppercase tracking-[1.5px] text-muted-foreground font-sans-semibold">
          {title}
        </Text>

        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">
            Habit Name *
          </Text>
          <TextInput
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground font-sans-medium"
            value={name}
            onChangeText={onNameChange}
            placeholder={kind === "build" ? "Read 10 pages" : "No social media"}
            placeholderTextColor="#6b7280"
          />
        </View>

        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">
            Mode *
          </Text>
          <Segment items={["build", "break"] as const} value={kind} onChange={onKindChange} />
        </View>

        {kind === "build" ? (
          <>
            <View className="gap-2">
              <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">
                Target Type *
              </Text>
              <Segment
                items={["binary", "quantity", "duration"] as const}
                value={targetType}
                onChange={onTargetTypeChange}
              />
            </View>

            {showBuildValue ? (
              <View className="gap-2">
                <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">
                  Target Value *
                </Text>
                <View className="flex-row gap-2">
                  <TextInput
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground font-sans-medium"
                    keyboardType="decimal-pad"
                    value={targetValue}
                    onChangeText={onTargetValueChange}
                    placeholder={targetType === "duration" ? "20" : "10"}
                    placeholderTextColor="#6b7280"
                  />
                  {targetType === "quantity" ? (
                    <TextInput
                      className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground font-sans-medium"
                      value={targetUnit}
                      onChangeText={onTargetUnitChange}
                      placeholder="pages"
                      placeholderTextColor="#6b7280"
                    />
                  ) : (
                    <View className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 justify-center">
                      <Text className="text-sm text-muted-foreground font-sans-medium">minutes</Text>
                    </View>
                  )}
                </View>
              </View>
            ) : null}
          </>
        ) : (
          <>
            <View className="gap-2">
              <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">
                Break Goal *
              </Text>
              <Segment items={["quit", "limit"] as const} value={breakGoal} onChange={onBreakGoalChange} />
            </View>

            {showBreakLimit ? (
              <View className="gap-2">
                <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">
                  Metric *
                </Text>
                <Segment
                  items={["times", "minutes"] as const}
                  value={breakMetric}
                  onChange={onBreakMetricChange}
                />
                <TextInput
                  className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground font-sans-medium"
                  keyboardType="decimal-pad"
                  value={targetValue}
                  onChangeText={onTargetValueChange}
                  placeholder={breakMetric === "minutes" ? "Max minutes" : "Max times"}
                  placeholderTextColor="#6b7280"
                />
              </View>
            ) : (
              <View className="rounded-xl border border-border bg-background px-3 py-2.5">
                <Text className="text-xs text-muted-foreground">Quit mode logs slips and treats 0 as success.</Text>
              </View>
            )}
          </>
        )}

        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">
            Frequency *
          </Text>
          <Segment
            items={["daily", "weekly"] as const}
            value={frequencyType}
            onChange={onFrequencyTypeChange}
          />
        </View>

        {frequencyType === "daily" ? (
          <View className="gap-2">
            <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">
              Every X Days (optional)
            </Text>
            <TextInput
              className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground font-sans-medium"
              keyboardType="number-pad"
              value={frequencyEveryXDays}
              onChangeText={onFrequencyEveryXDaysChange}
              placeholder="Leave empty for every day"
              placeholderTextColor="#6b7280"
            />
          </View>
        ) : (
          <View className="gap-2">
            <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">
              Weekdays *
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const active = frequencyWeekdays.includes(day.value);
                return (
                  <Pressable
                    key={day.value}
                    className={`rounded-full border px-3 py-2 ${
                      active ? "bg-primary/10 border-primary/30" : "bg-background border-border"
                    }`}
                    onPress={() => onFrequencyWeekdaysChange(toggleNumber(frequencyWeekdays, day.value))}
                  >
                    <Text
                      className={`text-xs font-sans-semibold ${active ? "text-primary" : "text-foreground"}`}
                    >
                      {day.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>

      <View className="rounded-2xl border border-border bg-surface p-4 gap-3">
        <Text className="text-sm font-sans-semibold text-foreground">Identity and Intelligence</Text>

        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">
            Identity Tags
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {IDENTITY_TAG_OPTIONS.map((tag) => {
              const active = identityTags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  className={`rounded-full border px-3 py-2 ${
                    active ? "bg-primary/10 border-primary/30" : "bg-background border-border"
                  }`}
                  onPress={() => onIdentityTagsChange(toggleString(identityTags, tag))}
                >
                  <Text
                    className={`text-xs font-sans-semibold ${active ? "text-primary" : "text-foreground"}`}
                  >
                    {tag}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">
            Energy Required
          </Text>
          <Segment
            items={["low", "medium", "high"] as const}
            value={energyLevel}
            onChange={onEnergyLevelChange}
          />
        </View>

        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">
            Time Preference
          </Text>
          <Segment
            items={["morning", "afternoon", "evening", "flexible"] as const}
            value={timePreference}
            onChange={onTimePreferenceChange}
          />
        </View>
      </View>

      {validationError ? (
        <View className="bg-danger/10 border border-danger/20 rounded-xl px-3 py-2">
          <Text className="text-xs text-danger font-sans-medium">{validationError}</Text>
        </View>
      ) : null}

      <View className="flex-row gap-3 mt-2">
        {onCancel ? (
          <Button
            variant="secondary"
            label="Cancel"
            disabled={isSubmitting}
            style={{ flex: 1 }}
            onPress={onCancel}
          />
        ) : null}
        <Button
          variant="primary"
          label={isSubmitting ? "Saving..." : submitLabel}
          style={{ flex: 1 }}
          disabled={isSubmitting || Boolean(validationError)}
          onPress={onSubmit}
        />
      </View>
    </View>
  );
}
