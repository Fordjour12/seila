import { api } from "@seila/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { PatternCard } from "@/components/patterns";

function idempotencyKey(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

export default function PatternsScreen() {
  const patterns = useQuery(api.queries.activePatterns.activePatterns);
  const dismissPattern = useMutation(api.commands.dismissPattern.dismissPattern);
  const pinPattern = useMutation(api.commands.pinPattern.pinPattern);

  return (
    <Container className="px-4 pb-6">
      <View className="py-6 mb-4">
        <Text className="text-3xl font-semibold text-foreground tracking-tight">Patterns</Text>
        <Text className="text-muted text-sm mt-1">
          Signals over noise. Up to three active insights.
        </Text>
      </View>

      {!patterns || patterns.length === 0 ? (
        <Text className="text-muted text-sm">No patterns are active yet.</Text>
      ) : (
        <View className="gap-3">
          {patterns.map((pattern) => (
            <PatternCard
              key={pattern._id}
              pattern={pattern}
              onDismiss={(patternId) => {
                void dismissPattern({
                  patternId,
                  idempotencyKey: idempotencyKey("pattern.dismiss"),
                });
              }}
              onPin={(patternId) => {
                void pinPattern({
                  patternId,
                  idempotencyKey: idempotencyKey("pattern.pin"),
                });
              }}
            />
          ))}
        </View>
      )}
    </Container>
  );
}
