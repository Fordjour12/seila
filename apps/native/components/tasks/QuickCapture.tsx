import { api } from "@seila/backend/convex/_generated/api";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Button, useToast } from "heroui-native";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";

function getIdempotencyKey(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}

interface QuickCaptureProps {
  onCapture?: () => void;
}

export function QuickCapture({ onCapture }: QuickCaptureProps) {
  const { isAuthenticated } = useConvexAuth();
  const { toast } = useToast();
  const captureTask = useMutation(api.commands.captureTask.captureTask);

  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    if (!isAuthenticated) {
      toast.show({
        variant: "warning",
        label: "Please sign in to capture tasks",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await captureTask({
        idempotencyKey: getIdempotencyKey("task.capture"),
        title: trimmedTitle,
      });
      setTitle("");
      toast.show({
        variant: "success",
        label: "Task captured",
      });
      onCapture?.();
    } catch (error) {
      toast.show({
        variant: "danger",
        label: "Failed to capture task",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-row gap-2 items-center">
      <TextInput
        placeholder="Capture a task..."
        placeholderTextColor="#9CA3AF"
        value={title}
        onChangeText={setTitle}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
        className="flex-1 bg-default-100 rounded-lg px-3 py-2 text-foreground"
        style={{
          borderWidth: 1,
          borderColor: "#D1D5DB",
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: "#111827",
        }}
      />
      <Button
        variant="primary"
        size="sm"
        onPress={handleSubmit}
        isDisabled={!title.trim() || isSubmitting}
      >
        {isSubmitting ? "..." : "Add"}
      </Button>
    </View>
  );
}
