import type { Doc, Id } from "@seila/backend/convex/_generated/dataModel";
import { Button } from "heroui-native";
import { Text, View } from "react-native";
import { SpicedCard } from "@/components/ui/SpicedCard";

export type PatternItem = Doc<"patterns">;

type Props = {
  pattern: PatternItem;
  onDismiss: (id: Id<"patterns">) => void;
  onPin: (id: Id<"patterns">) => void;
};

export function PatternCard({ pattern, onDismiss, onPin }: Props) {
  return (
    <SpicedCard className="w-80 p-5 rounded-xl mr-4 flex-1 justify-between">
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-foreground text-lg font-bold tracking-tight leading-6 flex-1 pr-2">
            {pattern.headline}
          </Text>
          <View className="bg-primary/10 px-2 py-1 rounded-md">
            <Text className="text-primary text-[10px] font-bold">
              {(pattern.confidence * 100).toFixed(0)}%
            </Text>
          </View>
        </View>
        <Text className="text-muted-foreground text-sm leading-5">
          {pattern.subtext}
        </Text>
      </View>

      <View className="flex-row gap-3 mt-4 pt-3 border-t border-border/5">
        <Button
          size="sm"
          variant={pattern.pinnedAt ? "secondary" : "primary"}
          className="flex-1 rounded-full shadow-sm"
          onPress={() => onPin(pattern._id)}
        >
          {pattern.pinnedAt ? "Pinned" : "Pin Insight"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="flex-1 rounded-full"
          onPress={() => onDismiss(pattern._id)}
        >
          Dismiss
        </Button>
      </View>
    </SpicedCard>
  );
}
