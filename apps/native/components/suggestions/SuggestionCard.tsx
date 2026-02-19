import { Button, Surface } from "heroui-native";
import { Text, View } from "react-native";
import type { Id } from "@seila/backend/convex/_generated/dataModel";

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
    <Surface variant="secondary" className="w-80 p-4 rounded-xl mr-3">
      <View className="gap-2">
        <Text className="text-foreground font-semibold">{suggestion.headline}</Text>
        <Text className="text-muted text-sm">{suggestion.subtext}</Text>
        <View className="flex-row gap-2 mt-2">
          {suggestion.action ? (
            <Button size="sm" variant="primary" onPress={() => onAction?.(suggestion)}>
              {suggestion.action.label}
            </Button>
          ) : null}
          <Button size="sm" variant="secondary" onPress={() => onDismiss(suggestion._id)}>
            Dismiss
          </Button>
        </View>
      </View>
    </Surface>
  );
}
