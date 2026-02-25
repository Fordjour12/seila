import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { useToast } from "heroui-native";

import { captureTaskRef } from "../../../lib/productivity-refs";
import { TaskForm } from "./_components/TaskForm";

export default function AddTaskScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const captureTask = useMutation(captureTaskRef);

  const [taskTitle, setTaskTitle] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validationError = React.useMemo(() => {
    if (!taskTitle.trim()) return "Task title is required";
    return null;
  }, [taskTitle]);

  const handleSubmit = async () => {
    if (validationError) {
      toast.show({ variant: "warning", label: validationError });
      return;
    }

    setIsSubmitting(true);
    try {
      await captureTask({
        idempotencyKey: `tasks.capture:${Date.now()}`,
        title: taskTitle.trim(),
      });
      toast.show({ variant: "success", label: "Task captured" });
      router.back();
    } catch {
      toast.show({ variant: "danger", label: "Failed to capture task" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Add Task</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Capture a task directly into your inbox.
        </Text>
      </View>

      <TaskForm
        title="Task Details"
        taskTitle={taskTitle}
        validationError={validationError}
        isSubmitting={isSubmitting}
        submitLabel="Add Task"
        onTaskTitleChange={setTaskTitle}
        onSubmit={handleSubmit}
      />
    </ScrollView>
  );
}
