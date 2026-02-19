import type { Doc, Id } from "@seila/backend/convex/_generated/dataModel";
import { Button, Surface } from "heroui-native";
import { Text, View } from "react-native";

export type PatternItem = Doc<"patterns">;

type Props = {
  pattern: PatternItem;
  onDismiss: (id: Id<"patterns">) => void;
  onPin: (id: Id<"patterns">) => void;
};

export function PatternCard({ pattern, onDismiss, onPin }: Props) {
  return (
    <Surface variant="secondary" className="w-80 p-4 rounded-xl mr-3">
      <View className="gap-2">
        <Text className="text-foreground font-semibold">{pattern.headline}</Text>
        <Text className="text-muted text-sm">{pattern.subtext}</Text>
        <Text className="text-muted text-xs">Confidence {(pattern.confidence * 100).toFixed(0)}%</Text>
        <View className="flex-row gap-2 mt-2">
          <Button size="sm" variant={pattern.pinnedAt ? "secondary" : "primary"} onPress={() => onPin(pattern._id)}>
            {pattern.pinnedAt ? "Pinned" : "Pin"}
          </Button>
          <Button size="sm" variant="secondary" onPress={() => onDismiss(pattern._id)}>
            Dismiss
          </Button>
        </View>
      </View>
    </Surface>
  );
}
