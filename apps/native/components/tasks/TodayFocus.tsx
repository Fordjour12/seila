import { api } from "@seila/backend/convex/_generated/api";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Button, Surface, useToast } from "heroui-native";
import { Alert, Text, View } from "react-native";

function getIdempotencyKey(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}

export function TodayFocus() {
  const { isAuthenticated } = useConvexAuth();
  const { toast } = useToast();
  const focusTasks = useQuery(api.queries.taskQueries.todayFocus);
  const focusTask = useMutation(api.commands.focusTask.focusTask);
  const completeTask = useMutation(api.commands.completeTask.completeTask);

  const isFull = focusTasks ? focusTasks.length >= 3 : false;

  const handleFocus = async (taskId: Id<"tasks">) => {
    try {
      await focusTask({
        idempotencyKey: getIdempotencyKey("task.focus"),
        taskId,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("full")) {
        Alert.alert("Focus list full", "You can only have 3 items in Focus. Complete or defer one first.");
      } else {
        toast.show({ variant: "danger", label: "Failed to focus task" });
      }
    }
  };

  const handleComplete = async (taskId: Id<"tasks">) => {
    try {
      await completeTask({
        idempotencyKey: getIdempotencyKey("task.complete"),
        taskId,
      });
      toast.show({ variant: "success", label: "Task completed" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to complete task" });
    }
  };

  return (
    <Surface variant="secondary" className="p-4 rounded-xl">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-foreground font-medium">Today&apos;s Focus</Text>
        <Text className="text-muted text-xs">
          {focusTasks?.length ?? 0}/3
        </Text>
      </View>

      {!focusTasks || focusTasks.length === 0 ? (
        <Text className="text-muted text-sm">
          No tasks in focus. Add tasks from your inbox.
        </Text>
      ) : (
        <View className="gap-2">
          {focusTasks.map((task) => (
            <View
              key={task._id}
              className="flex-row items-center justify-between bg-default-100 p-3 rounded-lg"
            >
              <Text className="text-foreground flex-1">{task.title}</Text>
              <View className="flex-row gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={() => handleComplete(task._id)}
                >
                  Done
                </Button>
              </View>
            </View>
          ))}
        </View>
      )}

      {isFull && (
        <Text className="text-muted text-xs mt-3">
          Focus list is full. Complete or defer a task before adding more.
        </Text>
      )}
    </Surface>
  );
}
