import { api } from "@seila/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Button } from "heroui-native";
import { Text, View } from "react-native";

import { SpicedCard } from "@/components/ui/SpicedCard";

const MOOD_EMOJIS: Record<number, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😊",
};

interface CheckinWidgetProps {
  onPress?: () => void;
}

export function CheckinWidget({ onPress }: CheckinWidgetProps) {
  const lastCheckin = useQuery(api.queries.lastCheckin.lastCheckin);

  const formatTimeAgo = (timestamp?: number) => {
    if (!timestamp) return "";
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    }
    if (hours > 0) {
      return `${hours}h ago`;
    }
    return "Just now";
  };

  return (
    <SpicedCard className="p-5 flex-row items-center justify-between">
      <View className="flex-row items-center gap-4 flex-1">
        {lastCheckin ? (
          <>
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Text className="text-3xl leading-9">{MOOD_EMOJIS[lastCheckin.mood] ?? "😐"}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-foreground text-lg font-semibold tracking-tight">
                Mood: {lastCheckin.mood}/5
              </Text>
              <Text className="text-muted-foreground text-sm font-medium">
                Energy: {lastCheckin.energy}/5 • {formatTimeAgo(lastCheckin.occurredAt)}
              </Text>
            </View>
          </>
        ) : (
          <View>
            <Text className="text-foreground text-lg font-semibold tracking-tight">Check in</Text>
            <Text className="text-muted-foreground text-sm">
              Track your energy to unlock insights
            </Text>
          </View>
        )}
      </View>
      <Button
        variant="primary"
        size="sm"
        onPress={onPress}
        className="rounded-full px-5 shadow-sm"
      >
        {lastCheckin ? "Update" : "Start"}
      </Button>
    </SpicedCard>
  );
}
