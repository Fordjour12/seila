import { api } from "@seila/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Text, View } from "react-native";

const MOOD_EMOJIS: Record<number, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😊",
};

export function CheckinHistory() {
  const recentCheckins = useQuery(api.queries.recentCheckins.recentCheckins, { limit: 30 });

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (!recentCheckins) {
    return (
      <View className="p-4">
        <Text className="text-muted-foreground">Loading...</Text>
      </View>
    );
  }

  if (recentCheckins.length === 0) {
    return (
      <View className="p-4">
        <Text className="text-lg font-medium text-foreground mb-2">Check-in History</Text>
        <Text className="text-muted-foreground">No check-ins yet. Start tracking your mood!</Text>
      </View>
    );
  }

  return (
    <View className="p-4">
      <Text className="text-lg font-medium text-foreground mb-4">Check-in History</Text>
      <View className="gap-3">
        {recentCheckins.map((checkin) => (
          <View key={checkin._id} className="bg-surface rounded-lg border border-border p-3">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl">{MOOD_EMOJIS[checkin.mood]}</Text>
                <View>
                  <Text className="text-foreground font-medium">
                    {checkin.type === "weekly" ? "Weekly" : "Daily"} Check-in
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {formatDate(checkin.occurredAt)} at {formatTime(checkin.occurredAt)}
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-sm text-foreground">Mood: {checkin.mood}/5</Text>
                <Text className="text-sm text-foreground">Energy: {checkin.energy}/5</Text>
              </View>
            </View>

            {checkin.flags && checkin.flags.length > 0 && (
              <View className="flex-row flex-wrap gap-1 mb-2">
                {checkin.flags.map((flag: string) => (
                  <View key={flag} className="bg-muted px-2 py-1 rounded">
                    <Text className="text-xs text-muted-foreground">{flag}</Text>
                  </View>
                ))}
              </View>
            )}

            {checkin.note && <Text className="text-sm text-muted-foreground italic">"{checkin.note}"</Text>}

            {checkin.weeklyAnswers && (
              <View className="mt-2 gap-1">
                <Text className="text-xs text-muted-foreground">
                  Felt good: {checkin.weeklyAnswers.feltGood}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Felt hard: {checkin.weeklyAnswers.feltHard}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Carry forward: {checkin.weeklyAnswers.carryForward}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
