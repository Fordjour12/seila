import { api } from "@seila/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { Button, Surface } from "heroui-native";
import { useMemo } from "react";
import { Text, View } from "react-native";

import {
  quietTodayRef,
  recoveryContextRef,
  setQuietTodayRef,
  todayScratchpadRef,
} from "@/lib/recovery-refs";

function idempotencyKey(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

type NextAction = {
  label: string;
  hint: string;
  onPress?: () => void;
};

export function TodayOrchestrationCard() {
  const quietToday = useQuery(quietTodayRef, {});
  const scratchpad = useQuery(todayScratchpadRef, {});
  const focus = useQuery(api.queries.taskQueries.todayFocus);
  const habits = useQuery(api.queries.todayHabits.todayHabits);
  const lastCheckin = useQuery(api.queries.lastCheckin.lastCheckin);
  const recoveryContext = useQuery(recoveryContextRef, {});

  const setQuietToday = useMutation(setQuietTodayRef);

  const scratchpadCount = scratchpad?.length ?? 0;
  const focusCount = focus?.length ?? 0;
  const pendingHabits = (habits ?? []).filter((habit) => !habit.todayStatus).length;
  const lowCapacity = (lastCheckin?.mood ?? 3) <= 2 || (lastCheckin?.energy ?? 3) <= 2;
  const hasRecoveryContext =
    Boolean(recoveryContext?.hardDayLooksLike) ||
    Boolean(recoveryContext?.restDefinition) ||
    Boolean(recoveryContext?.knownTriggers.length);

  const nextAction = useMemo<NextAction>(() => {
    if (quietToday?.isQuiet) {
      return {
        label: "Quiet Day Active",
        hint: "System prompts are paused. Resume when you're ready.",
      };
    }

    if (!lastCheckin) {
      return {
        label: "Check in",
        hint: "Start with one quick signal before planning anything else.",
        onPress: () => router.push("/checkin"),
      };
    }

    if (lowCapacity && !quietToday?.isQuiet) {
      if (scratchpadCount === 0) {
        return {
          label: "Capture one line",
          hint: "Low-capacity day detected. Add one rough note and stop there if needed.",
        };
      }

      return {
        label: "Set Not Today",
        hint: "Give yourself a quiet day. You can resume at any time.",
        onPress: () => {
          void setQuietToday({
            idempotencyKey: idempotencyKey("quiet.today.from-next"),
            isQuiet: true,
          });
        },
      };
    }

    if (!hasRecoveryContext) {
      return {
        label: "Add your recovery context",
        hint: "Define hard-day patterns and rest meaning so AI can adapt to you.",
        onPress: () => router.push("/recovery-context"),
      };
    }

    if (scratchpadCount >= 3) {
      return {
        label: "Triage one note",
        hint: "There are a few rough notes. Process just one and leave the rest parked.",
      };
    }

    if (pendingHabits > 0) {
      return {
        label: "Log one habit",
        hint: "Choose one easy habit from today’s list and keep it light.",
        onPress: () => router.push("/"),
      };
    }

    if (focusCount === 0) {
      return {
        label: "Set one focus task",
        hint: "Pick one inbox item for focus and leave the rest parked.",
        onPress: () => router.push("/"),
      };
    }

    if (scratchpadCount > 0) {
      return {
        label: "Triage one note",
        hint: "Process one scratchpad note, ignore the rest for now.",
        onPress: () => router.push("/"),
      };
    }

    return {
      label: "Protect momentum",
      hint: "Today is coherent. Keep scope narrow and stay gentle.",
    };
  }, [
    focusCount,
    hasRecoveryContext,
    lastCheckin,
    lowCapacity,
    pendingHabits,
    quietToday?.isQuiet,
    setQuietToday,
    scratchpadCount,
  ]);

  return (
    <Surface variant="secondary" className="mt-3 p-4 rounded-xl">
      <Text className="text-foreground font-medium">Today</Text>
      <Text className="text-muted text-xs mt-1">Single entry point for what today looks like.</Text>

      <View className="flex-row gap-2 mt-3">
        <View className="flex-1 rounded-lg bg-default-100 p-2">
          <Text className="text-muted text-[11px]">Quiet</Text>
          <Text className="text-foreground text-xs font-medium">
            {quietToday?.isQuiet ? "On" : "Off"}
          </Text>
        </View>
        <View className="flex-1 rounded-lg bg-default-100 p-2">
          <Text className="text-muted text-[11px]">Scratchpad</Text>
          <Text className="text-foreground text-xs font-medium">{scratchpadCount}</Text>
        </View>
        <View className="flex-1 rounded-lg bg-default-100 p-2">
          <Text className="text-muted text-[11px]">Focus</Text>
          <Text className="text-foreground text-xs font-medium">{focusCount}/3</Text>
        </View>
        <View className="flex-1 rounded-lg bg-default-100 p-2">
          <Text className="text-muted text-[11px]">Habits</Text>
          <Text className="text-foreground text-xs font-medium">{pendingHabits} pending</Text>
        </View>
      </View>

      <View className="mt-3 rounded-lg bg-default-100 p-3">
        <Text className="text-foreground text-sm font-medium">{nextAction.label}</Text>
        <Text className="text-muted text-xs mt-1">{nextAction.hint}</Text>
      </View>

      <View className="flex-row gap-2 mt-3">
        <Button
          size="sm"
          variant="secondary"
          onPress={() => {
            void setQuietToday({
              idempotencyKey: idempotencyKey("quiet.today.toggle"),
              isQuiet: !quietToday?.isQuiet,
            });
          }}
        >
          {quietToday?.isQuiet ? "Resume" : "Not Today"}
        </Button>
        <Button
          size="sm"
          variant="primary"
          isDisabled={!nextAction.onPress || Boolean(quietToday?.isQuiet)}
          onPress={() => nextAction.onPress?.()}
        >
          Do Next
        </Button>
      </View>
    </Surface>
  );
}
