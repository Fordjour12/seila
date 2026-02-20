import { api } from "@seila/backend/convex/_generated/api";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Button, useToast } from "heroui-native";
import { Text, View } from "react-native";
import { SpicedCard } from "@/components/ui/SpicedCard";

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
    <SpicedCard className="p-5">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-foreground text-lg font-bold tracking-tight">Inbox</Text>
        <Text className="text-muted-foreground text-xs font-medium">
          {inboxTasks?.length ?? 0} items
        </Text>
      </View>

      {!inboxTasks || inboxTasks.length === 0 ? (
        <Text className="text-muted-foreground text-sm italic">
          Inbox is empty. Capture tasks to get started.
        </Text>
      ) : (
        <View className="gap-3">
          {inboxTasks.map((task) => (
            <View
              key={task._id}
              className="flex-col gap-3 bg-secondary/30 p-4 rounded-xl border border-border/5"
            >
              <Text className="text-foreground text-base font-medium">{task.title}</Text>
              <View className="flex-row gap-2 justify-end">
                <Button
                  size="sm"
                  variant="primary"
                  className="rounded-full h-8 px-4 shadow-sm"
                  onPress={() => handleFocus(task._id)}
                  isDisabled={isFocusFull}
                >
                  Focus
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full h-8 px-4"
                  onPress={() => handleDefer(task._id)}
                >
                  Later
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full h-8 px-4 text-destructive"
                  onPress={() => handleAbandon(task._id)}
                >
                  Drop
                </Button>
              </View>
            </View>
          ))}
        </View>
      )}
    </SpicedCard>
  );
}
