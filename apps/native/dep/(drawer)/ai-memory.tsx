import { useMutation, useQuery } from "convex/react";
import { Button, Surface } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { aiContextViewRef, clearAiContextRef } from "@/lib/ai-refs";

function idempotencyKey(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

export default function AiMemoryScreen() {
  const aiContext = useQuery(aiContextViewRef, {});
  const clearAiContext = useMutation(clearAiContextRef);

  const model = aiContext?.workingModel;

  return (
    <Container className="px-4 pb-6">
      <View className="py-6 mb-4">
        <Text className="text-3xl font-semibold text-foreground tracking-tight">AI Memory</Text>
        <Text className="text-muted text-sm mt-1">What the AI knows about you right now.</Text>
      </View>

      {model ? (
        <Surface variant="secondary" className="rounded-xl p-4 mb-4 gap-3">
          <View>
            <Text className="text-muted text-xs">Energy patterns</Text>
            <Text className="text-foreground text-sm">{model.energyPatterns}</Text>
          </View>
          <View>
            <Text className="text-muted text-xs">Habit resonance</Text>
            <Text className="text-foreground text-sm">{model.habitResonance}</Text>
          </View>
          <View>
            <Text className="text-muted text-xs">Flag patterns</Text>
            <Text className="text-foreground text-sm">{model.flagPatterns}</Text>
          </View>
          <View>
            <Text className="text-muted text-xs">Trigger signals</Text>
            <Text className="text-foreground text-sm">{model.triggerSignals}</Text>
          </View>
          <View>
            <Text className="text-muted text-xs">Suggestion response</Text>
            <Text className="text-foreground text-sm">{model.suggestionResponse}</Text>
          </View>
          <View>
            <Text className="text-muted text-xs">Review engagement</Text>
            <Text className="text-foreground text-sm">{model.reviewEngagement}</Text>
          </View>
          <View>
            <Text className="text-muted text-xs">Finance relationship</Text>
            <Text className="text-foreground text-sm">{model.financeRelationship}</Text>
          </View>
        </Surface>
      ) : (
        <Text className="text-muted text-sm">Loading AI memory...</Text>
      )}

      <Surface variant="secondary" className="rounded-xl p-4 mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-foreground font-medium">Recent memory entries</Text>
          <Text className="text-muted text-xs">Last 10</Text>
        </View>
        {!aiContext || aiContext.memory.length === 0 ? (
          <Text className="text-muted text-sm">No memory entries yet.</Text>
        ) : (
          <View className="gap-2">
            {aiContext.memory.map((entry, index) => (
              <View key={`${entry.source}:${entry.occurredAt}:${index}`} className="rounded-lg bg-default-100 p-3">
                <Text className="text-foreground text-sm">{entry.observation}</Text>
                <Text className="text-muted text-xs mt-1">
                  {entry.module} · {entry.confidence} · {new Date(entry.occurredAt).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Surface>

      <Button
        variant="danger"
        onPress={() => {
          void clearAiContext({
            idempotencyKey: idempotencyKey("aiContext.clear"),
          });
        }}
      >
        Clear AI memory
      </Button>
    </Container>
  );
}
