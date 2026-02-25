import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { useToast } from "heroui-native";

import { captureTaskRef } from "../../../lib/productivity-refs";
import { TaskForm } from "./_components/TaskForm";

function dueDayKeyToTimestamp(dueDayKey?: string) {
  if (!dueDayKey) return undefined;
  const [year, month, day] = dueDayKey.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
}

export default function AddTaskScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const captureTask = useMutation(captureTaskRef);

  const [taskTitle, setTaskTitle] = React.useState("");
  const [note, setNote] = React.useState("");
  const [priority, setPriority] = React.useState<"low" | "medium" | "high">("medium");
  const [dueDayKey, setDueDayKey] = React.useState<string | undefined>();
  const [estimateMinutes, setEstimateMinutes] = React.useState("30");
  const [recurrence, setRecurrence] = React.useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [blockedReason, setBlockedReason] = React.useState("");
  const [subtasks, setSubtasks] = React.useState<Array<{ id: string; title: string; completed: boolean }>>([]);
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
          note: note.trim() || undefined,
          estimateMinutes: estimateMinutes.trim() ? Number(estimateMinutes) : undefined,
          recurrence: recurrence === "none" ? undefined : recurrence,
          blockedReason: blockedReason.trim() || undefined,
          subtasks: subtasks.length ? subtasks : undefined,
          priority,
          dueAt: dueDayKeyToTimestamp(dueDayKey),
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
        note={note}
        priority={priority}
        dueDayKey={dueDayKey}
        estimateMinutes={estimateMinutes}
        recurrence={recurrence}
        blockedReason={blockedReason}
        subtasks={subtasks}
        validationError={validationError}
        isSubmitting={isSubmitting}
        submitLabel="Add Task"
        onTaskTitleChange={setTaskTitle}
        onNoteChange={setNote}
        onPriorityChange={setPriority}
        onDueDayKeyChange={setDueDayKey}
        onEstimateMinutesChange={setEstimateMinutes}
        onRecurrenceChange={setRecurrence}
        onBlockedReasonChange={setBlockedReason}
        onSubtasksChange={setSubtasks}
        onSubmit={handleSubmit}
      />
    </ScrollView>
  );
}
