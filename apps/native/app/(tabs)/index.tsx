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
import { HABITS_ENABLED } from "@/lib/features";
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
import { WeekCalendar } from "./tasks/_components";

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
  if (screen === "tasks") return "/(tabs)/tasks/index";
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
  const habits =
    useQuery(todayHabitsRef, HABITS_ENABLED ? { dayKey } : "skip") ?? [];
  const lastCheckin = useQuery(api.queries.lastCheckin.lastCheckin, {});
  const suggestions = useQuery(
    api.queries.activeSuggestions.activeSuggestions,
    {},
  ) as SuggestionItem[] | undefined;
  const setQuietToday = useMutation(setQuietTodayRef);

  const completedHabits = HABITS_ENABLED
    ? habits.filter((habit) => habit.todayStatus === "completed").length
    : 0;
  const pendingHabits = HABITS_ENABLED
    ? habits.filter((habit) => !habit.todayStatus).length
    : 0;
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
        onPress: () => router.push("/(tabs)/tasks/index" as never),
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
        onPress: () => router.push("/(tabs)/tasks/index" as never),
      });
    }

    if (HABITS_ENABLED && pendingHabits > 0) {
      candidates.push({
        id: "log_habit",
        title: "Log one habit for momentum",
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
    HABITS_ENABLED,
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
            router.push(route as never);
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
      contentContainerClassName="px-3 pt-12 pb-24"
      showsVerticalScrollIndicator={false}
    >
      {/* ── HERO ──────────────────────────────────────────────── */}
      <Surface className="rounded-4xl bg-accent mb-6">
        {/* Week Calendar Strip */}
        <WeekCalendar
          selectedDate={new Date()}
          onSelectDate={() => { }}
          highlightDates={[]}
        />

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
      <View>
        <Button onPress={() => { router.push("/hardmode") }}>
          <Text> hard mode</Text>
        </Button>
      </View>

      {/* ── STATS ROW ─────────────────────────────────────────── */}
      <View className="flex-row gap-3 mb-8">
        <StatCard
          label="Focus"
          value={`${focusTasks.length}/3`}
          accentColor="warning"
        />
        <StatCard
          label={HABITS_ENABLED ? "Habits" : "Inbox"}
          value={
            HABITS_ENABLED
              ? `${completedHabits}/${habits.length || 0}`
              : `${inboxTasks.length}`
          }
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
            onPress={() => router.push("/(tabs)/tasks/index" as never)}
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
