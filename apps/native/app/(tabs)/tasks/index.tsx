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
  reopenTaskRef,
  tasksConsistencyRef,
  tasksDoneRecentlyRef,
  tasksDeferredRef,
  tasksFocusRef,
  tasksInboxRef,
} from "../../../lib/productivity-refs";
import { Button, SectionLabel } from "../../../components/ui";
import { getLocalDayKey } from "../../../lib/date";

function TaskCard({
  title,
  note,
  priority,
  dueAt,
  status,
  onEdit,
  onStats,
  onFocus,
  onDefer,
  onComplete,
  onReopen,
  onAbandon,
  focusDisabled,
  isSubmitting,
}: {
  title: string;
  note?: string;
  priority?: "low" | "medium" | "high";
  dueAt?: number;
  status: string;
  onEdit: () => void;
  onStats: () => void;
  onFocus: () => void;
  onDefer: () => void;
  onComplete: () => void;
  onReopen: () => void;
  onAbandon: () => void;
  focusDisabled: boolean;
  isSubmitting: boolean;
}) {
  const priorityClass =
    priority === "high"
      ? "bg-danger/10 border-danger/20 text-danger"
      : priority === "low"
        ? "bg-success/10 border-success/20 text-success"
        : "bg-warning/10 border-warning/20 text-warning";
  const now = Date.now();
  const isOverdue = typeof dueAt === "number" && dueAt < now && status !== "completed";
  const dueClass = isOverdue ? "bg-danger/10 border-danger/20 text-danger" : "bg-primary/10 border-primary/20 text-primary";

  return (
    <View className={`border rounded-xl p-3 gap-3 bg-background ${isOverdue ? "border-danger/30" : "border-border"}`}>
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-base font-medium text-foreground flex-1">{title}</Text>
        <Text className="text-xs uppercase text-muted-foreground">{status}</Text>
      </View>
      <View className="flex-row flex-wrap gap-2">
        <View className={`rounded-full border px-2.5 py-1 ${priorityClass}`}>
          <Text className="text-[11px] font-medium uppercase">{priority || "medium"}</Text>
        </View>
        {dueAt ? (
          <View className={`rounded-full border px-2.5 py-1 ${dueClass}`}>
            <Text className="text-[11px] font-medium">
              {isOverdue ? "Overdue" : "Due"} {new Date(dueAt).toLocaleDateString()}
            </Text>
          </View>
        ) : null}
      </View>
      {note ? <Text className="text-xs text-muted-foreground">{note}</Text> : null}

      <View className="flex-row flex-wrap gap-2">
        {status !== "completed" && status !== "abandoned" ? (
          <>
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
          </>
        ) : null}

        {status !== "completed" ? (
          <Pressable
            className="bg-success/10 border border-success/20 rounded-lg px-3 py-2"
            onPress={onComplete}
            disabled={isSubmitting}
          >
            <Text className="text-xs font-medium text-success">Done</Text>
          </Pressable>
        ) : null}

        <Pressable
          className="bg-warning/10 border border-warning/20 rounded-lg px-3 py-2"
          onPress={onEdit}
        >
          <Text className="text-xs font-medium text-warning">Edit</Text>
        </Pressable>

        <Pressable className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2" onPress={onStats}>
          <Text className="text-xs font-medium text-primary">Stats</Text>
        </Pressable>

        {(status === "completed" || status === "abandoned") ? (
          <Pressable
            className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2"
            onPress={onReopen}
            disabled={isSubmitting}
          >
            <Text className="text-xs font-medium text-primary">Reopen</Text>
          </Pressable>
        ) : null}

        {status !== "abandoned" ? (
          <Pressable
            className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2"
            onPress={onAbandon}
            disabled={isSubmitting}
          >
            <Text className="text-xs font-medium text-danger">Abandon</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function HeatDots({ values }: { values: number[] }) {
  const max = Math.max(...values, 0);
  return (
    <View className="flex-row gap-1">
      {values.map((value, index) => {
        const ratio = max > 0 ? value / max : 0;
        const shade =
          ratio >= 0.85
            ? "bg-success"
            : ratio >= 0.5
              ? "bg-warning"
              : ratio > 0
                ? "bg-warning/40"
                : "bg-muted";
        return <View key={index} className={`h-2.5 flex-1 rounded-full ${shade}`} />;
      })}
    </View>
  );
}

export default function TasksScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const dayKey = getLocalDayKey();

  const focusTasks = useQuery(tasksFocusRef, {}) || [];
  const inboxTasks = useQuery(tasksInboxRef, {}) || [];
  const deferredTasks = useQuery(tasksDeferredRef, {}) || [];
  const doneRecently = useQuery(tasksDoneRecentlyRef, {}) || [];
  const consistency = useQuery(tasksConsistencyRef, { dayKey, windowDays: 30, trendDays: 14 });

  const captureTask = useMutation(captureTaskRef);
  const focusTask = useMutation(focusTaskRef);
  const deferTask = useMutation(deferTaskRef);
  const completeTask = useMutation(completeTaskRef);
  const abandonTask = useMutation(abandonTaskRef);
  const reopenTask = useMutation(reopenTaskRef);

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

  const doReopen = (taskId: Id<"tasks">) =>
    runTaskAction(
      async () => {
        await reopenTask({ idempotencyKey: `tasks.reopen:${taskId}:${Date.now()}`, taskId });
      },
      "Task reopened",
      "Failed to reopen task",
    );

  const renderTask = (task: (typeof inboxTasks)[number], inFocusSection = false) => (
    <TaskCard
      key={task._id}
      title={task.title}
      note={task.note}
      priority={task.priority as "low" | "medium" | "high" | undefined}
      dueAt={task.dueAt}
      status={task.status}
      onEdit={() => router.push({ pathname: "/(tabs)/tasks/edit", params: { id: task._id } } as any)}
      onStats={() =>
        router.push({ pathname: "/(tabs)/tasks/task-consistency", params: { id: task._id } } as any)
      }
      onFocus={() => doFocus(task._id)}
      onDefer={() => doDefer(task._id)}
      onComplete={() => doComplete(task._id)}
      onReopen={() => doReopen(task._id)}
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
        <SectionLabel>Consistency (30d)</SectionLabel>
        <View className="flex-row items-end justify-between">
          <Text className="text-4xl font-serif text-foreground">{consistency?.completionRatePct ?? 0}%</Text>
          <Text className="text-xs text-muted-foreground">
            {consistency?.completedInWindow ?? 0}/{consistency?.createdInWindow ?? 0} completed
          </Text>
        </View>
        <Text className="text-xs text-muted-foreground">
          Completion streak {consistency?.currentStreak ?? 0}d · Best {consistency?.bestStreak ?? 0}d
        </Text>
        <HeatDots values={(consistency?.trend || []).map((item) => item.completed)} />
        <Button
          label="View Details"
          variant="ghost"
          onPress={() => router.push("/(tabs)/tasks/consistency" as any)}
        />
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

      <View className="gap-3">
        <SectionLabel>Done Recently</SectionLabel>
        <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
          {doneRecently.length === 0 ? (
            <Text className="text-sm text-muted-foreground">No completed or abandoned tasks yet.</Text>
          ) : (
            doneRecently.map((task) => renderTask(task))
          )}
        </View>
      </View>
    </ScrollView>
  );
}
