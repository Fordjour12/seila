import { useQuery } from "convex/react";
import { Surface } from "heroui-native";
import { Text, View } from "react-native";

import { hardModeSessionRef } from "@/lib/hard-mode-refs";

export function HardModeIndicator() {
  const session = useQuery(hardModeSessionRef, {});

  if (!session || !session.isActive) {
    return null;
  }

  return (
    <Surface variant="secondary" className="p-3 rounded-lg mt-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-foreground text-sm font-medium">Hard Mode active</Text>
        <Text className="text-muted text-xs">
          until {new Date(session.windowEnd).toLocaleDateString()}
        </Text>
      </View>
    </Surface>
  );
}
