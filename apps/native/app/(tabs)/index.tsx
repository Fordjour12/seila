import { api } from "@seila/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { useToast } from "heroui-native";
import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

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

function idempotencyKey(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

function formatDateHeading(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
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

export default function TodayScreen() {
  const { toast } = useToast();
  const dayKey = getLocalDayKey();
  const quietToday = useQuery(quietTodayRef, {});
  const scratchpad = useQuery(todayScratchpadRef, {}) ?? [];
  const focusTasks = useQuery(tasksFocusRef, {}) ?? [];
  const inboxTasks = useQuery(tasksInboxRef, {}) ?? [];
  const habits = useQuery(todayHabitsRef, { dayKey }) ?? [];
  const lastCheckin = useQuery(api.queries.lastCheckin.lastCheckin, {});
  const suggestions = useQuery(api.queries.activeSuggestions.activeSuggestions, {}) as
    | SuggestionItem[]
    | undefined;
  const setQuietToday = useMutation(setQuietTodayRef);

  const completedHabits = habits.filter((habit) => habit.todayStatus === "completed").length;
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
        cta: "Resume day",
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
        detail: "A 20-second check-in improves recommendation quality for today.",
        cta: "Open check-in",
        score: 130,
        onPress: () => router.push("/(tabs)/checkin" as any),
      });
    }

    if (lowCapacity && !quietToday?.isQuiet) {
      candidates.push({
        id: "quiet_mode",
        title: "Protect capacity for today",
        detail: "Low mood or energy detected. Quiet mode can reduce overwhelm.",
        cta: "Set not today",
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
        cta: "Review tasks",
        score: 116,
        onPress: () => router.push("/(tabs)/tasks" as any),
      });
    }

    if (focusTasks.length === 0 && inboxTasks.length > 0) {
      candidates.push({
        id: "set_focus",
        title: "Set one focus task",
        detail: "Pick one high-impact item for this session and ignore the rest.",
        cta: "Open focus",
        score: 108,
        onPress: () => router.push("/(tabs)/tasks" as any),
      });
    }

    if (pendingHabits > 0) {
      candidates.push({
        id: "log_habit",
        title: "Log one habit to protect streak",
        detail: `${pendingHabits} habit${pendingHabits > 1 ? "s" : ""} are still pending today.`,
        cta: "Open habits",
        score: 96,
        onPress: () => router.push("/(tabs)/habits" as any),
      });
    }

    if (scratchpad.length > 0) {
      candidates.push({
        id: "triage_note",
        title: "Triage one scratchpad note",
        detail: `${scratchpad.length} quick capture${scratchpad.length > 1 ? "s" : ""} can be processed into action.`,
        cta: "Open notes",
        score: 92,
        onPress: () => router.push("/(tabs)/review" as any),
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
        cta: route ? "Open" : "Keep in view",
        onPress: () => {
          if (route) {
            router.push(route as any);
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

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-5 pt-6 pb-24 gap-5"
      showsVerticalScrollIndicator={false}
    >
      <View className="rounded-3xl border border-border bg-surface p-5">
        <Text className="text-xs uppercase tracking-[1px] text-muted-foreground">
          {formatDateHeading(new Date())}
        </Text>
        <Text className="mt-2 text-3xl text-foreground font-serif tracking-tight">
          Today Brief
        </Text>
        <Text className="mt-2 text-sm text-muted-foreground leading-5">
          {quietToday?.isQuiet
            ? "Quiet day is active. Keep the day intentionally light."
            : prioritizedActions[0]?.detail ??
              "You are clear. Pick one meaningful action and protect momentum."}
        </Text>
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1 rounded-2xl border border-border bg-surface p-3">
          <Text className="text-[11px] uppercase text-muted-foreground">Focus</Text>
          <Text className="text-xl font-semibold text-foreground mt-1">
            {focusTasks.length}/3
          </Text>
        </View>
        <View className="flex-1 rounded-2xl border border-border bg-surface p-3">
          <Text className="text-[11px] uppercase text-muted-foreground">Habits</Text>
          <Text className="text-xl font-semibold text-foreground mt-1">
            {completedHabits}/{habits.length || 0}
          </Text>
        </View>
        <View className="flex-1 rounded-2xl border border-border bg-surface p-3">
          <Text className="text-[11px] uppercase text-muted-foreground">Mood</Text>
          <Text className="text-xl font-semibold text-foreground mt-1">
            {lastCheckin ? `${lastCheckin.mood}/5` : "N/A"}
          </Text>
        </View>
      </View>

      <View className="rounded-2xl border border-border bg-surface p-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg text-foreground font-semibold">Primary Actions</Text>
          <Pressable
            className="rounded-full border border-border px-3 py-1"
            onPress={handleToggleQuiet}
          >
            <Text className="text-xs text-warning">
              {quietToday?.isQuiet ? "Resume day" : "Not today"}
            </Text>
          </Pressable>
        </View>
        {prioritizedActions.length === 0 ? (
          <Text className="text-sm text-muted-foreground">
            No urgent actions. Keep focus narrow and continue with your current plan.
          </Text>
        ) : (
          <View className="gap-2">
            {prioritizedActions.map((action) => (
              <Pressable
                key={action.id}
                className="rounded-xl border border-border bg-background px-3.5 py-3"
                onPress={action.onPress}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-base text-foreground font-medium flex-1 pr-2">
                    {action.title}
                  </Text>
                  <Text className="text-xs text-warning">{action.cta}</Text>
                </View>
                <Text className="text-xs text-muted-foreground mt-1 leading-4">
                  {action.detail}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View className="rounded-2xl border border-border bg-surface p-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg text-foreground font-semibold">Today's Tasks</Text>
          <Pressable onPress={() => router.push("/(tabs)/tasks" as any)}>
            <Text className="text-xs text-warning">Open tasks</Text>
          </Pressable>
        </View>
        {focusTasks.length === 0 && inboxTasks.length === 0 ? (
          <Text className="text-sm text-muted-foreground">
            No tasks captured. Add one action to anchor the day.
          </Text>
        ) : (
          <View className="gap-2">
            {focusTasks.slice(0, 2).map((task) => (
              <Pressable
                key={task._id}
                className="rounded-xl border border-warning/30 bg-warning/10 px-3.5 py-3"
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/tasks/edit",
                    params: { id: task._id },
                  } as any)
                }
              >
                <Text className="text-[11px] uppercase text-warning">Focus now</Text>
                <Text className="text-sm text-foreground font-medium mt-1">{task.title}</Text>
                <Text className="text-xs text-muted-foreground mt-1">
                  {getTaskUrgency(task)}
                </Text>
              </Pressable>
            ))}
            {inboxTasks.slice(0, 3).map((task) => (
              <Pressable
                key={task._id}
                className="rounded-xl border border-border bg-background px-3.5 py-3"
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/tasks/edit",
                    params: { id: task._id },
                  } as any)
                }
              >
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="text-sm text-foreground flex-1" numberOfLines={1}>
                    {task.title}
                  </Text>
                  <Text className="text-[10px] uppercase text-muted-foreground">
                    {task.priority || "medium"}
                  </Text>
                </View>
                <Text className="text-xs text-muted-foreground mt-1">
                  {getTaskUrgency(task)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View className="rounded-2xl border border-border bg-surface p-4">
        <Text className="text-lg text-foreground font-semibold mb-3">
          Suggestion Studio
        </Text>
        <View className="gap-2.5">
          {rankedSuggestions.length === 0 ? (
            <Text className="text-sm text-muted-foreground">
              Suggestions will appear as new patterns are detected.
            </Text>
          ) : (
            rankedSuggestions.map((suggestion, index) => (
              <Pressable
                key={suggestion.id}
                className={`rounded-xl border px-3.5 py-3 ${
                  index === 0
                    ? "bg-primary/10 border-primary/30"
                    : "bg-background border-border"
                }`}
                onPress={suggestion.onPress}
              >
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="text-sm text-foreground font-medium flex-1">
                    {suggestion.title}
                  </Text>
                  <Text className="text-xs text-warning">{suggestion.cta}</Text>
                </View>
                <Text className="text-xs text-muted-foreground mt-1 leading-4">
                  {suggestion.detail}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}
