import { api } from "@seila/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { SuggestionCard, type SuggestionItem } from "./SuggestionCard";

function idempotencyKey(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

export function SuggestionStrip() {
  const suggestions = useQuery(api.queries.activeSuggestions.activeSuggestions) as
    | SuggestionItem[]
    | undefined;
  const dismissSuggestion = useMutation(api.commands.dismissSuggestion.dismissSuggestion);

  const onDismiss = (suggestionId: SuggestionItem["_id"]) => {
    void dismissSuggestion({
      suggestionId,
      idempotencyKey: idempotencyKey("suggestion.dismiss"),
    });
  };

  const onAction = (suggestion: SuggestionItem) => {
    if (!suggestion.action) {
      return;
    }

    if (suggestion.action.type === "open_screen") {
      const screen = suggestion.action.payload?.screen;
      if (typeof screen === "string") {
        if (screen === "checkin") {
          router.push("/checkin");
          return;
        }

        if (screen === "tasks") {
          router.push("/");
          return;
        }

        if (screen === "finance") {
          router.push("/finance");
          return;
        }

        if (screen === "patterns") {
          router.push("/patterns");
          return;
        }

        if (screen === "weekly-review") {
          router.push("/");
          return;
        }
      }
    }
  };

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <View className="mt-4">
      <Text className="text-foreground font-medium mb-2">Suggestions</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion._id}
            suggestion={suggestion}
            onDismiss={onDismiss}
            onAction={onAction}
          />
        ))}
      </ScrollView>
    </View>
  );
}
