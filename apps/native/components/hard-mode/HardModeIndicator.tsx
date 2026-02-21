import { useQuery } from "convex/react";
import { Text, View } from "react-native";
import { SpicedCard } from "@/components/ui/SpicedCard";
import { hardModeSessionRef } from "@/lib/hard-mode-refs";

export function HardModeIndicator() {
  const session = useQuery(hardModeSessionRef, {});

  if (!session || !session.isActive) {
    return null;
  }

  return (
    <SpicedCard className="p-4 mt-4 bg-destructive/5 border-destructive/20 shadow-none">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
          <Text className="text-foreground text-sm font-semibold tracking-tight">
            Hard Mode Active
          </Text>
        </View>
        <Text className="text-muted-foreground text-xs font-medium">
          Ends {new Date(session.windowEnd).toLocaleDateString()}
        </Text>
      </View>
    </SpicedCard>
  );
}
