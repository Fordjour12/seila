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
import { Avatar } from "heroui-native";

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
  {
    id: "1",
    name: "Morning walk",
    anchor: "morning",
    difficulty: "low",
    done: false,
  },
  {
    id: "2",
    name: "Journaling",
    anchor: "morning",
    difficulty: "medium",
    done: true,
  },
  {
    id: "3",
    name: "Read 20 pages",
    anchor: "evening",
    difficulty: "low",
    done: false,
  },
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
    Animated.timing(replyOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setTimeout(() => {
      Animated.timing(replyOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setReply(null));
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
      Animated.timing(slideAnim, {
        toValue: 60,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(onDismiss);
  };

  return (
    <Animated.View
      style={[suggStyles.card, { transform: [{ translateX: slideAnim }] }]}
    >
      <View style={suggStyles.dot} />
      <View style={suggStyles.content}>
        <Text style={suggStyles.headline}>{suggestion.headline}</Text>
        {suggestion.subtext && (
          <Text style={suggStyles.subtext}>{suggestion.subtext}</Text>
        )}
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
  headline: {
    ...Typography.labelLG,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
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

function TodayHabitRow({
  habit,
  onToggle,
}: {
  habit: HabitItem;
  onToggle: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.93,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 15,
      }),
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
          <Text style={[habitStyles.name, habit.done && habitStyles.nameDone]}>
            {habit.name}
          </Text>
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
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, done: !h.done } : h)),
    );
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
        <Animated.View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{GREETING}</Text>
            <Text style={styles.date}>{dateStr}</Text>
          </View>
          <Avatar alt="JG" animation="disable-all">
            <Avatar.Image source={{ uri: "https://example.com/avatar.jpg" }} />
            <Avatar.Fallback>JG</Avatar.Fallback>
          </Avatar>
        </Animated.View>

        {/* ── CAPTURE ── */}
        <CaptureInput />

        {/* ── SUGGESTIONS ── */}
        {suggestions.length > 0 && (
          <View style={styles.section}>
            {suggestions.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onDismiss={() => dismissSuggestion(s.id)}
              />
            ))}
          </View>
        )}

        {/* ── HABITS ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SectionLabel style={styles.sectionLabelInline}>
              Habits
            </SectionLabel>
            <Text style={styles.sectionMeta}>
              {doneCount}/{habits.length}
            </Text>
          </View>
          <View style={styles.card}>
            {habits.map((h) => (
              <TodayHabitRow
                key={h.id}
                habit={h}
                onToggle={() => toggleHabit(h.id)}
              />
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
                <FocusTaskRow
                  key={t.id}
                  task={t}
                  onComplete={() => completeTask(t.id)}
                />
              ))}
            </View>
          )}
        </View>

        {/* ── LAST CHECK-IN ── */}
        <View style={styles.section}>
          <SectionLabel>Last check-in</SectionLabel>
          <Pressable
            onPress={() => router.push("/(tabs)/checkin")}
            style={styles.checkinCard}
          >
            <Text style={styles.moodEmoji}>
              {MOOD_EMOJI[MOCK_LAST_CHECKIN.mood]}
            </Text>
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
  greeting: {
    ...Typography.displayXL,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  date: {
    ...Typography.bodyMD,
    color: Colors.textMuted,
    fontFamily: "DMSans_300Light",
  },
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
  checkinLabel: {
    ...Typography.eyebrow,
    color: Colors.textMuted,
    marginBottom: 3,
  },
  checkinValues: { ...Typography.labelLG, color: Colors.textPrimary },
  checkinTime: { ...Typography.bodyXS, color: Colors.textMuted },
});

// home index.tsxj

import { api } from "@seila/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import {
  useToast,
  Card,
  Button,
  Chip,
  Separator,
  Surface,
} from "heroui-native";
import React, { useMemo } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";

import { getLocalDayKey } from "@/lib/date";
import {
  tasksFocusRef,
  tasksInboxRef,
  todayHabitsRef,
} from "@/lib/productivity-refs";
import {
  quietTodayRef,
  setQuietTodayRef,
  todayScratchpadRef,
} from "@/lib/recovery-refs";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type SuggestionItem = {
  _id: string;
  headline: string;
  subtext: string;
  priority: number;
  action?: {
    type: "open_screen" | "run_command";
    payload?: Record<string, unknown>;
  };
};

type ActionCard = {
  id: string;
  title: string;
  detail: string;
  cta: string;
  score: number;
  onPress: () => void;
};

