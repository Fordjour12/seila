import { api } from "@seila/backend/convex/_generated/api";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Button, useToast } from "heroui-native";
import { Alert, Text, View } from "react-native";
import { SpicedCard } from "@/components/ui/SpicedCard";

function getIdempotencyKey(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}

export function TodayFocus() {
  const { isAuthenticated } = useConvexAuth();
  const { toast } = useToast();
  const focusTasks = useQuery(api.queries.taskQueries.todayFocus);
  const focusTask = useMutation(api.commands.tasks.focusTask.focusTask);
  const completeTask = useMutation(api.commands.tasks.completeTask.completeTask);

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
        Alert.alert(
          "Focus list full",
          "You can only have 3 items in Focus. Complete or defer one first.",
        );
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
    <SpicedCard className="p-5">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-foreground text-lg font-bold tracking-tight">Today's Focus</Text>
        <Text className="text-muted-foreground text-xs font-medium">
          {focusTasks?.length ?? 0}/3
        </Text>
      </View>

      {!focusTasks || focusTasks.length === 0 ? (
        <Text className="text-muted-foreground text-sm italic">
          No tasks in focus. Add tasks from your inbox.
        </Text>
      ) : (
        <View className="gap-3">
          {focusTasks.map((task) => (
            <View
              key={task._id}
              className="flex-row items-center justify-between bg-secondary/30 p-3 rounded-xl border border-border/5"
            >
              <Text className="text-foreground flex-1 font-medium mr-2">{task.title}</Text>
              <View className="flex-row gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  className="rounded-full h-8 px-4"
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
        <Text className="text-muted-foreground text-xs mt-3 text-center">
          Focus list is full. Complete or defer a task before adding more.
        </Text>
      )}
    </SpicedCard>
  );
}
