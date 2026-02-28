import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { Card, useToast } from "heroui-native";

import { Button } from "@/components/ui";
import { parseDayKey, toLocalDayKey } from "@/lib/date";
import { captureTaskRef } from "@/lib/productivity-refs";
import { Ionicons } from "@expo/vector-icons";
import { useModeThemeColors } from "@/lib/theme";

type Priority = "low" | "medium" | "high";
type Recurrence = "none" | "daily" | "weekly" | "monthly";
type SectionKey = "plan" | "schedule" | "repeat" | "subtasks" | "reminders";
type Subtask = { id: string; title: string; completed: boolean };

function dueDayKeyToTimestamp(dueDayKey?: string) {
  if (!dueDayKey) return undefined;
  const [year, month, day] = dueDayKey.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
}

function SectionCard({
  title,
  description,
  summary,
  open,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  summary?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const Colors = useModeThemeColors();
  return (
    <Card className="rounded-2xl border border-border bg-surface/80 overflow-hidden">
      <Pressable onPress={onToggle} className="px-4 py-3">
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="text-base font-medium text-foreground">
              {title}
            </Text>
            <Text className="text-xs text-muted-foreground mt-1">
              {description}
            </Text>
            {!open && summary ? (
              <Text className="text-xs text-foreground/80 mt-2">{summary}</Text>
            ) : null}
          </View>
          <Text className="text-lg text-muted-foreground">
            {open ? (
              <Ionicons
                name="chevron-down"
                size={16}
                color={Colors.foreground}
              />
            ) : (
              <Ionicons
                name="chevron-collapse"
                size={16}
                color={Colors.foreground}
              />
            )}
          </Text>
        </View>
      </Pressable>
      {open ? <View className="px-4 pb-4 gap-3">{children}</View> : null}
    </Card>
  );
}

export default function AddTaskScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const captureTask = useMutation(captureTaskRef);

  const [taskTitle, setTaskTitle] = React.useState("");
  const [note, setNote] = React.useState("");
  const [priority, setPriority] = React.useState<Priority>("medium");
  const [dueDayKey, setDueDayKey] = React.useState<string | undefined>();
  const [estimateMinutes, setEstimateMinutes] = React.useState("30");
  const [recurrence, setRecurrence] = React.useState<Recurrence>("none");
  const [blockedReason, setBlockedReason] = React.useState("");
  const [subtasks, setSubtasks] = React.useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = React.useState("");
  const [remindersEnabled, setRemindersEnabled] = React.useState(false);
  const [reminderOffsetMinutes, setReminderOffsetMinutes] =
    React.useState("30");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showDuePicker, setShowDuePicker] = React.useState(false);
  const [expanded, setExpanded] = React.useState<Record<SectionKey, boolean>>({
    plan: false,
    schedule: false,
    repeat: false,
    subtasks: false,
    reminders: false,
  });

  const toggleSection = (key: SectionKey) => {
    setExpanded((current) => ({ ...current, [key]: !current[key] }));
  };

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
        estimateMinutes: estimateMinutes.trim()
          ? Number(estimateMinutes)
          : undefined,
        recurrence: recurrence === "none" ? undefined : recurrence,
        blockedReason: blockedReason.trim() || undefined,
        subtasks: subtasks.length ? subtasks : undefined,
        remindersEnabled,
        reminderOffsetMinutes: reminderOffsetMinutes.trim()
          ? Number(reminderOffsetMinutes)
          : undefined,
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
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-4 pb-44 gap-4 mt-4"
    >
      <View>
        <Text className="text-xs uppercase tracking-[1.5px] text-muted-foreground">
          New Task Composer
        </Text>
      </View>
      <View className="relative rounded-3xl border border-border bg-card p-5 overflow-hidden">
        <Text className="text-xs uppercase tracking-[1.5px] text-muted-foreground">
          Quick Composer
        </Text>
        <Text className="text-3xl font-serif text-foreground tracking-tight mt-2">
          What needs to get done?
        </Text>
        <Text className="text-sm text-muted-foreground mt-2">
          Capture the essentials now. Open advanced options only when you need
          them.
        </Text>

        <View className="mt-5 gap-3">
          <TextInput
            className="rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground"
            placeholder="Task title"
            placeholderTextColor="#6b7280"
            value={taskTitle}
            onChangeText={setTaskTitle}
            autoFocus
            returnKeyType="next"
          />
          <TextInput
            className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground min-h-[88px]"
            placeholder="Notes (optional)"
            placeholderTextColor="#6b7280"
            value={note}
            onChangeText={setNote}
            multiline
            textAlignVertical="top"
          />
          {validationError ? (
            <View className="bg-danger/10 border border-danger/20 rounded-xl px-3 py-2">
              <Text className="text-xs text-danger">{validationError}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <SectionCard
        title="Plan"
        description="Priority, estimate, and blockers"
        summary={`Priority ${priority} • ${estimateMinutes || "?"} min${blockedReason.trim() ? " • has blocker" : ""}`}
        open={expanded.plan}
        onToggle={() => toggleSection("plan")}
      >
        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider">
            Priority
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {(["low", "medium", "high"] as const).map((value) => {
              const active = priority === value;
              const activeClass =
                value === "high"
                  ? "bg-danger/10 border-danger/30"
                  : value === "medium"
                    ? "bg-warning/10 border-warning/30"
                    : "bg-success/10 border-success/30";
              return (
                <Pressable
                  key={value}
                  className={`rounded-full border px-3 py-2 ${active ? activeClass : "bg-background border-border"}`}
                  onPress={() => setPriority(value)}
                >
                  <Text
                    className={`text-xs font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {value}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider">
            Estimate
          </Text>
          <TextInput
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            placeholder="Minutes (e.g. 30)"
            placeholderTextColor="#6b7280"
            keyboardType="number-pad"
            value={estimateMinutes}
            onChangeText={setEstimateMinutes}
          />
        </View>

        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider">
            Blocked Reason
          </Text>
          <TextInput
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            placeholder="Optional blocker context"
            placeholderTextColor="#6b7280"
            value={blockedReason}
            onChangeText={setBlockedReason}
          />
        </View>
      </SectionCard>

      <SectionCard
        title="Schedule"
        description="Set a due date"
        summary={dueDayKey ? `Due ${dueDayKey}` : "No due date"}
        open={expanded.schedule}
        onToggle={() => toggleSection("schedule")}
      >
        <View className="flex-row gap-2">
          <Pressable
            className="flex-1 rounded-xl border border-border bg-background px-3 py-3"
            onPress={() => setShowDuePicker(true)}
          >
            <Text className="text-sm text-foreground">
              {dueDayKey || "Pick due date"}
            </Text>
          </Pressable>
          <Button
            label="Clear"
            variant="ghost"
            onPress={() => setDueDayKey(undefined)}
          />
        </View>
        {showDuePicker ? (
          <DateTimePicker
            value={parseDayKey(dueDayKey)}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_event, date) => {
              setShowDuePicker(Platform.OS === "ios");
              if (date) setDueDayKey(toLocalDayKey(date));
            }}
          />
        ) : null}
      </SectionCard>

      <SectionCard
        title="Repeat"
        description="Create recurring tasks"
        summary={recurrence === "none" ? "No recurrence" : recurrence}
        open={expanded.repeat}
        onToggle={() => toggleSection("repeat")}
      >
        <View className="flex-row flex-wrap gap-2">
          {(["none", "daily", "weekly", "monthly"] as const).map((value) => {
            const active = recurrence === value;
            return (
              <Pressable
                key={value}
                className={`rounded-full border px-3 py-2 ${active ? "bg-primary/10 border-primary/30" : "bg-background border-border"}`}
                onPress={() => setRecurrence(value)}
              >
                <Text
                  className={`text-xs font-medium ${active ? "text-primary" : "text-muted-foreground"}`}
                >
                  {value}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SectionCard>

      <SectionCard
        title="Subtasks"
        description="Break work into actionable steps"
        summary={
          subtasks.length ? `${subtasks.length} subtasks` : "No subtasks"
        }
        open={expanded.subtasks}
        onToggle={() => toggleSection("subtasks")}
      >
        {subtasks.length === 0 ? (
          <Text className="text-xs text-muted-foreground">
            No subtasks yet.
          </Text>
        ) : null}
        {subtasks.map((subtask) => (
          <Pressable
            key={subtask.id}
            className="flex-row items-center gap-2 rounded-xl border border-border bg-background px-3 py-2"
            onPress={() =>
              setSubtasks((current) =>
                current.map((item) =>
                  item.id === subtask.id
                    ? { ...item, completed: !item.completed }
                    : item,
                ),
              )
            }
          >
            <Text
              className={`text-xs ${subtask.completed ? "text-success" : "text-muted-foreground"}`}
            >
              {subtask.completed ? "Done" : "Todo"}
            </Text>
            <Text className="text-sm text-foreground flex-1">
              {subtask.title}
            </Text>
            <Pressable
              className="rounded-md border border-danger/20 bg-danger/10 px-2 py-1"
              onPress={() =>
                setSubtasks((current) =>
                  current.filter((item) => item.id !== subtask.id),
                )
              }
            >
              <Text className="text-[10px] text-danger">Remove</Text>
            </Pressable>
          </Pressable>
        ))}

        <View className="flex-row gap-2">
          <TextInput
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            placeholder="New subtask"
            placeholderTextColor="#6b7280"
            value={newSubtask}
            onChangeText={setNewSubtask}
          />
          <Button
            label="Add"
            variant="ghost"
            onPress={() => {
              const title = newSubtask.trim();
              if (!title) return;
              setSubtasks((current) => [
                ...current,
                {
                  id: `${Date.now()}-${Math.random()}`,
                  title,
                  completed: false,
                },
              ]);
              setNewSubtask("");
            }}
          />
        </View>
      </SectionCard>

      <SectionCard
        title="Reminders"
        description="Get nudged before due time"
        summary={`${remindersEnabled ? "Enabled" : "Disabled"} • ${reminderOffsetMinutes || "?"} min`}
        open={expanded.reminders}
        onToggle={() => toggleSection("reminders")}
      >
        <View className="flex-row gap-2 items-center">
          <Pressable
            className={`rounded-full border px-3 py-2 ${remindersEnabled ? "bg-primary/10 border-primary/30" : "bg-background border-border"}`}
            onPress={() => setRemindersEnabled((value) => !value)}
          >
            <Text
              className={`text-xs ${remindersEnabled ? "text-primary" : "text-muted-foreground"}`}
            >
              {remindersEnabled ? "Enabled" : "Disabled"}
            </Text>
          </Pressable>
          <TextInput
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            placeholder="Offset before due (minutes)"
            placeholderTextColor="#6b7280"
            keyboardType="number-pad"
            value={reminderOffsetMinutes}
            onChangeText={setReminderOffsetMinutes}
          />
        </View>
      </SectionCard>

      <Button
        label={isSubmitting ? "Saving..." : "Add Task"}
        onPress={handleSubmit}
        disabled={isSubmitting || !!validationError}
      />
    </ScrollView>
  );
}
