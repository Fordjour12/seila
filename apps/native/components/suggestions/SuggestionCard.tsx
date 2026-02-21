import { Button } from "heroui-native";
import { Text, View } from "react-native";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { SpicedCard } from "@/components/ui/SpicedCard";

export type SuggestionItem = {
  _id: Id<"suggestions">;
  policy: string;
  headline: string;
  subtext: string;
  priority: number;
  action?: {
    type: "open_screen" | "run_command";
    label: string;
    payload?: Record<string, unknown>;
  };
};

type Props = {
  suggestion: SuggestionItem;
  onDismiss: (id: Id<"suggestions">) => void;
  onAction?: (suggestion: SuggestionItem) => void;
};

export function SuggestionCard({ suggestion, onDismiss, onAction }: Props) {
  return (
    <SpicedCard className="w-80 p-5 rounded-xl mr-4 flex-1 justify-between">
      <View className="gap-2">
        <Text className="text-foreground text-lg font-bold tracking-tight leading-6">
          {suggestion.headline}
        </Text>
        <Text className="text-muted-foreground text-sm leading-5">{suggestion.subtext}</Text>
      </View>
      <View className="flex-row gap-3 mt-4 pt-3 border-t border-border/5">
        {suggestion.action ? (
          <Button
            size="sm"
            variant="primary"
            className="flex-1 rounded-full shadow-sm"
            onPress={() => onAction?.(suggestion)}
          >
            {suggestion.action.label}
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          className="flex-1 rounded-full"
          onPress={() => onDismiss(suggestion._id)}
        >
          Dismiss
        </Button>
      </View>
    </SpicedCard>
  );
}
