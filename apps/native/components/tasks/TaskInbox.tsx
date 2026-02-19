import { api } from "@seila/backend/convex/_generated/api";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Button, Surface, useToast } from "heroui-native";
import { Text, View } from "react-native";

function getIdempotencyKey(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}

export function TaskInbox() {
  const { isAuthenticated } = useConvexAuth();
  const { toast } = useToast();
  const inboxTasks = useQuery(api.queries.taskQueries.inbox);
  const focusTask = useMutation(api.commands.focusTask.focusTask);
  const deferTask = useMutation(api.commands.deferTask.deferTask);
  const abandonTask = useMutation(api.commands.abandonTask.abandonTask);

  const focusTasks = useQuery(api.queries.taskQueries.todayFocus);
  const isFocusFull = focusTasks ? focusTasks.length >= 3 : false;

  const handleFocus = async (taskId: Id<"tasks">) => {
    if (isFocusFull) {
      toast.show({
        variant: "warning",
        label: "Focus is full (3 items). Complete or defer one first.",
      });
      return;
    }
    try {
      await focusTask({
        idempotencyKey: getIdempotencyKey("task.focus"),
        taskId,
      });
      toast.show({ variant: "success", label: "Added to Focus" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("full")) {
        toast.show({ variant: "warning", label: "Focus is full" });
      } else {
        toast.show({ variant: "danger", label: "Failed to focus task" });
      }
    }
  };

  const handleDefer = async (taskId: Id<"tasks">) => {
    try {
      await deferTask({
        idempotencyKey: getIdempotencyKey("task.defer"),
        taskId,
        deferUntil: Date.now() + 24 * 60 * 60 * 1000,
      });
      toast.show({ variant: "success", label: "Deferred to later" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to defer task" });
    }
  };

  const handleAbandon = async (taskId: Id<"tasks">) => {
    try {
      await abandonTask({
        idempotencyKey: getIdempotencyKey("task.abandon"),
        taskId,
      });
      toast.show({ variant: "success", label: "Task removed" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to remove task" });
    }
  };

  return (
    <Surface variant="secondary" className="p-4 rounded-xl">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-foreground font-medium">Inbox</Text>
        <Text className="text-muted text-xs">
          {inboxTasks?.length ?? 0} items
        </Text>
      </View>

      {!inboxTasks || inboxTasks.length === 0 ? (
        <Text className="text-muted text-sm">
          Inbox is empty. Capture tasks to get started.
        </Text>
      ) : (
        <View className="gap-2">
          {inboxTasks.map((task) => (
            <View
              key={task._id}
              className="flex-row items-center justify-between bg-default-100 p-3 rounded-lg"
            >
              <Text className="text-foreground flex-1">{task.title}</Text>
              <View className="flex-row gap-1">
                <Button
                  size="sm"
                  variant="primary"
                  onPress={() => handleFocus(task._id)}
                  isDisabled={isFocusFull}
                >
                  Focus
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={() => handleDefer(task._id)}
                >
                  Later
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onPress={() => handleAbandon(task._id)}
                >
                  Drop
                </Button>
              </View>
            </View>
          ))}
        </View>
      )}
    </Surface>
  );
}
