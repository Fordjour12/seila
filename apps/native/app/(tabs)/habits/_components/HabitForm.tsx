import React from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "../../../../components/ui";
import type {
  HabitAnchor,
  HabitCadence,
  HabitDifficulty,
  HabitKind,
} from "../../../../lib/productivity-refs";
import { formatDayKey, parseDayKey, toLocalDayKey } from "../../../../lib/date";

type SectionKey = "rhythm" | "intensity" | "schedule";

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
  targetValue: string;
  targetUnit: string;
  timezone: string;
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
  onTargetValueChange: (value: string) => void;
  onTargetUnitChange: (value: string) => void;
  onTimezoneChange: (value: string) => void;
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

function SectionCard({
  title,
  description,
  summary,
  open,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  summary?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View className="rounded-2xl border border-border bg-surface/80 overflow-hidden">
      <Pressable onPress={onToggle} className="px-4 py-3">
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="text-base font-sans-semibold text-foreground">{title}</Text>
            <Text className="text-xs text-muted-foreground mt-1 font-sans-medium">{description}</Text>
            {!open && summary ? (
              <Text className="text-xs text-foreground/80 mt-2 font-sans-medium">{summary}</Text>
            ) : null}
          </View>
          <Ionicons
            name={open ? "chevron-down" : "chevron-forward"}
            size={16}
            color="#9ca3af"
          />
        </View>
      </Pressable>
      {open ? <View className="px-4 pb-4 gap-3">{children}</View> : null}
    </View>
  );
}

