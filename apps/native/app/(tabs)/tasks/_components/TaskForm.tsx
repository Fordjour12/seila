import React from "react";
import { Text, TextInput, View } from "react-native";

import { Button } from "../../../../components/ui";

type Props = {
  title: string;
  taskTitle: string;
  helperText?: string;
  validationError: string | null;
  isSubmitting: boolean;
  submitLabel: string;
  onTaskTitleChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
};

export function TaskForm({
  title,
  taskTitle,
  helperText,
  validationError,
  isSubmitting,
  submitLabel,
  onTaskTitleChange,
  onSubmit,
  onCancel,
}: Props) {
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
      </View>
    </View>
  );
}

export default TaskForm;
