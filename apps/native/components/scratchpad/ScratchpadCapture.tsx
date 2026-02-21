import { useMutation, useQuery } from "convex/react";
import { Button, Surface } from "heroui-native";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";

import { captureScratchpadRef, todayScratchpadRef, triageScratchpadRef } from "@/lib/recovery-refs";

function key(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

export function ScratchpadCapture() {
  const entries = useQuery(todayScratchpadRef, {});
  const capture = useMutation(captureScratchpadRef);
  const triage = useMutation(triageScratchpadRef);
  const [text, setText] = useState("");

  return (
    <Surface variant="secondary" className="p-4 rounded-xl">
      <Text className="text-foreground font-medium mb-2">Low-floor capture</Text>
      <Text className="text-muted text-xs mb-3">
        Capture a rough note now. Triage later if useful.
      </Text>
      <View className="flex-row gap-2 items-center">
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="rough morning..."
          placeholderTextColor="#9CA3AF"
          className="flex-1 bg-default-100 rounded-lg px-3 py-2 text-foreground"
        />
        <Button
          size="sm"
          variant="primary"
          isDisabled={!text.trim()}
          onPress={() => {
            const next = text.trim();
            if (!next) return;
            void capture({
              idempotencyKey: key("scratchpad.capture"),
              text: next,
            });
            setText("");
          }}
        >
          Save
        </Button>
      </View>

      <View className="gap-2 mt-3">
        {(entries ?? []).slice(0, 5).map((entry) => (
          <View
            key={entry._id}
            className="flex-row items-center justify-between bg-default-100 p-2 rounded-lg"
          >
            <Text className="text-foreground text-xs flex-1 pr-2">{entry.text}</Text>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => {
                void triage({
                  idempotencyKey: key("scratchpad.triage"),
                  entryId: entry._id,
                });
              }}
            >
              Triage
            </Button>
          </View>
        ))}
      </View>
    </Surface>
  );
}
