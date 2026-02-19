import { api } from "@seila/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Button, Surface } from "heroui-native";
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
        <Text className="text-muted">Loading...</Text>
      </View>
    );
  }

  if (recentCheckins.length === 0) {
    return (
      <View className="p-4">
        <Text className="text-foreground text-lg font-medium mb-2">Check-in History</Text>
        <Text className="text-muted">No check-ins yet. Start tracking your mood!</Text>
      </View>
    );
  }

  return (
    <View className="p-4">
      <Text className="text-foreground text-lg font-medium mb-4">Check-in History</Text>
      <View className="gap-3">
        {recentCheckins.map((checkin) => (
          <Surface key={checkin._id} variant="secondary" className="p-3 rounded-lg">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl">{MOOD_EMOJIS[checkin.mood]}</Text>
                <View>
                  <Text className="text-foreground font-medium">
                    {checkin.type === "weekly" ? "Weekly" : "Daily"} Check-in
                  </Text>
                  <Text className="text-muted text-xs">
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
                  <View
                    key={flag}
                    className="bg-default-100 px-2 py-1 rounded"
                  >
                    <Text className="text-xs text-muted">{flag}</Text>
                  </View>
                ))}
              </View>
            )}

            {checkin.note && (
              <Text className="text-sm text-muted italic">"{checkin.note}"</Text>
            )}

            {checkin.weeklyAnswers && (
              <View className="mt-2 gap-1">
                <Text className="text-xs text-muted">Felt good: {checkin.weeklyAnswers.feltGood}</Text>
                <Text className="text-xs text-muted">Felt hard: {checkin.weeklyAnswers.feltHard}</Text>
                <Text className="text-xs text-muted">Carry forward: {checkin.weeklyAnswers.carryForward}</Text>
              </View>
            )}
          </Surface>
        ))}
      </View>
    </View>
  );
}
