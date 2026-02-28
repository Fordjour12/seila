import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import {
  taskByIdRef,
  taskHistoryRef,
  tasksDeferredRef,
  tasksFocusRef,
  tasksInboxRef,
  updateTaskRef,
} from "../../../lib/productivity-refs";
import { Button } from "../../../components/ui";
import { TaskForm } from "./_components/TaskForm";

function dueAtToDayKey(dueAt?: number) {
  if (!dueAt) return undefined;
  const date = new Date(dueAt);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dueDayKeyToTimestamp(dueDayKey?: string) {
  if (!dueDayKey) return undefined;
  const [year, month, day] = dueDayKey.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
}

export default function EditTaskScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const taskIdParam = (id || "") as Id<"tasks">;
  const { toast } = useToast();

  const task = useQuery(taskByIdRef, { taskId: taskIdParam });
  const history = useQuery(taskHistoryRef, { taskId: taskIdParam });
  const inboxTasks = useQuery(tasksInboxRef, {}) || [];
  const focusTasks = useQuery(tasksFocusRef, {}) || [];
  const deferredTasks = useQuery(tasksDeferredRef, {}) || [];
  const updateTask = useMutation(updateTaskRef);

  const [taskTitle, setTaskTitle] = React.useState("");
  const [note, setNote] = React.useState("");
  const [priority, setPriority] = React.useState<"low" | "medium" | "high">("medium");
  const [dueDayKey, setDueDayKey] = React.useState<string | undefined>();
  const [estimateMinutes, setEstimateMinutes] = React.useState("30");
  const [recurrence, setRecurrence] = React.useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [blockedByTaskId, setBlockedByTaskId] = React.useState<Id<"tasks"> | undefined>();
  const [blockedReason, setBlockedReason] = React.useState("");
  const [subtasks, setSubtasks] = React.useState<Array<{ id: string; title: string; completed: boolean }>>([]);
  const [remindersEnabled, setRemindersEnabled] = React.useState(false);
  const [reminderOffsetMinutes, setReminderOffsetMinutes] = React.useState("30");
  const [hydratedTaskId, setHydratedTaskId] = React.useState<Id<"tasks"> | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!task) return;
    if (hydratedTaskId === task._id) return;

    setTaskTitle(task.title);
    setNote(task.note || "");
    setPriority((task.priority as "low" | "medium" | "high") || "medium");
    setDueDayKey(dueAtToDayKey(task.dueAt));
    setEstimateMinutes(task.estimateMinutes ? String(task.estimateMinutes) : "30");
    setRecurrence((task.recurrence as "daily" | "weekly" | "monthly" | undefined) || "none");
    setBlockedByTaskId(task.blockedByTaskId);
    setBlockedReason(task.blockedReason || "");
    setSubtasks(task.subtasks || []);
    setRemindersEnabled(task.remindersEnabled || false);
    setReminderOffsetMinutes(task.reminderOffsetMinutes ? String(task.reminderOffsetMinutes) : "30");
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
        note: note.trim() || undefined,
        estimateMinutes: estimateMinutes.trim() ? Number(estimateMinutes) : undefined,
        recurrence: recurrence === "none" ? undefined : recurrence,
        blockedByTaskId,
        blockedReason: blockedReason.trim() || undefined,
        subtasks: subtasks.length ? subtasks : undefined,
        remindersEnabled,
        reminderOffsetMinutes: reminderOffsetMinutes.trim()
          ? Number(reminderOffsetMinutes)
          : undefined,
        priority,
        dueAt: dueDayKeyToTimestamp(dueDayKey),
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
          <Text className="text-3xl font-serif text-foreground tracking-tight">Edit Task Composer</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Update task text without changing its current status.
        </Text>
      </View>

      {isLoading ? (
        <View className="py-12 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading...</Text>
        </View>
      ) : (
        <>
          <TaskForm
            showHeader={false}
            taskTitle={taskTitle}
            note={note}
            priority={priority}
            dueDayKey={dueDayKey}
            estimateMinutes={estimateMinutes}
            recurrence={recurrence}
            blockedReason={blockedReason}
            subtasks={subtasks}
            remindersEnabled={remindersEnabled}
            reminderOffsetMinutes={reminderOffsetMinutes}
            helperText={`Current status: ${task.status}`}
            validationError={validationError}
            isSubmitting={isSubmitting}
            submitLabel="Save Task"
            onTaskTitleChange={setTaskTitle}
            onNoteChange={setNote}
            onPriorityChange={setPriority}
            onDueDayKeyChange={setDueDayKey}
            onEstimateMinutesChange={setEstimateMinutes}
            onRecurrenceChange={setRecurrence}
            onBlockedReasonChange={setBlockedReason}
            onSubtasksChange={setSubtasks}
            onRemindersEnabledChange={setRemindersEnabled}
            onReminderOffsetMinutesChange={setReminderOffsetMinutes}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
          />

          <View className="bg-surface rounded-2xl border border-border p-4 gap-2 shadow-sm">
            <Text className="text-sm font-medium text-foreground">Dependency</Text>
            <Text className="text-xs text-muted-foreground">Select task that must be completed first.</Text>
            <View className="flex-row flex-wrap gap-2">
              {[...focusTasks, ...inboxTasks, ...deferredTasks]
                .filter((candidate) => candidate._id !== task._id)
                .slice(0, 8)
                .map((candidate) => {
                  const active = blockedByTaskId === candidate._id;
                  return (
                    <Pressable
                      key={candidate._id}
                      className={`rounded-full border px-3 py-2 ${active ? "bg-danger/10 border-danger/30" : "bg-background border-border"}`}
                      onPress={() => setBlockedByTaskId(active ? undefined : candidate._id)}
                    >
                      <Text className={`text-xs ${active ? "text-danger" : "text-muted-foreground"}`}>
                        {candidate.title}
                      </Text>
                    </Pressable>
                  );
                })}
            </View>
          </View>

          <View className="bg-surface rounded-2xl border border-border p-4 gap-2 shadow-sm">
            <Text className="text-sm font-medium text-foreground">History</Text>
            {(history || []).length === 0 ? (
              <Text className="text-xs text-muted-foreground">No history yet.</Text>
            ) : (
              (history || []).slice(0, 8).map((event, index) => (
                <View
                  key={`${event.type}:${event.occurredAt}:${index}`}
                  className="rounded-xl border border-border bg-background p-3"
                >
                  <Text className="text-sm text-foreground">{event.type}</Text>
                  <Text className="text-xs text-muted-foreground">
                    {new Date(event.occurredAt).toLocaleString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}
