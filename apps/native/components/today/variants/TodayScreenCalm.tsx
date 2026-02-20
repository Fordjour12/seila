import React, { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { EmptyState, SectionLabel } from "@/components/ui";

type Habit = {
  id: string;
  name: string;
  done: boolean;
};

type FocusTask = {
  id: string;
  text: string;
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
const MOCK_LAST_CHECKIN = { mood: 3, energy: 4, time: "Today, 8:30am" };
const MOOD_EMOJI = ["", "😞", "😕", "😐", "🙂", "😊"];

export function TodayScreenCalm() {
  const [input, setInput] = useState("");
  const [habits, setHabits] = useState(MOCK_HABITS);
  const [focus, setFocus] = useState(MOCK_FOCUS);

  const doneCount = useMemo(() => habits.filter((h) => h.done).length, [habits]);
  const nextFocus = focus[0];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Today</Text>
          <Text style={styles.title}>Keep scope small.</Text>
          <Text style={styles.subtitle}>One steady step is enough.</Text>
        </View>

        <View style={styles.captureWrap}>
          <TextInput
            value={input}
            onChangeText={setInput}
            maxLength={280}
            placeholder="How are you right now?"
            placeholderTextColor={Colors.textMuted}
            style={styles.captureInput}
          />
        </View>

        <View style={styles.section}>
          <SectionLabel style={styles.sectionLabelInline}>Next action</SectionLabel>
          <View style={styles.featureCard}>
            <Text style={styles.featureLabel}>Focus now</Text>
            <Text style={styles.featureValue}>{nextFocus ? nextFocus.text : "No focus task set"}</Text>
            <Pressable style={styles.featureAction} onPress={() => router.push("/(tabs)/tasks")}>
              <Text style={styles.featureActionText}>Open Tasks</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <SectionLabel style={styles.sectionLabelInline}>Last check-in</SectionLabel>
          <Pressable style={styles.checkinCard} onPress={() => router.push("/(tabs)/checkin")}>
            <Text style={styles.checkinEmoji}>{MOOD_EMOJI[MOCK_LAST_CHECKIN.mood]}</Text>
            <View style={styles.checkinInfo}>
              <Text style={styles.checkinLabel}>Mood · Energy</Text>
              <Text style={styles.checkinValue}>
                {MOCK_LAST_CHECKIN.mood}/5 · {MOCK_LAST_CHECKIN.energy}/5
              </Text>
            </View>
            <Text style={styles.checkinTime}>{MOCK_LAST_CHECKIN.time}</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SectionLabel style={styles.sectionLabelInline}>Habits</SectionLabel>
            <Text style={styles.meta}>{doneCount}/{habits.length}</Text>
          </View>
          <View style={styles.card}>
            {habits.map((habit) => (
              <Pressable
                key={habit.id}
                style={styles.row}
                onPress={() => {
                  setHabits((prev) => prev.map((h) => (h.id === habit.id ? { ...h, done: !h.done } : h)));
                }}
              >
                <View style={[styles.dot, habit.done && styles.dotDone]} />
                <Text style={[styles.rowText, habit.done && styles.rowTextDone]}>{habit.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SectionLabel style={styles.sectionLabelInline}>Focus queue</SectionLabel>
            <Text style={styles.meta}>{focus.length}/3</Text>
          </View>
          {focus.length === 0 ? (
            <EmptyState icon="○" title="Focus is clear" subtitle="Add tasks from your inbox when ready" />
          ) : (
            <View style={styles.card}>
              {focus.map((task) => (
                <Pressable
                  key={task.id}
                  style={styles.row}
                  onPress={() => setFocus((prev) => prev.filter((t) => t.id !== task.id))}
                >
                  <View style={styles.bullet} />
                  <Text style={styles.rowText}>{task.text}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxl, paddingBottom: Spacing.xxxl },
  hero: { marginBottom: Spacing.xxl },
  kicker: { ...Typography.eyebrow, color: Colors.textMuted, marginBottom: Spacing.xs },
  title: { ...Typography.displayXL, color: Colors.textPrimary },
  subtitle: { ...Typography.bodyMD, color: Colors.textSecondary, marginTop: Spacing.xs },
  captureWrap: { marginBottom: Spacing.xxl },
  captureInput: {
    backgroundColor: Colors.bgRaised,
    borderColor: Colors.borderSoft,
    borderWidth: 1,
    borderRadius: Radius.lg,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    ...Typography.bodyMD,
  },
  section: { marginBottom: Spacing.xxl },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  sectionLabelInline: { marginBottom: 0 },
  meta: { ...Typography.labelSM, color: Colors.textMuted },
  featureCard: {
    backgroundColor: Colors.bgRaised,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
  },
  featureLabel: { ...Typography.eyebrow, color: Colors.amber },
  featureValue: { ...Typography.labelLG, color: Colors.textPrimary, marginTop: Spacing.sm },
  featureAction: {
    alignSelf: "flex-start",
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  featureActionText: { ...Typography.labelSM, color: Colors.textPrimary },
  checkinCard: {
    alignItems: "center",
    backgroundColor: Colors.bgRaised,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  checkinEmoji: { fontSize: 24 },
  checkinInfo: { flex: 1 },
  checkinLabel: { ...Typography.eyebrow, color: Colors.textMuted, marginBottom: 2 },
  checkinValue: { ...Typography.labelLG, color: Colors.textPrimary },
  checkinTime: { ...Typography.bodyXS, color: Colors.textMuted },
  card: {
    backgroundColor: Colors.bgRaised,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.lg,
    overflow: "hidden",
    paddingHorizontal: Spacing.lg,
  },
  row: {
    alignItems: "center",
    borderBottomColor: Colors.borderSoft,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dotDone: {
    backgroundColor: Colors.sage,
    borderColor: Colors.sage,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.amber,
  },
  rowText: { ...Typography.bodyMD, color: Colors.textPrimary, flex: 1 },
  rowTextDone: { color: Colors.textMuted, textDecorationLine: "line-through" },
});
