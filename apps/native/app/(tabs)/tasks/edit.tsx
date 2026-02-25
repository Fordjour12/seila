import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import { taskByIdRef, updateTaskRef } from "../../../lib/productivity-refs";
import { Button } from "../../../components/ui";
import { TaskForm } from "./_components/TaskForm";

export default function EditTaskScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const taskIdParam = (id || "") as Id<"tasks">;
  const { toast } = useToast();

  const task = useQuery(taskByIdRef, { taskId: taskIdParam });
  const updateTask = useMutation(updateTaskRef);

  const [taskTitle, setTaskTitle] = React.useState("");
  const [hydratedTaskId, setHydratedTaskId] = React.useState<Id<"tasks"> | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!task) return;
    if (hydratedTaskId === task._id) return;

    setTaskTitle(task.title);
    setHydratedTaskId(task._id);
  }, [task, hydratedTaskId]);

  const validationError = React.useMemo(() => {
    if (!task) return "Task not found";
    if (!taskTitle.trim()) return "Task title is required";
    return null;
  }, [task, taskTitle]);

  const isLoading = task === undefined;

  const handleSubmit = async () => {
    if (!task) {
      toast.show({ variant: "danger", label: "Task not found" });
      return;
    }

    if (validationError) {
      toast.show({ variant: "warning", label: validationError });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTask({
        idempotencyKey: `tasks.update:${task._id}:${Date.now()}`,
        taskId: task._id,
        title: taskTitle.trim(),
      });
      toast.show({ variant: "success", label: "Task updated" });
      router.back();
    } catch {
      toast.show({ variant: "danger", label: "Failed to update task" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoading && !task) {
    return (
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
        <Text className="text-2xl font-serif text-foreground">Task not found</Text>
        <Button label="Go Back" onPress={() => router.back()} />
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Edit Task</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Update task text without changing its current status.
        </Text>
      </View>

      {isLoading ? (
        <View className="py-12 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading...</Text>
        </View>
      ) : (
        <TaskForm
          title="Task Details"
          taskTitle={taskTitle}
          helperText={`Current status: ${task.status}`}
          validationError={validationError}
          isSubmitting={isSubmitting}
          submitLabel="Save Task"
          onTaskTitleChange={setTaskTitle}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
        />
      )}
    </ScrollView>
  );
}
