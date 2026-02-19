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

interface CheckinWidgetProps {
  onPress?: () => void;
}

export function CheckinWidget({ onPress }: CheckinWidgetProps) {
  const lastCheckin = useQuery(api.queries.lastCheckin.lastCheckin);

  const formatTimeAgo = (timestamp: number) => {
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
    <Surface variant="secondary" className="p-4 rounded-xl">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          {lastCheckin ? (
            <>
              <Text className="text-3xl">{MOOD_EMOJIS[lastCheckin.mood]}</Text>
              <View>
                <Text className="text-foreground font-medium">
                  Mood: {lastCheckin.mood}/5
                </Text>
                <Text className="text-muted text-sm">
                  Energy: {lastCheckin.energy}/5 • {formatTimeAgo(lastCheckin.occurredAt)}
                </Text>
              </View>
            </>
          ) : (
            <View>
              <Text className="text-foreground font-medium">No check-ins yet</Text>
              <Text className="text-muted text-sm">
                How are you feeling today?
              </Text>
            </View>
          )}
        </View>
        <Button variant="secondary" size="sm" onPress={onPress}>
          {lastCheckin ? "Update" : "Check in"}
        </Button>
      </View>
    </Surface>
  );
}
