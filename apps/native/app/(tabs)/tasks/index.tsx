/**
 * Life OS — Tasks Screen
 * Route: app/(tabs)/tasks/index.tsx
 *
 * Sections:
 *   - Focus (max 3 slots — enforced)
 *   - Inbox (triage: Focus / Later / Done)
 *   - Quick capture
 *
 * Rules:
 *   - 4th Focus item prompts defer/drop of existing
 *   - AI never populates Focus
 *   - "Abandoned" not "failed"
 */

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { api } from "@seila/backend/convex/_generated/api";
import { useQuery } from "convex/react";

import { SectionLabel } from "../../../components/ui";

type TaskState = "inbox" | "focus" | "deferred" | "done" | "abandoned";

interface Task {
  id: string;
  text: string;
  state: TaskState;
  capturedAt: string;
}

const MOCK_TASKS: Task[] = [
  { id: "1", text: "Reply to Dr. Osei email", state: "focus", capturedAt: "Today" },
  { id: "2", text: "Book therapy appointment", state: "focus", capturedAt: "Today" },
  { id: "3", text: "Pick up prescription", state: "inbox", capturedAt: "Today" },
  { id: "4", text: "Read recovery workbook ch.4", state: "inbox", capturedAt: "Yesterday" },
  { id: "5", text: "Call mom back", state: "inbox", capturedAt: "Yesterday" },
  { id: "6", text: "Look into support group times", state: "deferred", capturedAt: "3 days ago" },
];

function FocusSlot({
  task,
  onComplete,
  onDefer,
}: {
  task?: Task;
  onComplete?: () => void;
  onDefer?: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleComplete = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 15 }),
    ]).start(onComplete);
  };

  if (!task) {
    return (
      <View className="h-14 border border-dashed border-border rounded-lg items-center justify-center">
        <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold">open slot</Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable onLongPress={onDefer} className="h-14 border border-border rounded-lg bg-surface flex-row items-center px-4 gap-3">
        <Pressable onPress={handleComplete} className="w-5.5 h-5.5 border border-border rounded-sm items-center justify-center">
          <View className="w-2 h-2 rounded-sm" />
        </Pressable>
        <Text className="text-base text-foreground flex-1">{task.text}</Text>
        <Pressable onPress={onDefer} className="p-2">
          <Text className="text-muted-foreground">↓</Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

function InboxRow({
  task,
  onFocus,
  onDefer,
  onDone,
  focusFull,
}: {
  task: Task;
  onFocus: () => void;
  onDefer: () => void;
  onDone: () => void;
  focusFull: boolean;
}) {
  const [open, setOpen] = useState(false);
  const heightAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    Animated.timing(heightAnim, {
      toValue: next ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const actionsHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 50],
  });

  return (
    <View className="bg-surface rounded-lg border border-border overflow-hidden mb-2">
      <Pressable onPress={toggle} className="flex-row items-center gap-3 p-4">
        <View className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
        <Text className="text-base text-foreground flex-1">{task.text}</Text>
        <Text className="text-xs text-muted-foreground">{task.capturedAt}</Text>
      </Pressable>
      <Animated.View style={{ height: actionsHeight }} className="overflow-hidden border-t border-border">
        <View className="flex-row gap-2 p-3">
          <Pressable
            onPress={() => {
              onFocus();
              setOpen(false);
            }}
            className={`flex-1 items-center py-2 rounded-sm border ${focusFull ? "opacity-40" : "bg-amber-500/10 border-amber-500/20"}`}
            disabled={focusFull}
          >
            <Text className={`text-xs font-medium ${focusFull ? "text-muted-foreground" : "text-amber-500"}`}>
              {focusFull ? "Focus full" : "Focus"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              onDefer();
              setOpen(false);
            }}
            className="flex-1 items-center py-2 rounded-sm border border-border"
          >
            <Text className="text-xs text-muted-foreground">Later</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              onDone();
              setOpen(false);
            }}
            className="flex-1 items-center py-2 rounded-sm border border-border"
          >
            <Text className="text-xs text-muted-foreground">Done</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

function CaptureBar({ onAdd }: { onAdd: (text: string) => void }) {
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    onAdd(text.trim());
    setText("");
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View className="flex-row gap-2 bg-background pt-4 pb-6 px-6 border-t border-border">
        <TextInput
          className="flex-1 bg-surface border border-border rounded-lg px-4 py-3 text-base text-foreground"
          placeholder="Capture a task…"
          placeholderTextColor="#6b7280"
          value={text}
          onChangeText={setText}
          onSubmitEditing={submit}
          returnKeyType="done"
          blurOnSubmit={false}
        />
        <Pressable onPress={submit} className="bg-amber-500 rounded-lg px-4 items-center justify-center" disabled={!text.trim()}>
          <Text className="text-base font-medium text-background">Add</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function TasksScreen() {
  const [tasks, setTasks] = useState(MOCK_TASKS);

  const focusTasks = tasks.filter((t) => t.state === "focus");
  const inboxTasks = tasks.filter((t) => t.state === "inbox");
  const deferredTasks = tasks.filter((t) => t.state === "deferred");
  const focusFull = focusTasks.length >= 3;

  const updateState = (id: string, state: TaskState) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, state } : t)));
  };

  const addTask = (text: string) => {
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text,
        state: "inbox",
        capturedAt: "Just now",
      },
    ]);
  };

  const focusSlots = Array.from({ length: 3 }, (_, i) => focusTasks[i] ?? null);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-6 pb-24 gap-6"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View className="mb-4">
        <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Tasks</Text>
        <Text className="text-3xl font-serif text-foreground tracking-tight">Focus on{"\n"}what matters.</Text>
      </View>

      <View className="gap-3">
        <View className="flex-row justify-between items-center mb-3">
          <SectionLabel>Today&apos;s focus</SectionLabel>
          <Text className="text-xs text-muted-foreground font-medium">{focusTasks.length}/3</Text>
        </View>
        <View className="gap-2">
          {focusSlots.map((task, i) => (
            <FocusSlot
              key={task?.id ?? `empty-${i}`}
              task={task ?? undefined}
              onComplete={() => task && updateState(task.id, "done")}
              onDefer={() => task && updateState(task.id, "inbox")}
            />
          ))}
        </View>
      </View>

      {inboxTasks.length > 0 && (
        <View className="gap-3">
          <SectionLabel>Inbox</SectionLabel>
          {inboxTasks.map((task) => (
            <InboxRow
              key={task.id}
              task={task}
              focusFull={focusFull}
              onFocus={() => updateState(task.id, "focus")}
              onDefer={() => updateState(task.id, "deferred")}
              onDone={() => updateState(task.id, "done")}
            />
          ))}
        </View>
      )}

      {deferredTasks.length > 0 && (
        <View className="gap-3">
          <SectionLabel>Later</SectionLabel>
          {deferredTasks.map((task) => (
            <InboxRow
              key={task.id}
              task={task}
              focusFull={focusFull}
              onFocus={() => updateState(task.id, "focus")}
              onDefer={() => updateState(task.id, "deferred")}
              onDone={() => updateState(task.id, "done")}
            />
          ))}
        </View>
      )}

      {inboxTasks.length === 0 && focusTasks.length === 0 && (
        <View className="py-12 items-center justify-center">
          <Text className="text-base text-muted-foreground">All clear</Text>
          <Text className="text-sm text-muted-foreground mt-1">Capture something when you&apos;re ready</Text>
        </View>
      )}

      <View className="h-20" />
    </ScrollView>
  );
}
