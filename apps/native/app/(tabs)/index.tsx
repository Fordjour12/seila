/**
 * Life OS — Today Screen
 * Route: app/(tabs)/index.tsx
 *
 * The single entry point. Shows everything relevant to right now.
 * Sections:
 *   - Greeting + date
 *   - Conversational capture input
 *   - AI suggestions (max 3)
 *   - Today's habits
 *   - Focus tasks (max 3)
 *   - Last check-in mood
 *   - Active pattern (if any)
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Colors, Typography, Spacing, Radius } from "../../constants/theme";
import { SectionLabel, EmptyState } from "../../components/ui";

// ─────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────

const MOCK_DATE = new Date();
const GREETING = (() => {
  const h = MOCK_DATE.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
})();

const MOCK_HABITS = [
  { id: "1", name: "Morning walk", anchor: "morning", difficulty: "low", done: false },
  { id: "2", name: "Journaling", anchor: "morning", difficulty: "medium", done: true },
  { id: "3", name: "Read 20 pages", anchor: "evening", difficulty: "low", done: false },
];

const MOCK_FOCUS = [
  { id: "1", text: "Reply to Dr. Osei email" },
  { id: "2", text: "Book therapy appointment" },
];

const MOCK_SUGGESTIONS = [
  {
    id: "1",
    module: "checkin",
    headline: "How are you feeling today?",
    subtext: "You haven't checked in yet.",
    action: "checkin",
    priority: "high",
  },
  {
    id: "2",
    module: "habits",
    headline: "Morning walk is still open",
    subtext: "You usually do this before noon.",
    action: "habits",
    priority: "medium",
  },
];

const MOCK_LAST_CHECKIN = { mood: 3, energy: 4 };
const MOOD_EMOJI = ["", "😞", "😕", "😐", "🙂", "😊"];

// ─────────────────────────────────────────────
// CAPTURE INPUT
// ─────────────────────────────────────────────

function CaptureInput() {
  const [text, setText] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const replyOpacity = useRef(new Animated.Value(0)).current;

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const input = text.trim();
    setText("");
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setReply("Noted. Sounds like a heavy start — that's okay.");
    Animated.timing(replyOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(replyOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(
        () => setReply(null),
      );
    }, 6000);
  };

  return (
    <View style={captureStyles.wrap}>
      <TextInput
        style={captureStyles.input}
        placeholder="How are you right now?"
        placeholderTextColor={Colors.textMuted}
        value={text}
        onChangeText={setText}
        onSubmitEditing={submit}
        returnKeyType="send"
        blurOnSubmit
        maxLength={280}
        editable={!loading}
      />
      {loading && <Text style={captureStyles.loading}>…</Text>}
      {reply && (
        <Animated.View style={[captureStyles.reply, { opacity: replyOpacity }]}>
          <Text style={captureStyles.replyText}>{reply}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const captureStyles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.xxl,
  },
  input: {
    backgroundColor: Colors.bgRaised,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    ...Typography.bodyMD,
    color: Colors.textPrimary,
  },
  loading: {
    ...Typography.bodySM,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    paddingLeft: Spacing.xl,
  },
  reply: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  replyText: {
    ...Typography.bodySM,
    color: Colors.textSecondary,
    fontStyle: "italic",
    fontFamily: "DMSans_300Light",
    lineHeight: 20,
  },
});

// ─────────────────────────────────────────────
// SUGGESTION CARD
// ─────────────────────────────────────────────

interface Suggestion {
  id: string;
  module: string;
  headline: string;
  subtext?: string;
  action?: string;
  priority: "low" | "medium" | "high";
}

function SuggestionCard({
  suggestion,
  onDismiss,
}: {
  suggestion: Suggestion;
  onDismiss: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 60, duration: 200, useNativeDriver: true }),
    ]).start(onDismiss);
  };

  return (
    <Animated.View style={[suggStyles.card, { transform: [{ translateX: slideAnim }] }]}>
      <View style={suggStyles.dot} />
      <View style={suggStyles.content}>
        <Text style={suggStyles.headline}>{suggestion.headline}</Text>
        {suggestion.subtext && <Text style={suggStyles.subtext}>{suggestion.subtext}</Text>}
      </View>
      <Pressable onPress={dismiss} style={suggStyles.dismiss}>
        <Text style={suggStyles.dismissText}>×</Text>
      </Pressable>
    </Animated.View>
  );
}

const suggStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgRaised,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.amber,
    marginTop: 6,
    flexShrink: 0,
  },
  content: { flex: 1 },
  headline: { ...Typography.labelLG, color: Colors.textPrimary, marginBottom: 2 },
  subtext: { ...Typography.bodySM, color: Colors.textSecondary },
  dismiss: {
    padding: Spacing.xs,
  },
  dismissText: {
    fontSize: 18,
    color: Colors.textMuted,
    lineHeight: 20,
  },
});

// ─────────────────────────────────────────────
// HABIT ROW (today view)
// ─────────────────────────────────────────────

interface HabitItem {
  id: string;
  name: string;
  anchor: string;
  difficulty: string;
  done: boolean;
}

function TodayHabitRow({ habit, onToggle }: { habit: HabitItem; onToggle: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 15 }),
    ]).start();
    onToggle();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable onPress={handlePress} style={habitStyles.row}>
        <View style={[habitStyles.check, habit.done && habitStyles.checkDone]}>
          {habit.done && <Text style={habitStyles.checkMark}>✓</Text>}
        </View>
        <View style={habitStyles.info}>
          <Text style={[habitStyles.name, habit.done && habitStyles.nameDone]}>{habit.name}</Text>
          <Text style={habitStyles.anchor}>{habit.anchor}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const habitStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkDone: {
    backgroundColor: Colors.sage,
    borderColor: Colors.sage,
  },
  checkMark: { fontSize: 12, color: Colors.bg, fontWeight: "600" },
  info: { flex: 1 },
  name: { ...Typography.bodyMD, color: Colors.textPrimary },
  nameDone: { color: Colors.textMuted, textDecorationLine: "line-through" },
  anchor: { ...Typography.bodyXS, color: Colors.textMuted, marginTop: 1 },
});

// ─────────────────────────────────────────────
// FOCUS TASK ROW (today view)
// ─────────────────────────────────────────────

function FocusTaskRow({
  task,
  onComplete,
}: {
  task: { id: string; text: string };
  onComplete: () => void;
}) {
  return (
    <Pressable onPress={onComplete} style={focusStyles.row}>
      <View style={focusStyles.bullet} />
      <Text style={focusStyles.text}>{task.text}</Text>
    </Pressable>
  );
}

const focusStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.amber,
    flexShrink: 0,
  },
  text: { ...Typography.bodyMD, color: Colors.textPrimary, flex: 1 },
});

// ─────────────────────────────────────────────
// TODAY SCREEN
// ─────────────────────────────────────────────

export default function TodayScreen() {
  const [habits, setHabits] = useState(MOCK_HABITS);
  const [focus, setFocus] = useState(MOCK_FOCUS);
  const [suggestions, setSuggestions] = useState(MOCK_SUGGESTIONS);

  const dateStr = MOCK_DATE.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const toggleHabit = (id: string) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, done: !h.done } : h)));
  };

  const completeTask = (id: string) => {
    setFocus((prev) => prev.filter((t) => t.id !== id));
  };

  const dismissSuggestion = (id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  const doneCount = habits.filter((h) => h.done).length;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{GREETING}</Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>

        {/* ── CAPTURE ── */}
        <CaptureInput />

        {/* ── SUGGESTIONS ── */}
        {suggestions.length > 0 && (
          <View style={styles.section}>
            {suggestions.map((s) => (
              <SuggestionCard key={s.id} suggestion={s} onDismiss={() => dismissSuggestion(s.id)} />
            ))}
          </View>
        )}

        {/* ── HABITS ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SectionLabel style={styles.sectionLabelInline}>Habits</SectionLabel>
            <Text style={styles.sectionMeta}>
              {doneCount}/{habits.length}
            </Text>
          </View>
          <View style={styles.card}>
            {habits.map((h) => (
              <TodayHabitRow key={h.id} habit={h} onToggle={() => toggleHabit(h.id)} />
            ))}
          </View>
        </View>

        {/* ── FOCUS ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SectionLabel style={styles.sectionLabelInline}>Focus</SectionLabel>
            <Text style={styles.sectionMeta}>{focus.length}/3</Text>
          </View>
          {focus.length === 0 ? (
            <EmptyState
              icon="○"
              title="Focus is clear"
              subtitle="Add tasks from your inbox when ready"
            />
          ) : (
            <View style={styles.card}>
              {focus.map((t) => (
                <FocusTaskRow key={t.id} task={t} onComplete={() => completeTask(t.id)} />
              ))}
            </View>
          )}
        </View>

        {/* ── LAST CHECK-IN ── */}
        <View style={styles.section}>
          <SectionLabel>Last check-in</SectionLabel>
          <Pressable onPress={() => router.push("/(tabs)/checkin")} style={styles.checkinCard}>
            <Text style={styles.moodEmoji}>{MOOD_EMOJI[MOCK_LAST_CHECKIN.mood]}</Text>
            <View style={styles.checkinInfo}>
              <Text style={styles.checkinLabel}>Mood · Energy</Text>
              <Text style={styles.checkinValues}>
                {MOCK_LAST_CHECKIN.mood}/5 · {MOCK_LAST_CHECKIN.energy}/5
              </Text>
            </View>
            <Text style={styles.checkinTime}>Today, 8:30am</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxl },
  header: { marginBottom: Spacing.xxl },
  greeting: { ...Typography.displayXL, color: Colors.textPrimary, marginBottom: Spacing.xs },
  date: { ...Typography.bodyMD, color: Colors.textMuted, fontFamily: "DMSans_300Light" },
  section: { marginBottom: Spacing.xxl },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionLabelInline: { marginBottom: 0, flex: 1 },
  sectionMeta: { ...Typography.labelSM, color: Colors.textMuted },
  card: {
    backgroundColor: Colors.bgRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    paddingHorizontal: Spacing.lg,
    overflow: "hidden",
  },
  checkinCard: {
    backgroundColor: Colors.bgRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  moodEmoji: { fontSize: 28 },
  checkinInfo: { flex: 1 },
  checkinLabel: { ...Typography.eyebrow, color: Colors.textMuted, marginBottom: 3 },
  checkinValues: { ...Typography.labelLG, color: Colors.textPrimary },
  checkinTime: { ...Typography.bodyXS, color: Colors.textMuted },
});
