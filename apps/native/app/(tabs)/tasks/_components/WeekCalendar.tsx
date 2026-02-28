import { Surface } from "heroui-native";
import React from "react";
import { Text, View, Pressable, ScrollView } from "react-native";
import { getWeekDays, isSameDay } from "@/lib/task-utils";

interface WeekCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  highlightDates?: Date[];
}

const DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export function WeekCalendar({
  selectedDate,
  onSelectDate,
  highlightDates = [],
}: WeekCalendarProps) {
  const weekDays = getWeekDays(selectedDate);
  const today = new Date();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-4 py-3"
      className="mb-4 grow-0"
      style={{ flexGrow: 0, maxHeight: 96 }}
    >
      <View className="flex-row gap-3">
        {weekDays.map((date, index) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);
          const hasHighlight = highlightDates.some((d) => isSameDay(d, date));

          return (
            <Pressable
              key={date.toISOString()}
              onPress={() => onSelectDate(date)}
            >
              <Surface
                className={`rounded-2xl p-3 min-w-12 items-center justify-center ${
                  isSelected
                    ? "bg-accent border border-accent"
                    : "bg-surface border border-border"
                }`}
              >
                {/* Day Number */}
                <Text
                  className={`text-lg font-semibold mb-1 ${
                    isSelected
                      ? "text-accent-foreground"
                      : isToday
                        ? "text-accent"
                        : "text-foreground"
                  }`}
                >
                  {date.getDate()}
                </Text>

                {/* Day Name */}
                <Text
                  className={`text-xs ${
                    isSelected
                      ? "text-accent-foreground/80"
                      : "text-muted-foreground"
                  }`}
                >
                  {DAY_NAMES[index]}
                </Text>

                {/* Selection/Highlight Indicator (fixed space to avoid layout jump) */}
                <View className="mt-1 h-1.5 items-center justify-center">
                  {isSelected ? (
                    <View className="h-1.5 w-6 rounded-full bg-accent" />
                  ) : hasHighlight ? (
                    <View className="h-1.5 w-1.5 rounded-full bg-accent" />
                  ) : (
                    <View className="h-1.5 w-6 rounded-full bg-transparent" />
                  )}
                </View>
              </Surface>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

interface WeekHeroCardProps {
  date: Date;
  completedCount: number;
  pendingCount: number;
  onFilterPress?: () => void;
  onMenuPress?: () => void;
}

export function WeekHeroCard({
  date,
  completedCount,
  pendingCount,
  onFilterPress,
  onMenuPress,
}: WeekHeroCardProps) {
  const weekNumber = Math.ceil(
    ((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) /
      (1000 * 60 * 60 * 24) +
      1) /
      7,
  );

  return (
    <Surface className="rounded-3xl overflow-hidden mb-4 mx-4 bg-muted">
      {/* Background gradient effect using overlay */}
      <View className="absolute inset-0 bg-gradient-to-br from-accent/10 to-warning/10" />

      <View className="p-5">
        {/* Header with stats */}
        <View className="flex-row justify-between items-start mb-4">
          {/* Completed Count */}
          <View className="flex-row items-center bg-background/80 rounded-full px-3 py-1.5">
            <View className="w-5 h-5 rounded-full bg-success/20 items-center justify-center mr-2">
              <Text className="text-success text-xs">✓</Text>
            </View>
            <Text className="text-sm font-medium text-foreground">
              {completedCount}
            </Text>
          </View>

          {/* Pending Count */}
          <View className="flex-row items-center bg-background/80 rounded-full px-3 py-1.5">
            <View className="w-5 h-5 rounded-full bg-warning/20 items-center justify-center mr-2">
              <Text className="text-warning text-xs">○</Text>
            </View>
            <Text className="text-sm font-medium text-foreground">
              {pendingCount}
            </Text>
          </View>
        </View>

        {/* Week Info */}
        <View className="flex-row justify-between items-end">
          <View>
            <Text className="text-xl font-bold text-foreground mb-1">
              {date.toLocaleDateString(undefined, { weekday: "long" })}
            </Text>
            <Text className="text-sm text-muted-foreground">
              Week {weekNumber}
            </Text>
          </View>

          <View className="items-end">
            <Text className="text-sm font-medium text-accent">
              {date.toLocaleDateString(undefined, { month: "short" })}
            </Text>
            <Text className="text-2xl font-bold text-foreground">
              {date.getDate()}
            </Text>
          </View>
        </View>
      </View>
    </Surface>
  );
}
