import React, { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { Colors, Radius, Spacing, Typography } from "@/constants/theme";

type Habit = {
  id: string;
  name: string;
  done: boolean;
};

type FocusTask = {
  id: string;
  text: string;
};

type Suggestion = {
  id: string;
  headline: string;
  action: string;
  priority: "low" | "medium" | "high";
};

const MOCK_HABITS: Habit[] = [
  { id: "1", name: "Morning walk", done: false },
  { id: "2", name: "Journaling", done: true },
  { id: "3", name: "Read 20 pages", done: false },
];

const MOCK_FOCUS: FocusTask[] = [
  { id: "1", text: "Reply to Dr. Osei email" },
  { id: "2", text: "Book therapy appointment" },
];

const MOCK_SUGGESTIONS: Suggestion[] = [
  { id: "1", headline: "Quick check-in available", action: "Open check-in", priority: "high" },
  { id: "2", headline: "One task can be parked", action: "Open tasks", priority: "medium" },
  { id: "3", headline: "Pattern insight is ready", action: "Open patterns", priority: "low" },
];

export function TodayScreenCommand() {
  const [habits, setHabits] = useState(MOCK_HABITS);
  const [focus, setFocus] = useState(MOCK_FOCUS);
  const [suggestions, setSuggestions] = useState(MOCK_SUGGESTIONS);

  const doneHabits = useMemo(() => habits.filter((h) => h.done).length, [habits]);
  const completion = useMemo(() => {
    const total = habits.length + focus.length;
    const done = doneHabits;
    if (total === 0) return 0;
    return Math.round((done / total) * 100);
  }, [doneHabits, focus.length, habits.length]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Today Command Center</Text>
          <Text style={styles.subtitle}>Fast status, fast actions.</Text>
        </View>

        <View style={styles.metricsRow}>
          <Metric label="Progress" value={`${completion}%`} />
          <Metric label="Habits" value={`${doneHabits}/${habits.length}`} />
          <Metric label="Focus" value={`${focus.length}/3`} />
          <Metric label="Signals" value={`${suggestions.length}`} />
        </View>

        <View style={styles.quickRow}>
          <QuickAction label="Check-in" onPress={() => router.push("/(tabs)/checkin")} />
          <QuickAction label="Tasks" onPress={() => router.push("/(tabs)/tasks/index" as never)} />
          <QuickAction label="Patterns" onPress={() => router.push("/(tabs)/patterns")} />
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Suggestions</Text>
          {suggestions.map((s) => (
            <View key={s.id} style={styles.suggestionRow}>
              <View style={[styles.priorityDot, styles[`priority_${s.priority}` as const]]} />
              <View style={styles.suggestionTextWrap}>
                <Text style={styles.suggestionHeadline}>{s.headline}</Text>
                <Text style={styles.suggestionAction}>{s.action}</Text>
              </View>
              <Pressable
                onPress={() => setSuggestions((prev) => prev.filter((item) => item.id !== s.id))}
                style={styles.dismiss}
              >
                <Text style={styles.dismissText}>Dismiss</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Focus Queue</Text>
          {focus.map((task) => (
            <Pressable
              key={task.id}
              style={styles.taskRow}
              onPress={() => setFocus((prev) => prev.filter((t) => t.id !== task.id))}
            >
              <Text style={styles.taskText}>{task.text}</Text>
              <Text style={styles.completeText}>Done</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Habits</Text>
          {habits.map((habit) => (
            <Pressable
              key={habit.id}
              style={styles.taskRow}
              onPress={() => {
                setHabits((prev) =>
                  prev.map((h) => (h.id === habit.id ? { ...h, done: !h.done } : h)),
                );
              }}
            >
              <Text style={[styles.taskText, habit.done && styles.taskDone]}>{habit.name}</Text>
              <Text style={styles.completeText}>{habit.done ? "Undo" : "Done"}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function QuickAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <Text style={styles.quickActionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxl, paddingBottom: Spacing.xxxl },
  header: { marginBottom: Spacing.lg },
  title: { ...Typography.displayLG, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySM, color: Colors.textMuted, marginTop: Spacing.xs },
  metricsRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.md },
  metricCard: {
    width: "48%",
    backgroundColor: Colors.bgRaised,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  metricLabel: { ...Typography.eyebrow, color: Colors.textMuted },
  metricValue: { ...Typography.labelLG, color: Colors.textPrimary, marginTop: 2 },
  quickRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg },
  quickAction: {
    flex: 1,
    backgroundColor: Colors.amberGlow,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  quickActionText: { ...Typography.labelSM, color: Colors.amber },
  block: {
    backgroundColor: Colors.bgRaised,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  blockTitle: { ...Typography.labelLG, color: Colors.textPrimary, marginBottom: Spacing.sm },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSoft,
    paddingVertical: Spacing.sm,
  },
  suggestionTextWrap: { flex: 1 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priority_high: { backgroundColor: Colors.rose },
  priority_medium: { backgroundColor: Colors.amber },
  priority_low: { backgroundColor: Colors.sage },
  suggestionHeadline: { ...Typography.bodySM, color: Colors.textPrimary },
  suggestionAction: { ...Typography.bodyXS, color: Colors.textMuted, marginTop: 2 },
  dismiss: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  dismissText: { ...Typography.bodyXS, color: Colors.textMuted },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: Colors.borderSoft,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  taskText: { ...Typography.bodySM, color: Colors.textPrimary, flex: 1 },
  taskDone: { color: Colors.textMuted, textDecorationLine: "line-through" },
  completeText: { ...Typography.bodyXS, color: Colors.amber },
});
