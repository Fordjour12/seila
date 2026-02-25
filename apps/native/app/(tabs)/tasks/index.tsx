import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import {
  abandonTaskRef,
  bulkUpdateTasksRef,
  captureTaskRef,
  completeTaskRef,
  deferTaskRef,
  focusTaskRef,
  backfillTaskDefaultsRef,
  pauseTaskRecurrenceRef,
  reopenTaskRef,
  skipNextRecurrenceRef,
  snoozeTaskReminderRef,
  taskDataHealthRef,
  taskOnTimeMetricsRef,
  updateTaskSeriesRef,
  taskTimeBlockSuggestionsRef,
  tasksFilteredRef,
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
  estimateMinutes,
  recurrence,
  recurrenceEnabled,
  skipNextRecurrence,
  remindersEnabled,
  reminderOffsetMinutes,
  subtasks,
  blockedReason,
  status,
  onEdit,
  onStats,
  onFocus,
  onDefer,
  onComplete,
  onReopen,
  onSkipNextRecurrence,
  onPauseRecurrence,
  onResumeRecurrence,
  onSnoozeReminder,
  onUpdateFutureSeries,
  onAbandon,
  focusDisabled,
  isSubmitting,
}: {
  title: string;
  note?: string;
  priority?: "low" | "medium" | "high";
  dueAt?: number;
  estimateMinutes?: number;
  recurrence?: "daily" | "weekly" | "monthly";
  recurrenceEnabled?: boolean;
  skipNextRecurrence?: boolean;
  remindersEnabled?: boolean;
  reminderOffsetMinutes?: number;
  subtasks?: Array<{ id: string; title: string; completed: boolean }>;
  blockedReason?: string;
  status: string;
  onEdit: () => void;
  onStats: () => void;
  onFocus: () => void;
  onDefer: () => void;
  onComplete: () => void;
  onReopen: () => void;
  onSkipNextRecurrence: () => void;
  onPauseRecurrence: () => void;
  onResumeRecurrence: () => void;
  onSnoozeReminder: () => void;
  onUpdateFutureSeries: () => void;
  onAbandon: () => void;
  focusDisabled: boolean;
  isSubmitting: boolean;
}) {
  const [showMoreActions, setShowMoreActions] = React.useState(false);
  const priorityClass =
    priority === "high"
      ? "bg-danger/10 border-danger/20 text-danger"
      : priority === "low"
        ? "bg-success/10 border-success/20 text-success"
        : "bg-primary/10 border-primary/20 text-primary";
  const now = Date.now();
  const isOverdue = typeof dueAt === "number" && dueAt < now && status !== "completed";
  const dueClass = isOverdue ? "bg-danger/10 border-danger/20 text-danger" : "bg-muted border-border text-foreground";
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <View className={`border rounded-xl p-3 gap-3 bg-background ${isOverdue ? "border-danger/30" : "border-border"}`}>
      <View className="flex-row items-start justify-between gap-3">
        <Text className="text-base font-semibold text-foreground flex-1">{title}</Text>
        <View className="rounded-full border border-border bg-muted px-2.5 py-1">
          <Text className="text-[11px] font-medium text-muted-foreground">{statusLabel}</Text>
        </View>
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
      <Text className="text-xs text-muted-foreground">
        {estimateMinutes ? `${estimateMinutes}m` : "30m default"}
        {recurrence ? ` · repeats ${recurrence}` : ""}
        {subtasks && subtasks.length ? ` · subtasks ${subtasks.filter((s) => s.completed).length}/${subtasks.length}` : ""}
      </Text>
      {blockedReason ? (
        <View className="rounded-lg border border-danger/20 bg-danger/10 px-2 py-1 self-start">
          <Text className="text-[11px] text-danger">Blocked: {blockedReason}</Text>
        </View>
      ) : null}

      <View className="flex-row flex-wrap gap-2">
        {status !== "completed" && status !== "abandoned" ? (
          <>
            <Pressable
              className={`rounded-lg px-3 py-2 border ${focusDisabled ? "bg-muted border-border opacity-50" : "bg-primary border-primary"}`}
              onPress={onFocus}
              disabled={focusDisabled || isSubmitting}
            >
              <Text className={`text-xs font-semibold ${focusDisabled ? "text-muted-foreground" : "text-primary-foreground"}`}>
                Focus
              </Text>
            </Pressable>

            <Pressable
              className="bg-muted border border-border rounded-lg px-3 py-2"
              onPress={onDefer}
              disabled={isSubmitting}
            >
              <Text className="text-xs font-medium text-foreground">Later</Text>
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

        {(status === "completed" || status === "abandoned") ? (
          <Pressable
            className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2"
            onPress={onReopen}
            disabled={isSubmitting}
          >
            <Text className="text-xs font-medium text-primary">Reopen</Text>
          </Pressable>
        ) : null}

        <Pressable
          className="bg-muted border border-border rounded-lg px-3 py-2"
          onPress={() => setShowMoreActions((prev) => !prev)}
        >
          <Text className="text-xs font-medium text-foreground">{showMoreActions ? "Hide" : "More"}</Text>
        </Pressable>
      </View>

      {showMoreActions ? (
        <View className="flex-row flex-wrap gap-2 pt-1">
          <Pressable
            className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2"
            onPress={onEdit}
          >
            <Text className="text-xs font-medium text-primary">Edit</Text>
          </Pressable>

          <Pressable className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2" onPress={onStats}>
            <Text className="text-xs font-medium text-primary">Stats</Text>
          </Pressable>

          {recurrence ? (
            <>
              <Pressable
                className="bg-warning/10 border border-warning/20 rounded-lg px-3 py-2"
                onPress={onSkipNextRecurrence}
                disabled={isSubmitting}
              >
                <Text className="text-xs font-medium text-warning">
                  {skipNextRecurrence ? "Skip Armed" : "Skip Next"}
                </Text>
              </Pressable>
              <Pressable
                className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2"
                onPress={recurrenceEnabled === false ? onResumeRecurrence : onPauseRecurrence}
                disabled={isSubmitting}
              >
                <Text className="text-xs font-medium text-primary">
                  {recurrenceEnabled === false ? "Resume Series" : "Pause Series"}
                </Text>
              </Pressable>
              <Pressable
                className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2"
                onPress={onUpdateFutureSeries}
                disabled={isSubmitting}
              >
                <Text className="text-xs font-medium text-primary">Apply to Future</Text>
              </Pressable>
            </>
          ) : null}

          {remindersEnabled ? (
            <Pressable
              className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2"
              onPress={onSnoozeReminder}
              disabled={isSubmitting}
            >
              <Text className="text-xs font-medium text-primary">
                Snooze Reminder {reminderOffsetMinutes ? `(${reminderOffsetMinutes}m)` : ""}
              </Text>
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
      ) : null}
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
  const [search, setSearch] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<"inbox" | "focus" | "deferred" | "completed" | "abandoned" | undefined>();
  const [filterPriority, setFilterPriority] = React.useState<"low" | "medium" | "high" | undefined>();
  const [dueBucket, setDueBucket] = React.useState<"all" | "today" | "overdue" | "none">("all");
  const filteredTasks = useQuery(tasksFilteredRef, {
    search: search.trim() || undefined,
    status: filterStatus,
    priority: filterPriority,
    dueBucket,
  }) || [];
  const suggestions = useQuery(taskTimeBlockSuggestionsRef, { horizonMinutes: 180 }) || [];
  const consistency = useQuery(tasksConsistencyRef, { dayKey, windowDays: 30, trendDays: 14 });
  const onTimeMetrics = useQuery(taskOnTimeMetricsRef, { windowDays: 30 });
  const dataHealth = useQuery(taskDataHealthRef, {});

  const captureTask = useMutation(captureTaskRef);
  const focusTask = useMutation(focusTaskRef);
  const deferTask = useMutation(deferTaskRef);
  const completeTask = useMutation(completeTaskRef);
  const abandonTask = useMutation(abandonTaskRef);
  const reopenTask = useMutation(reopenTaskRef);
  const bulkUpdate = useMutation(bulkUpdateTasksRef);
  const skipNextRecurrence = useMutation(skipNextRecurrenceRef);
  const pauseTaskRecurrence = useMutation(pauseTaskRecurrenceRef);
  const updateTaskSeries = useMutation(updateTaskSeriesRef);
  const snoozeTaskReminder = useMutation(snoozeTaskReminderRef);
  const backfillTaskDefaults = useMutation(backfillTaskDefaultsRef);

  const [captureTitle, setCaptureTitle] = React.useState("");
  const [selectedTaskIds, setSelectedTaskIds] = React.useState<string[]>([]);
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

  const toggleSelection = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId],
    );
  };

  const runBulk = (action: "focus" | "defer" | "complete" | "abandon" | "reopen" | "setPriority", priority?: "low" | "medium" | "high") =>
    runTaskAction(
      async () => {
        if (selectedTaskIds.length === 0) return;
        await bulkUpdate({
          idempotencyKey: `tasks.bulk:${action}:${Date.now()}`,
          taskIds: selectedTaskIds as Id<"tasks">[],
          action,
          priority,
        });
        setSelectedTaskIds([]);
      },
      "Bulk update applied",
      "Bulk update failed",
    );

  const doSkipNextRecurrence = (taskId: Id<"tasks">) =>
    runTaskAction(
      async () => {
        await skipNextRecurrence({
          idempotencyKey: `tasks.recurrence.skipNext:${taskId}:${Date.now()}`,
          taskId,
        });
      },
      "Next recurrence skipped",
      "Failed to skip next recurrence",
    );

  const doPauseRecurrence = (taskId: Id<"tasks">, paused: boolean) =>
    runTaskAction(
      async () => {
        await pauseTaskRecurrence({
          idempotencyKey: `tasks.recurrence.pause:${taskId}:${Date.now()}`,
          taskId,
          paused,
        });
      },
      paused ? "Recurrence paused" : "Recurrence resumed",
      "Failed to update recurrence",
    );

  const doSnoozeReminder = (taskId: Id<"tasks">) =>
    runTaskAction(
      async () => {
        await snoozeTaskReminder({
          idempotencyKey: `tasks.reminder.snooze:${taskId}:${Date.now()}`,
          taskId,
          snoozeMinutes: 60,
        });
      },
      "Reminder snoozed by 60m",
      "Failed to snooze reminder",
    );

  const doUpdateFutureSeries = (taskId: Id<"tasks">) =>
    runTaskAction(
      async () => {
        await updateTaskSeries({
          idempotencyKey: `tasks.series.update:${taskId}:${Date.now()}`,
          taskId,
          applyTo: "future",
        });
      },
      "Future series updated",
      "Failed to update future series",
    );

  const renderTask = (task: (typeof inboxTasks)[number], inFocusSection = false) => (
    <Pressable key={task._id} onLongPress={() => toggleSelection(String(task._id))}>
      <View className={selectedTaskIds.includes(String(task._id)) ? "border border-primary/40 rounded-xl" : ""}>
        <TaskCard
          title={task.title}
          note={task.note}
          priority={task.priority as "low" | "medium" | "high" | undefined}
          dueAt={task.dueAt}
          estimateMinutes={task.estimateMinutes}
          recurrence={task.recurrence as "daily" | "weekly" | "monthly" | undefined}
          recurrenceEnabled={task.recurrenceEnabled}
          skipNextRecurrence={task.skipNextRecurrence}
          remindersEnabled={task.remindersEnabled}
          reminderOffsetMinutes={task.reminderOffsetMinutes}
          subtasks={task.subtasks as Array<{ id: string; title: string; completed: boolean }> | undefined}
          blockedReason={task.blockedReason}
          status={task.status}
          onEdit={() => router.push({ pathname: "/(tabs)/tasks/edit", params: { id: task._id } } as any)}
          onStats={() =>
            router.push({ pathname: "/(tabs)/tasks/task-consistency", params: { id: task._id } } as any)
          }
          onFocus={() => doFocus(task._id)}
          onDefer={() => doDefer(task._id)}
          onComplete={() => doComplete(task._id)}
          onReopen={() => doReopen(task._id)}
          onSkipNextRecurrence={() => doSkipNextRecurrence(task._id)}
          onPauseRecurrence={() => doPauseRecurrence(task._id, true)}
          onResumeRecurrence={() => doPauseRecurrence(task._id, false)}
          onSnoozeReminder={() => doSnoozeReminder(task._id)}
          onUpdateFutureSeries={() => doUpdateFutureSeries(task._id)}
          onAbandon={() => doAbandon(task._id)}
          focusDisabled={inFocusSection || focusFull}
          isSubmitting={isSubmitting}
        />
      </View>
    </Pressable>
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
        <SectionLabel>On-Time SLA (30d)</SectionLabel>
        <Text className="text-3xl font-serif text-foreground">{onTimeMetrics?.onTimeRatePct ?? 0}%</Text>
        <Text className="text-xs text-muted-foreground">
          On time {onTimeMetrics?.onTimeCompleted ?? 0}/{onTimeMetrics?.completedWithDue ?? 0} with due dates
        </Text>
      </View>

      <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
        <SectionLabel>Data Health</SectionLabel>
        <Text className="text-xs text-muted-foreground">
          Missing updatedAt: {dataHealth?.missingUpdatedAt ?? 0} · Missing priority: {dataHealth?.missingPriority ?? 0}
        </Text>
        <Text className="text-xs text-muted-foreground">
          Recurring without series: {dataHealth?.recurringWithoutSeries ?? 0} · Invalid deps: {dataHealth?.invalidDependencies ?? 0}
        </Text>
        <Button
          label="Backfill Defaults"
          variant="ghost"
          onPress={() =>
            runTaskAction(
              async () => {
                await backfillTaskDefaults({ idempotencyKey: `tasks.backfill:${Date.now()}` });
              },
              "Backfill completed",
              "Backfill failed",
            )
          }
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

      <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
        <SectionLabel>Search & Filters</SectionLabel>
        <TextInput
          className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
          placeholder="Search tasks"
          placeholderTextColor="#6b7280"
          value={search}
          onChangeText={setSearch}
        />
        <View className="flex-row flex-wrap gap-2">
          {(["inbox", "focus", "deferred", "completed", "abandoned"] as const).map((value) => (
            <Pressable
              key={value}
              className={`rounded-full border px-3 py-2 ${filterStatus === value ? "bg-warning/10 border-warning/30" : "bg-background border-border"}`}
              onPress={() => setFilterStatus(filterStatus === value ? undefined : value)}
            >
              <Text className={`text-xs ${filterStatus === value ? "text-warning" : "text-muted-foreground"}`}>
                {value}
              </Text>
            </Pressable>
          ))}
          {(["low", "medium", "high"] as const).map((value) => (
            <Pressable
              key={value}
              className={`rounded-full border px-3 py-2 ${filterPriority === value ? "bg-success/10 border-success/30" : "bg-background border-border"}`}
              onPress={() => setFilterPriority(filterPriority === value ? undefined : value)}
            >
              <Text className={`text-xs ${filterPriority === value ? "text-success" : "text-muted-foreground"}`}>
                {value}
              </Text>
            </Pressable>
          ))}
          {(["all", "today", "overdue", "none"] as const).map((value) => (
            <Pressable
              key={value}
              className={`rounded-full border px-3 py-2 ${dueBucket === value ? "bg-primary/10 border-primary/30" : "bg-background border-border"}`}
              onPress={() => setDueBucket(value)}
            >
              <Text className={`text-xs ${dueBucket === value ? "text-primary" : "text-muted-foreground"}`}>{value}</Text>
            </Pressable>
          ))}
        </View>
        {search.trim() ? (
          <View className="gap-2">
            <Text className="text-xs text-muted-foreground">{filteredTasks.length} results</Text>
            {filteredTasks.slice(0, 5).map((task) => renderTask(task as any))}
          </View>
        ) : null}
      </View>

      {selectedTaskIds.length > 0 ? (
        <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
          <SectionLabel>Bulk Actions ({selectedTaskIds.length})</SectionLabel>
          <View className="flex-row flex-wrap gap-2">
            <Button label="Focus" variant="ghost" onPress={() => runBulk("focus")} />
            <Button label="Complete" variant="ghost" onPress={() => runBulk("complete")} />
            <Button label="Abandon" variant="ghost" onPress={() => runBulk("abandon")} />
            <Button label="Priority High" variant="ghost" onPress={() => runBulk("setPriority", "high")} />
          </View>
        </View>
      ) : null}

      <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
        <SectionLabel>Time Blocks (Next 3h)</SectionLabel>
        {suggestions.length === 0 ? (
          <Text className="text-sm text-muted-foreground">No suggestions.</Text>
        ) : (
          suggestions.map((slot) => (
            <View key={`${slot.taskId}:${slot.startAt}`} className="rounded-xl border border-border bg-background p-3">
              <Text className="text-sm font-medium text-foreground">{slot.title}</Text>
              <Text className="text-xs text-muted-foreground">
                {new Date(slot.startAt).toLocaleTimeString()} - {new Date(slot.endAt).toLocaleTimeString()} ({slot.estimateMinutes}m)
              </Text>
            </View>
          ))
        )}
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
