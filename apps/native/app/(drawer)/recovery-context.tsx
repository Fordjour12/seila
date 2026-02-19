import { useMutation, useQuery } from "convex/react";
import { Button, Surface } from "heroui-native";
import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";

import { Container } from "@/components/container";
import {
  recoveryContextRef,
  upsertRecoveryContextRef,
} from "@/lib/recovery-refs";

function key(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

export default function RecoveryContextScreen() {
  const context = useQuery(recoveryContextRef, {});
  const upsert = useMutation(upsertRecoveryContextRef);

  const [hardDayLooksLike, setHardDayLooksLike] = useState("");
  const [knownTriggersText, setKnownTriggersText] = useState("");
  const [restDefinition, setRestDefinition] = useState("");

  useEffect(() => {
    if (!context) return;
    setHardDayLooksLike(context.hardDayLooksLike ?? "");
    setKnownTriggersText(context.knownTriggers.join(", "));
    setRestDefinition(context.restDefinition ?? "");
  }, [context]);

  return (
    <Container className="px-4 pb-6">
      <View className="py-6 mb-4">
        <Text className="text-3xl font-semibold text-foreground tracking-tight">Recovery Context</Text>
        <Text className="text-muted text-sm mt-1">
          Private context AI reads before generating plans, patterns, and summaries.
        </Text>
      </View>

      <Surface variant="secondary" className="p-4 rounded-xl gap-3">
        <View>
          <Text className="text-muted text-xs mb-1">What does a hard day look like?</Text>
          <TextInput
            value={hardDayLooksLike}
            onChangeText={setHardDayLooksLike}
            placeholder="e.g., social overload, late sleep, low appetite"
            placeholderTextColor="#9CA3AF"
            multiline
            className="bg-default-100 rounded-lg px-3 py-2 text-foreground"
          />
        </View>

        <View>
          <Text className="text-muted text-xs mb-1">Known triggers (comma-separated)</Text>
          <TextInput
            value={knownTriggersText}
            onChangeText={setKnownTriggersText}
            placeholder="e.g., skipped breakfast, conflict, overscheduling"
            placeholderTextColor="#9CA3AF"
            className="bg-default-100 rounded-lg px-3 py-2 text-foreground"
          />
        </View>

        <View>
          <Text className="text-muted text-xs mb-1">What does rest mean for you?</Text>
          <TextInput
            value={restDefinition}
            onChangeText={setRestDefinition}
            placeholder="e.g., no prompts, one walk, low social load"
            placeholderTextColor="#9CA3AF"
            multiline
            className="bg-default-100 rounded-lg px-3 py-2 text-foreground"
          />
        </View>

        <Button
          variant="primary"
          onPress={() => {
            const knownTriggers = knownTriggersText
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean);

            void upsert({
              idempotencyKey: key("recoveryContext.upsert"),
              hardDayLooksLike: hardDayLooksLike.trim() || undefined,
              knownTriggers,
              restDefinition: restDefinition.trim() || undefined,
            });
          }}
        >
          Save Context
        </Button>
      </Surface>
    </Container>
  );
}
