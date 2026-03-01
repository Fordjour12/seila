import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Popover, Separator } from "heroui-native";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { type HabitCadence } from "@/lib/productivity-refs";
import { useModeThemeColors } from "@/lib/theme";

type HabitStatus = "completed" | "skipped" | "snoozed" | "missed" | "relapsed";
type HabitKind = "build" | "break";

export interface HabitCardData {
  habitId: string;
  name: string;
  cadence: HabitCadence;
  kind?: HabitKind;
  breakGoal?: "quit" | "limit";
  breakMetric?: "times" | "minutes";
  targetType?: "binary" | "quantity" | "duration";
  energyLevel?: "low" | "medium" | "high";
  timePreference?: "morning" | "afternoon" | "evening" | "flexible";
  anchor?: string;
  difficulty?: string;
  targetValue?: number;
  targetUnit?: string;
  completed?: boolean;
  todayStatus?: HabitStatus;
}

interface HabitCardProps {
  habit: HabitCardData;
  onPress?: () => void;
  onEditPress?: () => void;
  onStatsPress?: () => void;
  onCompletePress?: () => void;
  onSkipPress?: () => void;
  onSnoozePress?: () => void;
  onRelapsePress?: () => void;
  showMenu?: boolean;
  disabled?: boolean;
}

function toTitleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCadence(cadence: HabitCadence) {
  if (cadence === "daily" || cadence === "weekdays") {
    return toTitleCase(cadence);
  }

  const map = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return cadence.customDays.map((day) => map[day] || "?").join(", ");
}

function formatStatus(status?: HabitStatus) {
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
  if (status === "Relapsed") {
    return "text-danger bg-danger/10 border-danger/20";
  }
  if (status === "Missed") return "text-muted-foreground bg-muted/30 border-border";
  return "text-muted-foreground bg-muted/30 border-border";
}

function targetSummary(habit: HabitCardData) {
  if (habit.targetType === "duration") {
    return `${habit.targetValue || 0} min`;
  }
  if (habit.targetType === "quantity") {
    return `${habit.targetValue || 0} ${habit.targetUnit || "units"}`;
  }
  return "Binary";
}

