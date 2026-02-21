import { api } from "@seila/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ScrollView, Text, View } from "react-native";

import { PatternCard, type PatternItem } from "./PatternCard";

function idempotencyKey(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

export function PatternStrip() {
  const patterns = useQuery(api.queries.activePatterns.activePatterns);
  const dismissPattern = useMutation(api.commands.dismissPattern.dismissPattern);
  const pinPattern = useMutation(api.commands.pinPattern.pinPattern);

  const onDismiss = (patternId: PatternItem["_id"]) => {
    void dismissPattern({
      patternId,
      idempotencyKey: idempotencyKey("pattern.dismiss"),
    });
  };

  const onPin = (patternId: PatternItem["_id"]) => {
    void pinPattern({
      patternId,
      idempotencyKey: idempotencyKey("pattern.pin"),
    });
  };

  if (!patterns || patterns.length === 0) {
    return null;
  }

  return (
    <View className="mt-4">
      <Text className="text-foreground font-medium mb-2">Patterns</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {patterns.map((pattern) => (
          <PatternCard key={pattern._id} pattern={pattern} onDismiss={onDismiss} onPin={onPin} />
        ))}
      </ScrollView>
    </View>
  );
}
