import { api } from "@seila/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Surface } from "heroui-native";
import { Text, View, ScrollView } from "react-native";

const MOOD_EMOJIS: Record<number, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😊",
};

interface DashboardProps {
  compact?: boolean;
}

export function Dashboard({ compact = false }: DashboardProps) {
  const untypedApi = api as any;

  const moodTrend = useQuery(untypedApi.queries.moodTrend.moodTrend) as {
    averageMood: number;
    averageEnergy: number;
    daysTracked: number;
  } | null;

  const todayHabits = useQuery(untypedApi.queries.todayHabits.todayHabits) as any[] | null;
  const lastCheckin = useQuery(untypedApi.queries.lastCheckin.lastCheckin) as any | null;
  const lastReview = useQuery(untypedApi.queries.reviewQueries.lastReview) as any | null;
  const activePatterns = useQuery(untypedApi.queries.activePatterns.activePatterns) as any[] | null;
  const todayFocus = useQuery(untypedApi.queries.taskQueries.todayFocus) as any[] | null;

  const completedHabits = todayHabits?.filter((h) => h.todayStatus === "completed").length ?? 0;
  const totalHabits = todayHabits?.length ?? 0;
  const habitRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  if (compact) {
    return (
      <View className="flex-row gap-2 overflow-x-auto py-2">
        {moodTrend && moodTrend.daysTracked > 0 && (
          <View className="bg-default-100 px-3 py-2 rounded-lg items-center">
            <Text className="text-xl">{MOOD_EMOJIS[Math.round(moodTrend.averageMood)]}</Text>
            <Text className="text-xs text-muted">Mood</Text>
          </View>
        )}
        <View className="bg-default-100 px-3 py-2 rounded-lg items-center">
          <Text className="text-xl font-medium text-foreground">{habitRate}%</Text>
          <Text className="text-xs text-muted">Habits</Text>
        </View>
        {todayFocus && todayFocus.length > 0 && (
          <View className="bg-default-100 px-3 py-2 rounded-lg items-center">
            <Text className="text-xl font-medium text-foreground">{todayFocus.length}/3</Text>
            <Text className="text-xs text-muted">Focus</Text>
          </View>
        )}
        {activePatterns && activePatterns.length > 0 && (
          <View className="bg-default-100 px-3 py-2 rounded-lg items-center">
            <Text className="text-xl">📊</Text>
            <Text className="text-xs text-muted">Patterns</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View className="p-4 gap-4">
      <Text className="text-foreground text-lg font-medium">Your Week at a Glance</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-3">
          {moodTrend && moodTrend.daysTracked > 0 && (
            <Surface variant="secondary" className="p-4 rounded-xl min-w-[140px]">
              <Text className="text-muted text-xs mb-1">Mood Trend</Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-3xl">{MOOD_EMOJIS[Math.round(moodTrend.averageMood)]}</Text>
                <View>
                  <Text className="text-foreground font-medium">{moodTrend.averageMood.toFixed(1)}/5</Text>
                  <Text className="text-muted text-xs">{moodTrend.daysTracked} days</Text>
                </View>
              </View>
            </Surface>
          )}

          <Surface variant="secondary" className="p-4 rounded-xl min-w-[140px]">
            <Text className="text-muted text-xs mb-1">Today's Habits</Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-3xl font-medium text-foreground">{completedHabits}</Text>
              <View>
                <Text className="text-foreground font-medium">/ {totalHabits}</Text>
                <Text className="text-muted text-xs">{habitRate}% done</Text>
              </View>
            </View>
          </Surface>

          {todayFocus && (
            <Surface variant="secondary" className="p-4 rounded-xl min-w-[140px]">
              <Text className="text-muted text-xs mb-1">Focus</Text>
              <Text className="text-3xl font-medium text-foreground">{todayFocus.length}</Text>
              <Text className="text-muted text-xs">/ 3 tasks</Text>
            </Surface>
          )}

          {activePatterns && activePatterns.length > 0 && (
            <Surface variant="secondary" className="p-4 rounded-xl min-w-[140px]">
              <Text className="text-muted text-xs mb-1">Active Patterns</Text>
              <Text className="text-3xl font-medium text-foreground">{activePatterns.length}</Text>
              <Text className="text-muted text-xs">detected</Text>
            </Surface>
          )}
        </View>
      </ScrollView>

      {lastReview && lastReview.closedAt && (
        <Surface variant="secondary" className="p-4 rounded-xl">
          <Text className="text-muted text-xs mb-2">Last Weekly Review</Text>
          <Text className="text-foreground text-sm font-medium mb-1">
            Week of {new Date(lastReview.weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </Text>
          {lastReview.intentions && lastReview.intentions.length > 0 && (
            <View className="mt-2">
              <Text className="text-muted text-xs mb-1">Intentions:</Text>
              {lastReview.intentions.slice(0, 2).map((int: string, i: number) => (
                <Text key={i} className="text-foreground text-sm">• {int}</Text>
              ))}
            </View>
          )}
        </Surface>
      )}

      {!moodTrend && !todayHabits && (
        <View className="p-4 bg-default-100 rounded-xl">
          <Text className="text-muted text-sm text-center">
            Start tracking to see your dashboard here.
          </Text>
        </View>
      )}
    </View>
  );
}