function Segment<T extends string>({
  items,
  value,
  onChange,
  activeClass,
  activeTextClass,
}: {
  items: readonly T[];
  value: T;
  onChange: (value: T) => void;
  activeClass?: string;
  activeTextClass?: string;
}) {
  const activeBg = activeClass || "bg-primary/10 border-primary/30";
  const activeText = activeTextClass || "text-primary";
  return (
    <View className="flex-row flex-wrap gap-2">
      {items.map((item) => {
        const active = value === item;
        return (
          <Pressable
            key={item}
            className={`rounded-full border px-3 py-2 ${active ? activeBg : "bg-background border-border"}`}
            onPress={() => onChange(item)}
          >
            <Text className={`text-xs font-sans-semibold ${active ? activeText : "text-foreground"}`}>
              {toTitleCase(item)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
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
  targetValue,
  targetUnit,
  timezone,
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
  onTargetValueChange,
  onTargetUnitChange,
  onTimezoneChange,
  onSubmit,
  onCancel,
}: Props) {
  const [showStartPicker, setShowStartPicker] = React.useState(false);
  const [showEndPicker, setShowEndPicker] = React.useState(false);
  const [expanded, setExpanded] = React.useState<Record<SectionKey, boolean>>({
    rhythm: true,
    intensity: false,
    schedule: false,
  });

  const toggleSection = (key: SectionKey) => {
    setExpanded((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <View className="gap-4">
      <View className="relative rounded-3xl border border-border bg-card p-5 overflow-hidden">
        <View className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-primary/10" />
        <View className="absolute -left-10 -bottom-12 h-40 w-40 rounded-full bg-success/10" />

        <Text className="text-xs uppercase tracking-[1.5px] text-muted-foreground font-sans-semibold">
          {title}
        </Text>
        <Text className="text-3xl font-sans-extrabold text-foreground tracking-tight mt-2">
          {kind === "build" ? "Build a healthy rhythm" : "Break a recurring pattern"}
        </Text>
        <Text className="text-sm text-muted-foreground mt-2 font-sans-medium">
          {kind === "build"
            ? "Define a behavior you want to repeat consistently."
            : "Define a behavior you want to reduce and track."}
        </Text>

        <View className="mt-5 gap-3">
          <View className="gap-2">
            <Text className="text-xs uppercase tracking-wider text-muted-foreground font-sans-semibold">Mode</Text>
            <Segment
              items={["build", "break"] as const}
              value={kind}
              onChange={onKindChange}
              activeClass={kind === "break" ? "bg-danger/10 border-danger/30" : "bg-success/10 border-success/30"}
              activeTextClass={kind === "break" ? "text-danger" : "text-success"}
            />
          </View>

          <TextInput
            className="rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground font-sans-medium"
            placeholder={
              kind === "build"
                ? "What do you want to start doing?"
                : "What do you want to stop doing?"
            }
            placeholderTextColor="#6b7280"
            value={name}
            onChangeText={onNameChange}
            autoFocus
          />

          {validationError ? (
            <View className="bg-danger/10 border border-danger/20 rounded-xl px-3 py-2">
              <Text className="text-xs text-danger font-sans-medium">{validationError}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <SectionCard
        title="Rhythm"
        description="Cadence and anchor for this habit"
        summary={`${toTitleCase(cadenceType)} · ${toTitleCase(anchor)}`}
        open={expanded.rhythm}
        onToggle={() => toggleSection("rhythm")}
      >
        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">Cadence</Text>
          <Segment
            items={["daily", "weekdays", "custom"] as const}
            value={cadenceType}
            onChange={onCadenceTypeChange}
            activeClass="bg-warning/10 border-warning/30"
            activeTextClass="text-warning"
          />
        </View>

        {cadenceType === "custom" ? (
          <View className="gap-2">
            <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">Custom Days</Text>
            <View className="flex-row flex-wrap gap-2">
              {DAY_OPTIONS.map((day) => {
                const active = customDays.includes(day.value);
                return (
                  <Pressable
                    key={day.value}
                    className={`rounded-full border px-3 py-2 ${
                      active ? "bg-primary/10 border-primary/30" : "bg-background border-border"
                    }`}
                    onPress={() => onCustomDaysChange(toggleDay(customDays, day.value))}
                  >
                    <Text
                      className={`text-xs font-sans-semibold ${
                        active ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {day.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">Anchor</Text>
          <Segment
            items={["morning", "afternoon", "evening", "anytime"] as const}
            value={anchor}
            onChange={onAnchorChange}
            activeClass="bg-warning/10 border-warning/30"
            activeTextClass="text-warning"
          />
        </View>
      </SectionCard>

      <SectionCard
        title="Intensity"
        description="Difficulty and target definition"
        summary={`${toTitleCase(difficulty)} · ${targetValue || "?"} ${targetUnit || "units"}`}
        open={expanded.intensity}
        onToggle={() => toggleSection("intensity")}
      >
        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">Difficulty</Text>
          <Segment
            items={["low", "medium", "high"] as const}
            value={difficulty}
            onChange={onDifficultyChange}
            activeClass="bg-warning/10 border-warning/30"
            activeTextClass="text-warning"
          />
        </View>

        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">Target</Text>
          <View className="flex-row gap-2">
            <TextInput
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground font-sans-medium"
              placeholder={kind === "build" ? "Value (e.g. 1)" : "Slip budget"}
              placeholderTextColor="#6b7280"
              keyboardType="decimal-pad"
              value={targetValue}
              onChangeText={onTargetValueChange}
            />
            <TextInput
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground font-sans-medium"
              placeholder={kind === "build" ? "Unit (session)" : "Unit (times)"}
              placeholderTextColor="#6b7280"
              value={targetUnit}
              onChangeText={onTargetUnitChange}
            />
          </View>
        </View>
      </SectionCard>

      <SectionCard
        title="Schedule"
        description="Date range and timezone"
        summary={`${formatDayKey(startDayKey)} → ${formatDayKey(endDayKey)} · ${timezone || "UTC"}`}
        open={expanded.schedule}
        onToggle={() => toggleSection("schedule")}
      >
        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">Dates</Text>
          <View className="flex-row gap-2">
            <Pressable
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2"
              onPress={() => setShowStartPicker(true)}
            >
              <Text className="text-[11px] text-muted-foreground uppercase tracking-wider font-sans-semibold">Starts</Text>
              <Text className="text-sm text-foreground mt-1 font-sans-medium">{formatDayKey(startDayKey)}</Text>
            </Pressable>
            <Pressable
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2"
              onPress={() => setShowEndPicker(true)}
            >
              <Text className="text-[11px] text-muted-foreground uppercase tracking-wider font-sans-semibold">Ends</Text>
              <Text className="text-sm text-foreground mt-1 font-sans-medium">{formatDayKey(endDayKey)}</Text>
            </Pressable>
          </View>
          <View className="flex-row gap-2">
            <Button
              label="Clear Start"
              variant="ghost"
              onPress={() => onStartDayKeyChange(undefined)}
            />
            <Button label="Forever" variant="ghost" onPress={() => onEndDayKeyChange(undefined)} />
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider font-sans-semibold">Timezone</Text>
          <TextInput
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground font-sans-medium"
            placeholder="Africa/Accra"
            placeholderTextColor="#6b7280"
            value={timezone}
            onChangeText={onTimezoneChange}
          />
        </View>
      </SectionCard>

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
  );
}

export default HabitForm;
