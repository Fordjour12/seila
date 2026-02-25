import React from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { Button } from "../../../../components/ui";
import { parseDayKey, toLocalDayKey } from "../../../../lib/date";

type Props = {
  title: string;
  taskTitle: string;
  note: string;
  priority: "low" | "medium" | "high";
  dueDayKey?: string;
  estimateMinutes: string;
  recurrence: "none" | "daily" | "weekly" | "monthly";
  blockedReason: string;
  subtasks: Array<{ id: string; title: string; completed: boolean }>;
  remindersEnabled: boolean;
  reminderOffsetMinutes: string;
  helperText?: string;
  validationError: string | null;
  isSubmitting: boolean;
  submitLabel: string;
  onTaskTitleChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onPriorityChange: (value: "low" | "medium" | "high") => void;
  onDueDayKeyChange: (value?: string) => void;
  onEstimateMinutesChange: (value: string) => void;
  onRecurrenceChange: (value: "none" | "daily" | "weekly" | "monthly") => void;
  onBlockedReasonChange: (value: string) => void;
  onSubtasksChange: (value: Array<{ id: string; title: string; completed: boolean }>) => void;
  onRemindersEnabledChange: (value: boolean) => void;
  onReminderOffsetMinutesChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
};

export function TaskForm({
  title,
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

  return (
    <View className="gap-3">
      <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
        <Text className="text-base font-medium text-foreground">{title}</Text>

        <TextInput
          className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
          placeholder="Task title"
          placeholderTextColor="#6b7280"
          value={taskTitle}
          onChangeText={onTaskTitleChange}
          autoFocus
        />

        <TextInput
          className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
          placeholder="Notes (optional)"
          placeholderTextColor="#6b7280"
          value={note}
          onChangeText={onNoteChange}
          multiline
        />

        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider">Priority</Text>
          <View className="flex-row flex-wrap gap-2">
            {(["low", "medium", "high"] as const).map((value) => {
              const active = priority === value;
              const cls =
                value === "high"
                  ? "bg-danger/10 border-danger/30"
                  : value === "medium"
                    ? "bg-warning/10 border-warning/30"
                    : "bg-success/10 border-success/30";
              return (
                <Pressable
                  key={value}
                  className={`rounded-full border px-3 py-2 ${active ? cls : "bg-background border-border"}`}
                  onPress={() => onPriorityChange(value)}
                >
                  <Text className={`text-xs font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>
                    {value}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider">Reminder</Text>
          <View className="flex-row gap-2">
            <Pressable
              className={`rounded-full border px-3 py-2 ${remindersEnabled ? "bg-primary/10 border-primary/30" : "bg-background border-border"}`}
              onPress={() => onRemindersEnabledChange(!remindersEnabled)}
            >
              <Text className={`text-xs ${remindersEnabled ? "text-primary" : "text-muted-foreground"}`}>
                {remindersEnabled ? "Enabled" : "Disabled"}
              </Text>
            </Pressable>
            <TextInput
              className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
              placeholder="Offset before due (minutes)"
              placeholderTextColor="#6b7280"
              keyboardType="number-pad"
              value={reminderOffsetMinutes}
              onChangeText={onReminderOffsetMinutesChange}
            />
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider">Estimate</Text>
          <TextInput
            className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
            placeholder="Minutes (e.g. 30)"
            placeholderTextColor="#6b7280"
            keyboardType="number-pad"
            value={estimateMinutes}
            onChangeText={onEstimateMinutesChange}
          />
        </View>

        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider">Recurrence</Text>
          <View className="flex-row flex-wrap gap-2">
            {(["none", "daily", "weekly", "monthly"] as const).map((value) => {
              const active = recurrence === value;
              return (
                <Pressable
                  key={value}
                  className={`rounded-full border px-3 py-2 ${active ? "bg-primary/10 border-primary/30" : "bg-background border-border"}`}
                  onPress={() => onRecurrenceChange(value)}
                >
                  <Text className={`text-xs font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
                    {value}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider">Blocked Reason</Text>
          <TextInput
            className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
            placeholder="Optional blocker context"
            placeholderTextColor="#6b7280"
            value={blockedReason}
            onChangeText={onBlockedReasonChange}
          />
        </View>

        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider">Subtasks</Text>
          {(subtasks || []).map((subtask) => (
            <Pressable
              key={subtask.id}
              className="flex-row items-center gap-2 rounded-xl border border-border bg-background px-3 py-2"
              onPress={() =>
                onSubtasksChange(
                  subtasks.map((item) =>
                    item.id === subtask.id ? { ...item, completed: !item.completed } : item,
                  ),
                )
              }
            >
              <Text className={`text-xs ${subtask.completed ? "text-success" : "text-muted-foreground"}`}>
                {subtask.completed ? "Done" : "Todo"}
              </Text>
              <Text className="text-sm text-foreground flex-1">{subtask.title}</Text>
              <Pressable
                onPress={() => onSubtasksChange(subtasks.filter((item) => item.id !== subtask.id))}
                className="rounded-md border border-danger/20 bg-danger/10 px-2 py-1"
              >
                <Text className="text-[10px] text-danger">Remove</Text>
              </Pressable>
            </Pressable>
          ))}
          <View className="flex-row gap-2">
            <TextInput
              className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
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
                  { id: `${Date.now()}-${Math.random()}`, title, completed: false },
                ]);
                setNewSubtask("");
              }}
            />
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider">Due Date</Text>
          <View className="flex-row gap-2">
            <Pressable
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2"
              onPress={() => setShowDuePicker(true)}
            >
              <Text className="text-sm text-foreground">{dueDayKey || "No due date"}</Text>
            </Pressable>
            <Button label="Clear" variant="ghost" onPress={() => onDueDayKeyChange(undefined)} />
          </View>
        </View>

        {helperText ? <Text className="text-xs text-muted-foreground">{helperText}</Text> : null}

        {validationError ? (
          <View className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
            <Text className="text-xs text-danger">{validationError}</Text>
          </View>
        ) : null}

        <View className="flex-row gap-2">
          <Button
            label={isSubmitting ? "Saving..." : submitLabel}
            onPress={onSubmit}
            disabled={isSubmitting || !!validationError}
          />
          {onCancel ? <Button label="Cancel" variant="ghost" onPress={onCancel} /> : null}
        </View>

        {showDuePicker ? (
          <DateTimePicker
            value={parseDayKey(dueDayKey)}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_event, date) => {
              setShowDuePicker(Platform.OS === "ios");
              if (date) {
                onDueDayKeyChange(toLocalDayKey(date));
              }
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

export default TaskForm;