// ─── UTILS ────────────────────────────────────────────────────────────────────
function idempotencyKey(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

function formatDateHeading(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function getTaskUrgency(task: { dueAt?: number; priority?: string }) {
  if (!task.dueAt) return "No due date";
  const now = Date.now();
  if (task.dueAt < now) return "Overdue";
  const hours = Math.round((task.dueAt - now) / (1000 * 60 * 60));
  if (hours <= 24) return "Due today";
  return `Due ${new Date(task.dueAt).toLocaleDateString()}`;
}

function mapSuggestionRoute(screen?: string) {
  if (screen === "checkin") return "/(tabs)/checkin";
  if (screen === "tasks") return "/(tabs)/tasks";
  if (screen === "finance") return "/(tabs)/finance";
  if (screen === "patterns") return "/(tabs)/patterns";
  if (screen === "weekly-review") return "/(tabs)/review";
  return undefined;
}

// ─── STAT CARD WITH THEME COLORS ──────────────────────────────────────────────
function StatCard({
  label,
  value,
  accentColor,
}: {
  label: string;
  value: string;
  accentColor: string;
}) {
  return (
    <Surface className="flex-1 rounded-3xl p-4 bg-muted border border-border">
      <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </Text>
      <Text className="text-2xl font-semibold text-foreground mt-1">
        {value}
      </Text>
    </Surface>
  );
}

// ─── FLOATING ACTION CARD ─────────────────────────────────────────────────────
function FloatingActionCard({
  action,
  index,
}: {
  action: ActionCard;
  index: number;
}) {
  const accentStyles = [
    "border-l-4 border-l-warning",
    "border-l-4 border-l-success",
    "border-l-4 border-l-accent",
  ];

  return (
    <Card
      className={`mb-3 rounded-2xl overflow-hidden ${accentStyles[index] || accentStyles[0]}`}
    >
      <Card.Body className="p-4 bg-surface">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-base font-semibold text-foreground">
              {action.title}
            </Text>
            <Text className="text-sm text-muted-foreground mt-1 leading-5">
              {action.detail}
            </Text>
          </View>
          <Button
            size="sm"
            variant="primary"
            onPress={action.onPress}
            className="self-center"
          >
            <Button.Label>{action.cta}</Button.Label>
          </Button>
        </View>
      </Card.Body>
    </Card>
  );
}

// ─── TASK CHIP ────────────────────────────────────────────────────────────────
function TaskChip({
  task,
  isFocus,
  onPress,
}: {
  task: { _id: string; title: string; dueAt?: number; priority?: string };
  isFocus?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <Surface
        variant="secondary"
        className={`rounded-2xl p-4 mb-2 ${isFocus ? "border-2 border-warning bg-warning/5" : ""}`}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            {isFocus && (
              <Chip size="sm" variant="soft" color="warning" className="mb-2">
                <Chip.Label>FOCUS</Chip.Label>
              </Chip>
            )}
            <Text
              className="text-sm font-medium text-foreground"
              numberOfLines={1}
            >
              {task.title}
            </Text>
            <Text className="text-xs text-muted-foreground mt-1">
              {getTaskUrgency(task)}
            </Text>
          </View>
          <View className="bg-accent/10 rounded-full px-3 py-1">
            <Text className="text-xs font-medium text-accent uppercase">
              {task.priority || "medium"}
            </Text>
          </View>
        </View>
      </Surface>
    </Pressable>
  );
}

// ─── SUGGESTION ORB ───────────────────────────────────────────────────────────
function SuggestionOrb({
  suggestion,
  isPrimary,
}: {
  suggestion: {
    id: string;
    title: string;
    detail: string;
    cta: string;
    onPress: () => void;
  };
  isPrimary?: boolean;
}) {
  return (
    <Pressable onPress={suggestion.onPress}>
      <Surface
        variant={isPrimary ? "secondary" : "tertiary"}
        className={`rounded-3xl p-4 mb-3 ${isPrimary ? "bg-accent/5 border border-accent/20" : ""}`}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text
              className={`font-medium ${isPrimary ? "text-accent" : "text-foreground"}`}
            >
              {suggestion.title}
            </Text>
            <Text className="text-xs text-muted-foreground mt-1 leading-4">
              {suggestion.detail}
            </Text>
          </View>
          <Button size="sm" variant="ghost" onPress={suggestion.onPress}>
            <Button.Label className="text-accent">
              {suggestion.cta}
            </Button.Label>
          </Button>
        </View>
      </Surface>
    </Pressable>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function TodayScreen() {
  const { toast } = useToast();
  const dayKey = getLocalDayKey();
  const quietToday = useQuery(quietTodayRef, {});
  const scratchpad = useQuery(todayScratchpadRef, {}) ?? [];
  const focusTasks = useQuery(tasksFocusRef, {}) ?? [];
  const inboxTasks = useQuery(tasksInboxRef, {}) ?? [];
  const habits = useQuery(todayHabitsRef, { dayKey }) ?? [];
  const lastCheckin = useQuery(api.queries.lastCheckin.lastCheckin, {});
  const suggestions = useQuery(
    api.queries.activeSuggestions.activeSuggestions,
    {},
  ) as SuggestionItem[] | undefined;
  const setQuietToday = useMutation(setQuietTodayRef);

  const completedHabits = habits.filter(
    (habit) => habit.todayStatus === "completed",
  ).length;
  const pendingHabits = habits.filter((habit) => !habit.todayStatus).length;
  const overdueTasks = inboxTasks.filter(
    (task) => typeof task.dueAt === "number" && task.dueAt < Date.now(),
  );
  const lowCapacity =
    (lastCheckin?.mood ?? 3) <= 2 || (lastCheckin?.energy ?? 3) <= 2;

  const prioritizedActions = useMemo(() => {
    const candidates: ActionCard[] = [];

    if (quietToday?.isQuiet) {
      candidates.push({
        id: "resume_day",
        title: "Quiet Day is on",
        detail: "Prompts are paused. Resume when you are ready to re-engage.",
        cta: "Resume",
        score: 140,
        onPress: () => {
          void setQuietToday({
            idempotencyKey: idempotencyKey("quiet.today.resume"),
            isQuiet: false,
          });
        },
      });
    }

    if (!lastCheckin) {
      candidates.push({
        id: "checkin",
        title: "Start with a quick check-in",
        detail:
          "A 20-second check-in improves recommendation quality for today.",
        cta: "Check-in",
        score: 130,
        onPress: () => router.push("/(tabs)/checkin"),
      });
    }

    if (lowCapacity && !quietToday?.isQuiet) {
      candidates.push({
        id: "quiet_mode",
        title: "Protect capacity for today",
        detail: "Low mood or energy detected. Quiet mode can reduce overwhelm.",
        cta: "Activate",
        score: 120,
        onPress: () => {
          void setQuietToday({
            idempotencyKey: idempotencyKey("quiet.today.activate"),
            isQuiet: true,
          });
        },
      });
    }

    if (overdueTasks.length > 0) {
      candidates.push({
        id: "overdue_tasks",
        title: "Resolve overdue tasks first",
        detail: `${overdueTasks.length} overdue item${overdueTasks.length > 1 ? "s" : ""} blocking momentum.`,
        cta: "Review",
        score: 116,
        onPress: () => router.push("/(tabs)/tasks"),
      });
    }

    if (focusTasks.length === 0 && inboxTasks.length > 0) {
      candidates.push({
        id: "set_focus",
        title: "Set one focus task",
        detail:
          "Pick one high-impact item for this session and ignore the rest.",
        cta: "Set Focus",
        score: 108,
        onPress: () => router.push("/(tabs)/tasks"),
      });
    }

    if (pendingHabits > 0) {
      candidates.push({
        id: "log_habit",
        title: "Log one habit to protect streak",
        detail: `${pendingHabits} habit${pendingHabits > 1 ? "s" : ""} are still pending today.`,
        cta: "Log",
        score: 96,
        onPress: () => router.push("/(tabs)/habits"),
      });
    }

    if (scratchpad.length > 0) {
      candidates.push({
        id: "triage_note",
        title: "Triage one scratchpad note",
        detail: `${scratchpad.length} quick capture${scratchpad.length > 1 ? "s" : ""} can be processed into action.`,
        cta: "Triage",
        score: 92,
        onPress: () => router.push("/(tabs)/review"),
      });
    }

    return candidates.sort((a, b) => b.score - a.score).slice(0, 3);
  }, [
    focusTasks.length,
    inboxTasks.length,
    lastCheckin,
    lowCapacity,
    overdueTasks.length,
    pendingHabits,
    quietToday?.isQuiet,
    scratchpad.length,
    setQuietToday,
  ]);

  const rankedSuggestions = useMemo(() => {
    const fromBackend = (suggestions ?? []).map((item) => {
      const screen =
        item.action?.payload && typeof item.action.payload.screen === "string"
          ? item.action.payload.screen
          : undefined;
      const route = mapSuggestionRoute(screen);
      return {
        id: item._id,
        title: item.headline,
        detail: item.subtext,
        score: item.priority * 100,
        cta: route ? "Open" : "Keep",
        onPress: () => {
          if (route) {
            router.push(route);
          }
        },
      };
    });

    const localBoosts = prioritizedActions.map((action, index) => ({
      id: `local:${action.id}`,
      title: action.title,
      detail: action.detail,
      score: action.score - index,
      cta: action.cta,
      onPress: action.onPress,
    }));

    return [...localBoosts, ...fromBackend]
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [prioritizedActions, suggestions]);

  const handleToggleQuiet = () => {
    void setQuietToday({
      idempotencyKey: idempotencyKey("quiet.today.toggle.today"),
      isQuiet: !quietToday?.isQuiet,
    }).then(() => {
      toast.show({
        variant: "success",
        label: quietToday?.isQuiet ? "Day resumed" : "Quiet day enabled",
      });
    });
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-5 pt-12 pb-24"
      showsVerticalScrollIndicator={false}
    >
      {/* ── HERO ──────────────────────────────────────────────── */}
      <Surface className="rounded-4xl bg-accent p-6 mb-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-accent-foreground/80 text-sm font-medium uppercase tracking-wider">
            {formatDateHeading(new Date())}
          </Text>
          <Chip variant="soft" size="sm" className="bg-accent-foreground/20">
            <Chip.Label className="text-accent-foreground">Today</Chip.Label>
          </Chip>
        </View>
        <Text className="text-3xl font-bold text-accent-foreground mb-2">
          {greeting}
        </Text>
        <Text className="text-base text-accent-foreground/90 leading-6">
          {quietToday?.isQuiet
            ? "Quiet day is active. Keep the day intentionally light."
            : (prioritizedActions[0]?.detail ??
              "You are clear. Pick one meaningful action and protect momentum.")}
        </Text>
      </Surface>

      {/* ── STATS ROW ─────────────────────────────────────────── */}
      <View className="flex-row gap-3 mb-8">
        <StatCard
          label="Focus"
          value={`${focusTasks.length}/3`}
          accentColor="warning"
        />
        <StatCard
          label="Habits"
          value={`${completedHabits}/${habits.length || 0}`}
          accentColor="success"
        />
        <StatCard
          label="Mood"
          value={lastCheckin ? `${lastCheckin.mood}/5` : "—"}
          accentColor="accent"
        />
      </View>

      {/* ── PRIMARY ACTIONS ───────────────────────────────────── */}
      <View className="mb-8">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-foreground">
            Primary Actions
          </Text>
          <Button size="sm" variant="ghost" onPress={handleToggleQuiet}>
            <Button.Label className="text-accent">
              {quietToday?.isQuiet ? "Resume day" : "Not today"}
            </Button.Label>
          </Button>
        </View>
        {prioritizedActions.length === 0 ? (
          <Surface variant="tertiary" className="rounded-2xl p-6">
            <Text className="text-sm text-muted-foreground text-center">
              No urgent actions. Keep focus narrow and continue with your
              current plan.
            </Text>
          </Surface>
        ) : (
          prioritizedActions.map((action, index) => (
            <FloatingActionCard key={action.id} action={action} index={index} />
          ))
        )}
      </View>

      <Separator className="my-6" />

      {/* ── TODAY'S TASKS ─────────────────────────────────────── */}
      <View className="mb-8">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-foreground">
            Today's Tasks
          </Text>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => router.push("/(tabs)/tasks")}
          >
            <Button.Label className="text-accent">View all</Button.Label>
          </Button>
        </View>
        {focusTasks.length === 0 && inboxTasks.length === 0 ? (
          <Surface variant="tertiary" className="rounded-2xl p-6">
            <Text className="text-sm text-muted-foreground text-center">
              No tasks captured. Add one action to anchor the day.
            </Text>
          </Surface>
        ) : (
          <View>
            {focusTasks.slice(0, 2).map((task) => (
              <TaskChip
                key={task._id}
                task={task}
                isFocus
                onPress={() => router.push(`/(tabs)/tasks/edit?id=${task._id}`)}
              />
            ))}
            {inboxTasks.slice(0, 3).map((task) => (
              <TaskChip
                key={task._id}
                task={task}
                onPress={() => router.push(`/(tabs)/tasks/edit?id=${task._id}`)}
              />
            ))}
          </View>
        )}
      </View>

      <Separator className="my-6" />

      {/* ── SUGGESTION STUDIO ─────────────────────────────────── */}
      <View>
        <Text className="text-lg font-semibold text-foreground mb-4">
          Suggestion Studio
        </Text>
        {rankedSuggestions.length === 0 ? (
          <Surface variant="tertiary" className="rounded-2xl p-6">
            <Text className="text-sm text-muted-foreground text-center">
              Suggestions will appear as new patterns are detected.
            </Text>
          </Surface>
        ) : (
          rankedSuggestions.map((suggestion, index) => (
            <SuggestionOrb
              key={suggestion.id}
              suggestion={suggestion}
              isPrimary={index === 0}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}