export function HabitCard({
  habit,
  onPress,
  onEditPress,
  onStatsPress,
  onCompletePress,
  onSkipPress,
  onSnoozePress,
  onRelapsePress,
  showMenu = true,
  disabled = false,
}: HabitCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const colors = useModeThemeColors();
  const status = formatStatus(habit.todayStatus);
  const isCompleted = habit.todayStatus === "completed";
  const isBreakHabit = (habit.kind ?? "build") === "break";
  const primaryLabel = (() => {
    if (isBreakHabit) {
      const goal = habit.breakGoal ?? (habit.targetValue === 0 ? "quit" : "limit");
      const metric = habit.breakMetric ?? (habit.targetType === "duration" ? "minutes" : "times");
      if (goal === "quit") return "Slip +1";
      if (metric === "minutes") return "Log minutes";
      return "+1";
    }
    if (habit.targetType === "quantity" || habit.targetType === "duration") {
      return isCompleted ? "Update value" : "Log value";
    }
    return isCompleted ? "Completed" : "Complete";
  })();

  const actionItems: Array<{
    key: string;
    label: string;
    hint: string;
    icon: React.ComponentProps<typeof Ionicons>["name"];
    toneClass: string;
    labelClass: string;
    onPress?: () => void;
  }> = [
    {
      key: "complete",
      label: "Complete",
      hint: "Mark this habit done for today",
      icon: "checkmark-circle-outline",
      toneClass: "bg-success/10 border-success/30",
      labelClass: "text-foreground",
      onPress: onCompletePress,
    },
    {
      key: "skip",
      label: "Skip",
      hint: "Skip this habit without breaking flow",
      icon: "play-skip-forward-outline",
      toneClass: "bg-warning/10 border-warning/30",
      labelClass: "text-foreground",
      onPress: onSkipPress,
    },
    {
      key: "snooze",
      label: "Snooze",
      hint: "Remind me later today",
      icon: "alarm-outline",
      toneClass: "bg-primary/10 border-primary/30",
      labelClass: "text-foreground",
      onPress: onSnoozePress,
    },
    {
      key: "relapse",
      label: "Relapse",
      hint: "Mark a relapse or miss event",
      icon: "refresh-circle-outline",
      toneClass: "bg-danger/10 border-danger/30",
      labelClass: "text-danger",
      onPress: onRelapsePress,
    },
  ];

  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <Card className="mb-3 rounded-3xl overflow-hidden bg-surface border border-border">
        <Card.Body className="p-4">
          <View className="absolute -right-10 -top-12 h-28 w-28 rounded-full bg-primary/10" />

          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-base font-sans-bold text-foreground">{habit.name}</Text>
              <View className="mt-2 flex-row flex-wrap gap-1.5">
                <View className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1">
                  <Text className="text-[10px] uppercase font-sans-bold text-primary">
                    {toTitleCase(habit.kind || "build")}
                  </Text>
                </View>
                <View className="rounded-full border border-border bg-background px-2.5 py-1">
                  <Text className="text-[10px] uppercase font-sans-bold text-foreground/80">
                    {toTitleCase(habit.energyLevel || habit.difficulty || "low")}
                  </Text>
                </View>
              </View>
            </View>
            <View className={`rounded-full border px-2.5 py-1 ${statusToneClass(status)}`}>
              <Text className="text-[10px] uppercase font-sans-bold">{status}</Text>
            </View>
          </View>

          <View className="mt-3 rounded-2xl border border-border bg-background/80 px-3 py-2 gap-1.5">
            <View className="flex-row items-center gap-2">
              <Ionicons name="calendar-outline" size={13} color={colors.foreground} />
              <Text className="text-xs text-muted-foreground font-sans-medium flex-1">
                {formatCadence(habit.cadence)}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Ionicons name="time-outline" size={13} color={colors.foreground} />
              <Text className="text-xs text-muted-foreground font-sans-medium flex-1">
                {toTitleCase(habit.timePreference || habit.anchor || "flexible")}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Ionicons name="flag-outline" size={13} color={colors.foreground} />
              <Text className="text-xs text-muted-foreground font-sans-medium flex-1">
                {targetSummary(habit)}
              </Text>
            </View>
          </View>

          <View className="mt-3 flex-row items-center gap-2">
            <Pressable
              className={`flex-1 rounded-xl border px-3 py-2.5 ${
                isCompleted ? "bg-success/10 border-success/30" : "bg-primary border-primary"
              }`}
              onPress={(e) => {
                e.stopPropagation();
                onCompletePress?.();
              }}
            >
              <Text
                className={`text-center text-xs font-sans-bold uppercase ${
                  isCompleted ? "text-success" : "text-primary-foreground"
                }`}
              >
                {primaryLabel}
              </Text>
            </Pressable>

            <View className="flex-row gap-1.5">
              {!isBreakHabit ? (
                <>
                  <Pressable
                    className="rounded-xl bg-warning/10 border border-warning/20 px-2.5 py-2.5"
                    onPress={(e) => {
                      e.stopPropagation();
                      onSkipPress?.();
                    }}
                  >
                    <Ionicons name="play-skip-forward-outline" size={14} color="#f59e0b" />
                  </Pressable>
                  <Pressable
                    className="rounded-xl bg-primary/10 border border-primary/20 px-2.5 py-2.5"
                    onPress={(e) => {
                      e.stopPropagation();
                      onSnoozePress?.();
                    }}
                  >
                    <Ionicons name="alarm-outline" size={14} color="#3b82f6" />
                  </Pressable>
                </>
              ) : null}
              {showMenu && (
                <Popover presentation="bottom-sheet" isOpen={menuOpen} onOpenChange={setMenuOpen}>
                  <Popover.Trigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      isIconOnly
                      onPress={(e) => {
                        e.stopPropagation();
                        setMenuOpen(true);
                      }}
                    >
                      <Ionicons name="ellipsis-horizontal-outline" size={16} color={colors.foreground} />
                    </Button>
                  </Popover.Trigger>

                  <Popover.Portal>
                    <Popover.Overlay className="bg-black/45" />
                    <Popover.Content
                      presentation="bottom-sheet"
                      className="rounded-t-3xl border border-border bg-surface px-4 pt-4 pb-6"
                    >
                      <Text className="text-base font-sans-semibold text-foreground">Habit Actions</Text>
                      <Text className="text-sm text-muted-foreground mt-1 mb-3">{habit.name}</Text>

                      <View className="gap-2">
                        {actionItems.map((item) => (
                          <Pressable
                            key={item.key}
                            className={`flex-row items-center rounded-2xl border px-3 py-3 ${item.toneClass}`}
                            onPress={() => {
                              setMenuOpen(false);
                              item.onPress?.();
                            }}
                          >
                            <View className="h-9 w-9 rounded-full bg-background/70 items-center justify-center">
                              <Ionicons
                                name={item.icon}
                                size={18}
                                color={
                                  item.key === "complete"
                                    ? "#22c55e"
                                    : item.key === "skip"
                                      ? "#f59e0b"
                                      : item.key === "snooze"
                                        ? "#3b82f6"
                                        : "#ef4444"
                                }
                              />
                            </View>
                            <View className="flex-1 ml-3">
                              <Text className={`text-sm font-sans-semibold ${item.labelClass}`}>
                                {item.label}
                              </Text>
                              <Text className="text-xs text-muted-foreground mt-0.5">{item.hint}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={colors.foreground} />
                          </Pressable>
                        ))}
                      </View>

                      <Pressable
                        className="items-center justify-center py-4 mt-3 border-t border-border"
                        onPress={() => setMenuOpen(false)}
                      >
                        <Text className="text-sm text-muted-foreground">Cancel</Text>
                      </Pressable>
                    </Popover.Content>
                  </Popover.Portal>
                </Popover>
              )}
            </View>
          </View>

          <View className="mt-3 flex-row gap-2">
            <Pressable
              className="rounded-lg bg-warning/10 border border-warning/20 px-3 py-1.5"
              onPress={(e) => {
                e.stopPropagation();
                onEditPress?.();
              }}
            >
              <Text className="text-[11px] font-sans-semibold text-warning uppercase">Edit</Text>
            </Pressable>
            <Pressable
              className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5"
              onPress={(e) => {
                e.stopPropagation();
                onStatsPress?.();
              }}
            >
              <Text className="text-[11px] font-sans-semibold text-primary uppercase">Stats</Text>
            </Pressable>
          </View>
        </Card.Body>
      </Card>
    </Pressable>
  );
}

export function HabitCardSeparator() {
  return <Separator className="my-1" />;
}
