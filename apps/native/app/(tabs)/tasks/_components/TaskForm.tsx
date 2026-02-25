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
  helperText?: string;
  validationError: string | null;
  isSubmitting: boolean;
  submitLabel: string;
  onTaskTitleChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onPriorityChange: (value: "low" | "medium" | "high") => void;
  onDueDayKeyChange: (value?: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
};

export function TaskForm({
  title,
  taskTitle,
  note,
  priority,
  dueDayKey,
  helperText,
  validationError,
  isSubmitting,
  submitLabel,
  onTaskTitleChange,
  onNoteChange,
  onPriorityChange,
  onDueDayKeyChange,
  onSubmit,
  onCancel,
}: Props) {
  const [showDuePicker, setShowDuePicker] = React.useState(false);

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
