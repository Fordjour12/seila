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
  StyleSheet,
  Pressable,
  TextInput,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radius } from "../../../constants/theme";
import { SectionLabel, EmptyState } from "../../../components/ui";

// ─────────────────────────────────────────────
// TYPES + MOCK
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// FOCUS SLOT
// ─────────────────────────────────────────────

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
      <View style={slotStyles.empty}>
        <Text style={slotStyles.emptyText}>open slot</Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable style={slotStyles.filled} onLongPress={onDefer}>
        <Pressable onPress={handleComplete} style={slotStyles.check}>
          <View style={slotStyles.checkInner} />
        </Pressable>
        <Text style={slotStyles.taskText}>{task.text}</Text>
        <Pressable onPress={onDefer} style={slotStyles.defer}>
          <Text style={slotStyles.deferText}>↓</Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const slotStyles = StyleSheet.create({
  empty: {
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { ...Typography.eyebrow, color: Colors.textMuted },
  filled: {
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    backgroundColor: Colors.bgRaised,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkInner: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: Colors.transparent,
  },
  taskText: { ...Typography.bodyMD, color: Colors.textPrimary, flex: 1 },
  defer: { padding: Spacing.sm },
  deferText: { fontSize: 14, color: Colors.textMuted },
});

// ─────────────────────────────────────────────
// INBOX ROW
// ─────────────────────────────────────────────

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
    <View style={inboxStyles.wrap}>
      <Pressable onPress={toggle} style={inboxStyles.row}>
        <View style={inboxStyles.bullet} />
        <Text style={inboxStyles.text}>{task.text}</Text>
        <Text style={inboxStyles.meta}>{task.capturedAt}</Text>
      </Pressable>
      <Animated.View style={[inboxStyles.actions, { height: actionsHeight }]}>
        <View style={inboxStyles.actionsInner}>
          <Pressable
            onPress={() => {
              onFocus();
              setOpen(false);
            }}
            style={[
              inboxStyles.actionBtn,
              inboxStyles.actionFocus,
              focusFull && inboxStyles.actionDisabled,
            ]}
            disabled={focusFull}
          >
            <Text style={[inboxStyles.actionText, focusFull && { color: Colors.textMuted }]}>
              {focusFull ? "Focus full" : "Focus"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              onDefer();
              setOpen(false);
            }}
            style={[inboxStyles.actionBtn, inboxStyles.actionDefer]}
          >
            <Text style={inboxStyles.actionTextMuted}>Later</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              onDone();
              setOpen(false);
            }}
            style={[inboxStyles.actionBtn, inboxStyles.actionDone]}
          >
            <Text style={inboxStyles.actionTextMuted}>Done</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const inboxStyles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.bgRaised,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.textMuted,
    flexShrink: 0,
  },
  text: { ...Typography.bodyMD, color: Colors.textPrimary, flex: 1 },
  meta: { ...Typography.bodyXS, color: Colors.textMuted },
  actions: {
    overflow: "hidden",
    borderTopWidth: 1,
    borderTopColor: Colors.borderSoft,
  },
  actionsInner: {
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  actionFocus: { backgroundColor: Colors.amberGlow, borderColor: Colors.amberBorder },
  actionDefer: { borderColor: Colors.border },
  actionDone: { borderColor: Colors.border },
  actionDisabled: { opacity: 0.4 },
  actionText: { ...Typography.labelSM, color: Colors.amber },
  actionTextMuted: { ...Typography.labelSM, color: Colors.textMuted },
});

// ─────────────────────────────────────────────
// CAPTURE INPUT
// ─────────────────────────────────────────────

function CaptureBar({ onAdd }: { onAdd: (text: string) => void }) {
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    onAdd(text.trim());
    setText("");
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={captureStyles.row}>
        <TextInput
          style={captureStyles.input}
          placeholder="Capture a task…"
          placeholderTextColor={Colors.textMuted}
          value={text}
          onChangeText={setText}
          onSubmitEditing={submit}
          returnKeyType="done"
          blurOnSubmit={false}
        />
        <Pressable onPress={submit} style={captureStyles.btn} disabled={!text.trim()}>
          <Text style={captureStyles.btnText}>Add</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const captureStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: Spacing.sm,
    backgroundColor: Colors.bg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSoft,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.bgRaised,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Typography.bodyMD,
    color: Colors.textPrimary,
  },
  btn: {
    backgroundColor: Colors.amber,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { ...Typography.labelLG, color: Colors.bg },
});

// ─────────────────────────────────────────────
// TASKS SCREEN
// ─────────────────────────────────────────────

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
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Tasks</Text>
          <Text style={styles.title}>Focus on{"\n"}what matters.</Text>
        </View>

        {/* ── FOCUS ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SectionLabel style={styles.sectionLabelInline}>Today's focus</SectionLabel>
            <Text style={styles.sectionMeta}>{focusTasks.length}/3</Text>
          </View>
          <View style={styles.focusSlots}>
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

        {/* ── INBOX ── */}
        {inboxTasks.length > 0 && (
          <View style={styles.section}>
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

        {/* ── DEFERRED ── */}
        {deferredTasks.length > 0 && (
          <View style={styles.section}>
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
          <EmptyState icon="○" title="All clear" subtitle="Capture something when you're ready" />
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <CaptureBar onAdd={addTask} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxl },
  header: { marginBottom: Spacing.xxxl },
  eyebrow: { ...Typography.eyebrow, color: Colors.textMuted, marginBottom: Spacing.sm },
  title: { ...Typography.displayXL, color: Colors.textPrimary },
  section: { marginBottom: Spacing.xxl },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionLabelInline: { marginBottom: 0, flex: 1 },
  sectionMeta: { ...Typography.labelSM, color: Colors.textMuted },
  focusSlots: { gap: Spacing.sm },
});
