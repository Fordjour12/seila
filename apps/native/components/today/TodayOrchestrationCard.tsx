import { api } from "@seila/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { Button } from "heroui-native";
import { useMemo } from "react";
import { Text, View } from "react-native";

import { SpicedCard } from "@/components/ui/SpicedCard";
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
        onPress: () => router.push("/recovery"),
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
    <SpicedCard className="mt-4 p-5">
      <View className="mb-4">
        <Text className="text-foreground text-xl font-bold tracking-tight">Today</Text>
        <Text className="text-muted-foreground text-sm font-medium mt-1">
          Single entry point for what today looks like.
        </Text>
      </View>

      <View className="flex-row gap-2 mt-2">
        <View className="flex-1 rounded-xl bg-secondary/50 p-3 border border-border/10">
          <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Quiet</Text>
          <Text className="text-foreground text-sm font-semibold mt-1">
            {quietToday?.isQuiet ? "Active" : "Off"}
          </Text>
        </View>
        <View className="flex-1 rounded-xl bg-secondary/50 p-3 border border-border/10">
          <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Notes</Text>
          <Text className="text-foreground text-sm font-semibold mt-1">{scratchpadCount}</Text>
        </View>
        <View className="flex-1 rounded-xl bg-secondary/50 p-3 border border-border/10">
          <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Focus</Text>
          <Text className="text-foreground text-sm font-semibold mt-1">{focusCount}/3</Text>
        </View>
        <View className="flex-1 rounded-xl bg-secondary/50 p-3 border border-border/10">
          <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Habits</Text>
          <Text className="text-foreground text-sm font-semibold mt-1">{pendingHabits}</Text>
        </View>
      </View>

      <View className="mt-4 rounded-xl bg-primary/5 p-4 border border-primary/10">
        <Text className="text-primary text-base font-semibold">{nextAction.label}</Text>
        <Text className="text-muted-foreground text-sm mt-1">{nextAction.hint}</Text>
      </View>

      <View className="flex-row gap-3 mt-4 pt-2 border-t border-border/5">
        <Button
          size="md"
          variant="secondary"
          className="flex-1 rounded-full"
          onPress={() => {
            void setQuietToday({
              idempotencyKey: idempotencyKey("quiet.today.toggle"),
              isQuiet: !quietToday?.isQuiet,
            });
          }}
        >
          {quietToday?.isQuiet ? "Resume Day" : "Not Today"}
        </Button>
        <Button
          size="md"
          variant="primary"
          className="flex-1 rounded-full shadow-sm"
          isDisabled={!nextAction.onPress || Boolean(quietToday?.isQuiet)}
          onPress={() => nextAction.onPress?.()}
        >
          Do Next
        </Button>
      </View>
    </SpicedCard>
  );
}
