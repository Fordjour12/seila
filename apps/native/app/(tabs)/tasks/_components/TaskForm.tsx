import React from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "../../../../components/ui";
import { parseDayKey, toLocalDayKey } from "../../../../lib/date";
import { useModeThemeColors } from "../../../../lib/theme";

type Priority = "low" | "medium" | "high";
type Recurrence = "none" | "daily" | "weekly" | "monthly";
type SectionKey = "plan" | "schedule" | "repeat" | "subtasks" | "reminders";
type Subtask = { id: string; title: string; completed: boolean };

type Props = {
  title?: string;
  showHeader?: boolean;
  taskTitle: string;
  note: string;
  priority: Priority;
  dueDayKey?: string;
  estimateMinutes: string;
  recurrence: Recurrence;
  blockedReason: string;
  subtasks: Subtask[];
  remindersEnabled: boolean;
  reminderOffsetMinutes: string;
  helperText?: string;
  validationError: string | null;
  isSubmitting: boolean;
  submitLabel: string;
  onTaskTitleChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onPriorityChange: (value: Priority) => void;
  onDueDayKeyChange: (value?: string) => void;
  onEstimateMinutesChange: (value: string) => void;
  onRecurrenceChange: (value: Recurrence) => void;
  onBlockedReasonChange: (value: string) => void;
  onSubtasksChange: (value: Subtask[]) => void;
  onRemindersEnabledChange: (value: boolean) => void;
  onReminderOffsetMinutesChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
};

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
    <View className="rounded-2xl border border-border bg-surface/80 overflow-hidden">
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
    </View>
  );
}

export function TaskForm({
  title,
  showHeader = true,
  taskTitle,
  note,
  priority,
  dueDayKey,
  estimateMinutes,
  recurrence,
  blockedReason,
  subtasks,
  remindersEnabled,
  reminderOffsetMinutes,
  helperText,
  validationError,
  isSubmitting,
  submitLabel,
  onTaskTitleChange,
  onNoteChange,
  onPriorityChange,
  onDueDayKeyChange,
  onEstimateMinutesChange,
  onRecurrenceChange,
  onBlockedReasonChange,
  onSubtasksChange,
  onRemindersEnabledChange,
  onReminderOffsetMinutesChange,
  onSubmit,
  onCancel,
}: Props) {
  const [showDuePicker, setShowDuePicker] = React.useState(false);
  const [newSubtask, setNewSubtask] = React.useState("");
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

  return (
    <View className="gap-4">
      {showHeader && title && (
        <View>
          <Text className="text-xs uppercase tracking-[1.5px] text-muted-foreground">
            {title}
          </Text>
        </View>
      )}

      <View className="relative rounded-3xl border border-border bg-card p-5 overflow-hidden">
        {showHeader && (
          <>
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
          </>
        )}

        <View className="mt-5 gap-3">
          <TextInput
            className="rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground"
            placeholder="Task title"
            placeholderTextColor="#6b7280"
            value={taskTitle}
            onChangeText={onTaskTitleChange}
            autoFocus
            returnKeyType="next"
          />
          <TextInput
            className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground min-h-[88px]"
            placeholder="Notes (optional)"
            placeholderTextColor="#6b7280"
            value={note}
            onChangeText={onNoteChange}
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
                  onPress={() => onPriorityChange(value)}
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
            onChangeText={onEstimateMinutesChange}
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
            onChangeText={onBlockedReasonChange}
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
            onPress={() => onDueDayKeyChange(undefined)}
          />
        </View>
        {showDuePicker ? (
          <DateTimePicker
            value={parseDayKey(dueDayKey)}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_event, date) => {
              setShowDuePicker(Platform.OS === "ios");
              if (date) onDueDayKeyChange(toLocalDayKey(date));
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
                onPress={() => onRecurrenceChange(value)}
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
        summary={subtasks.length ? `${subtasks.length} subtasks` : "No subtasks"}
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
              onSubtasksChange(
                subtasks.map((item) =>
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
                onSubtasksChange(
                  subtasks.filter((item) => item.id !== subtask.id),
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
              onSubtasksChange([
                ...subtasks,
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
            onPress={() => onRemindersEnabledChange(!remindersEnabled)}
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
            onChangeText={onReminderOffsetMinutesChange}
          />
        </View>
      </SectionCard>

      {helperText ? (
        <Text className="text-xs text-muted-foreground">{helperText}</Text>
      ) : null}

      <Button
        label={isSubmitting ? "Saving..." : submitLabel}
        onPress={onSubmit}
        disabled={isSubmitting || !!validationError}
      />
      {onCancel ? (
        <Button label="Cancel" variant="ghost" onPress={onCancel} />
      ) : null}
    </View>
  );
}

export default TaskForm;
