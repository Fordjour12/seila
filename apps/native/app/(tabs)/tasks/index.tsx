import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import {
  abandonTaskRef,
  captureTaskRef,
  completeTaskRef,
  deferTaskRef,
  focusTaskRef,
  tasksDeferredRef,
  tasksFocusRef,
  tasksInboxRef,
} from "../../../lib/productivity-refs";
import { Button, SectionLabel } from "../../../components/ui";

function TaskCard({
  title,
  status,
  onEdit,
  onFocus,
  onDefer,
  onComplete,
  onAbandon,
  focusDisabled,
  isSubmitting,
}: {
  title: string;
  status: string;
  onEdit: () => void;
  onFocus: () => void;
  onDefer: () => void;
  onComplete: () => void;
  onAbandon: () => void;
  focusDisabled: boolean;
  isSubmitting: boolean;
}) {
  return (
    <View className="border border-border rounded-xl p-3 gap-3 bg-background">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-base font-medium text-foreground flex-1">{title}</Text>
        <Text className="text-xs uppercase text-muted-foreground">{status}</Text>
      </View>

      <View className="flex-row flex-wrap gap-2">
        <Pressable
          className={`rounded-lg px-3 py-2 border ${focusDisabled ? "bg-muted border-border opacity-50" : "bg-warning/10 border-warning/20"}`}
          onPress={onFocus}
          disabled={focusDisabled || isSubmitting}
        >
          <Text className={`text-xs font-medium ${focusDisabled ? "text-muted-foreground" : "text-warning"}`}>
            Focus
          </Text>
        </Pressable>

        <Pressable
          className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2"
          onPress={onDefer}
          disabled={isSubmitting}
        >
          <Text className="text-xs font-medium text-primary">Later</Text>
        </Pressable>

        <Pressable
          className="bg-success/10 border border-success/20 rounded-lg px-3 py-2"
          onPress={onComplete}
          disabled={isSubmitting}
        >
          <Text className="text-xs font-medium text-success">Done</Text>
        </Pressable>

        <Pressable
          className="bg-warning/10 border border-warning/20 rounded-lg px-3 py-2"
          onPress={onEdit}
        >
          <Text className="text-xs font-medium text-warning">Edit</Text>
        </Pressable>

        <Pressable
          className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2"
          onPress={onAbandon}
          disabled={isSubmitting}
        >
          <Text className="text-xs font-medium text-danger">Abandon</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function TasksScreen() {
  const router = useRouter();
  const { toast } = useToast();

  const focusTasks = useQuery(tasksFocusRef, {}) || [];
  const inboxTasks = useQuery(tasksInboxRef, {}) || [];
  const deferredTasks = useQuery(tasksDeferredRef, {}) || [];

  const captureTask = useMutation(captureTaskRef);
  const focusTask = useMutation(focusTaskRef);
  const deferTask = useMutation(deferTaskRef);
  const completeTask = useMutation(completeTaskRef);
  const abandonTask = useMutation(abandonTaskRef);

  const [captureTitle, setCaptureTitle] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const focusFull = focusTasks.length >= 3;

  const runTaskAction = async (action: () => Promise<void>, successLabel: string, errorLabel: string) => {
    setIsSubmitting(true);
    try {
      await action();
      toast.show({ variant: "success", label: successLabel });
    } catch (error) {
      const message = error instanceof Error ? error.message : errorLabel;
      toast.show({ variant: "danger", label: message || errorLabel });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCapture = async () => {
    const title = captureTitle.trim();
    if (!title) {
      toast.show({ variant: "warning", label: "Task title is required" });
      return;
    }

    await runTaskAction(
      async () => {
        await captureTask({
          idempotencyKey: `tasks.capture.quick:${Date.now()}`,
          title,
        });
        setCaptureTitle("");
      },
      "Task captured",
      "Failed to capture task",
    );
  };

  const doFocus = (taskId: Id<"tasks">) =>
    runTaskAction(
      async () => {
        await focusTask({ idempotencyKey: `tasks.focus:${taskId}:${Date.now()}`, taskId });
      },
      "Moved to focus",
      "Failed to focus task",
    );

  const doDefer = (taskId: Id<"tasks">) =>
    runTaskAction(
      async () => {
        await deferTask({ idempotencyKey: `tasks.defer:${taskId}:${Date.now()}`, taskId });
      },
      "Task moved to later",
      "Failed to defer task",
    );

  const doComplete = (taskId: Id<"tasks">) =>
    runTaskAction(
      async () => {
        await completeTask({ idempotencyKey: `tasks.complete:${taskId}:${Date.now()}`, taskId });
      },
      "Task completed",
      "Failed to complete task",
    );

  const doAbandon = (taskId: Id<"tasks">) =>
    runTaskAction(
      async () => {
        await abandonTask({ idempotencyKey: `tasks.abandon:${taskId}:${Date.now()}`, taskId });
      },
      "Task abandoned",
      "Failed to abandon task",
    );

  const renderTask = (task: (typeof inboxTasks)[number], inFocusSection = false) => (
    <TaskCard
      key={task._id}
      title={task.title}
      status={task.status}
      onEdit={() => router.push({ pathname: "/(tabs)/tasks/edit", params: { id: task._id } } as any)}
      onFocus={() => doFocus(task._id)}
      onDefer={() => doDefer(task._id)}
      onComplete={() => doComplete(task._id)}
      onAbandon={() => doAbandon(task._id)}
      focusDisabled={inFocusSection || focusFull}
      isSubmitting={isSubmitting}
    />
  );

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Tasks</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Focus {focusTasks.length}/3 · Inbox {inboxTasks.length} · Later {deferredTasks.length}
        </Text>
      </View>

      <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
        <SectionLabel>Quick Capture</SectionLabel>
        <TextInput
          className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
          placeholder="Capture a task"
          placeholderTextColor="#6b7280"
          value={captureTitle}
          onChangeText={setCaptureTitle}
          onSubmitEditing={handleCapture}
        />
        <View className="flex-row gap-2">
          <Button label="Capture" onPress={handleCapture} />
          <Button label="Add Task" variant="ghost" onPress={() => router.push("/(tabs)/tasks/add" as any)} />
        </View>
      </View>

      <View className="gap-3">
        <SectionLabel>Today&apos;s Focus</SectionLabel>
        <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
          {focusTasks.length === 0 ? (
            <Text className="text-sm text-muted-foreground">No focus tasks yet.</Text>
          ) : (
            focusTasks.map((task) => renderTask(task, true))
          )}
        </View>
      </View>

      <View className="gap-3">
        <SectionLabel>Inbox</SectionLabel>
        <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
          {inboxTasks.length === 0 ? (
            <Text className="text-sm text-muted-foreground">Inbox is clear.</Text>
          ) : (
            inboxTasks.map((task) => renderTask(task))
          )}
        </View>
      </View>

      <View className="gap-3">
        <SectionLabel>Later</SectionLabel>
        <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
          {deferredTasks.length === 0 ? (
            <Text className="text-sm text-muted-foreground">No deferred tasks.</Text>
          ) : (
            deferredTasks.map((task) => renderTask(task))
          )}
        </View>
      </View>
    </ScrollView>
  );
}
