import { useAction } from "convex/react";
import { Surface } from "heroui-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { processCaptureRef } from "@/lib/ai-refs";

export function ConversationalCapture() {
  const processCapture = useAction(processCaptureRef);

  const [isOpen, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const submittedByReturnRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) {
      setOpen(false);
      setText("");
      return;
    }

    setSubmitting(true);
    try {
      const result = await processCapture({ text: trimmed.slice(0, 280) });
      setReply(result.reply);
      setText("");
      setOpen(false);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setReply(null), 30_000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="mt-4">
      {!isOpen ? (
        <Pressable
          className="rounded-xl border border-default-300 bg-default-100 px-4 py-3"
          onPress={() => setOpen(true)}
        >
          <Text className="text-muted text-sm">How are you right now?</Text>
        </Pressable>
      ) : (
        <Surface variant="secondary" className="p-3 rounded-xl">
          <TextInput
            value={text}
            onChangeText={setText}
            autoFocus
            maxLength={280}
            placeholder="How are you right now?"
            placeholderTextColor="#9CA3AF"
            className="text-foreground"
            onSubmitEditing={() => {
              submittedByReturnRef.current = true;
              void submit();
            }}
            blurOnSubmit
            returnKeyType="done"
            onBlur={() => {
              if (submittedByReturnRef.current) {
                submittedByReturnRef.current = false;
                return;
              }
              void submit();
            }}
          />
        </Surface>
      )}

      {reply ? (
        <Surface variant="secondary" className="mt-2 rounded-xl p-3">
          <Text className="text-foreground text-sm">{reply}</Text>
        </Surface>
      ) : null}
    </View>
  );
}
