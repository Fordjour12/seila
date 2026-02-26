import { api } from "@seila/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

const MOOD_OPTIONS = [
  { value: 1, emoji: "😞", label: "Rough" },
  { value: 2, emoji: "😕", label: "Low" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😊", label: "Great" },
] as const;

const FLAG_OPTIONS = [
  "anxious",
  "grateful",
  "overwhelmed",
  "calm",
  "tired",
  "motivated",
  "stressed",
  "peaceful",
  "isolated",
  "connected",
  "uncertain",
  "focused",
] as const;

const WEEKLY_PROMPTS = [
  "What felt good this week?",
  "What felt hard?",
  "What do you want to carry into next week?",
] as const;

function idempotencyKey(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

function formatTimeAgo(timestamp?: number) {
  if (!timestamp) return "No check-ins yet";
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
}

export default function CheckinScreen() {
  const { toast } = useToast();
  const submitCheckin = useMutation(api.commands.checkins.submitCheckin.submitCheckin);

  const [mode, setMode] = useState<"daily" | "weekly">("daily");
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [energy, setEnergy] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [flags, setFlags] = useState<Array<(typeof FLAG_OPTIONS)[number]>>([]);
  const [note, setNote] = useState("");
  const [weeklyAnswers, setWeeklyAnswers] = useState(["", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lastCheckin = useQuery(api.queries.lastCheckin.lastCheckin, {});
  const recentCheckins = useQuery(api.queries.recentCheckins.recentCheckins, {
    limit: 7,
  });

  const moodAverage = useMemo(() => {
    if (!recentCheckins || recentCheckins.length === 0) return null;
    const total = recentCheckins.reduce((sum, c) => sum + c.mood, 0);
    return (total / recentCheckins.length).toFixed(1);
  }, [recentCheckins]);

  const energyAverage = useMemo(() => {
    if (!recentCheckins || recentCheckins.length === 0) return null;
    const total = recentCheckins.reduce((sum, c) => sum + c.energy, 0);
    return (total / recentCheckins.length).toFixed(1);
  }, [recentCheckins]);

  const toggleFlag = (flag: (typeof FLAG_OPTIONS)[number]) => {
    setFlags((prev) => (prev.includes(flag) ? prev.filter((item) => item !== flag) : [...prev, flag]));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitCheckin({
        idempotencyKey: idempotencyKey(`checkin.${mode}`),
        type: mode,
        mood,
        energy,
        flags,
        note: note.trim() || undefined,
        ...(mode === "weekly"
          ? {
              weeklyAnswers: {
                feltGood: weeklyAnswers[0].trim(),
                feltHard: weeklyAnswers[1].trim(),
                carryForward: weeklyAnswers[2].trim(),
              },
            }
          : {}),
      });

      toast.show({
        variant: "success",
        label: mode === "daily" ? "Daily check-in saved" : "Weekly check-in saved",
      });
      setNote("");
      if (mode === "weekly") {
        setWeeklyAnswers(["", "", ""]);
      }
    } catch {
      toast.show({
        variant: "danger",
        label: "Failed to save check-in",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-6 pb-24 gap-5"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View className="rounded-3xl border border-border bg-surface p-5">
        <Text className="text-xs uppercase tracking-[1px] text-muted-foreground">
          Check-in
        </Text>
        <Text className="text-3xl text-foreground font-serif tracking-tight mt-2">
          Calibrate your day
        </Text>
        <Text className="text-sm text-muted-foreground mt-2 leading-5">
          Daily is a quick state update. Weekly adds reflective context for better next-week planning.
        </Text>
      </View>

      <View className="rounded-2xl border border-border bg-surface p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-foreground">Recent signal</Text>
          <Text className="text-xs text-muted-foreground">
            {formatTimeAgo(lastCheckin?.occurredAt)}
          </Text>
        </View>
        <View className="mt-3 flex-row gap-2">
          <View className="flex-1 rounded-xl border border-border bg-background p-3">
            <Text className="text-[11px] uppercase text-muted-foreground">Last mood</Text>
            <Text className="text-lg text-foreground font-semibold mt-1">
              {lastCheckin ? `${lastCheckin.mood}/5` : "N/A"}
            </Text>
          </View>
          <View className="flex-1 rounded-xl border border-border bg-background p-3">
            <Text className="text-[11px] uppercase text-muted-foreground">7-day mood avg</Text>
            <Text className="text-lg text-foreground font-semibold mt-1">
              {moodAverage ?? "N/A"}
            </Text>
          </View>
          <View className="flex-1 rounded-xl border border-border bg-background p-3">
            <Text className="text-[11px] uppercase text-muted-foreground">7-day energy avg</Text>
            <Text className="text-lg text-foreground font-semibold mt-1">
              {energyAverage ?? "N/A"}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row rounded-xl border border-border bg-surface p-1">
        {(["daily", "weekly"] as const).map((value) => {
          const active = mode === value;
          return (
            <Pressable
              key={value}
              className={`flex-1 rounded-lg py-2.5 items-center ${active ? "bg-background border border-border" : ""}`}
              onPress={() => setMode(value)}
            >
              <Text className={`text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>
                {value === "daily" ? "Daily pulse" : "Weekly reflect"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="rounded-2xl border border-border bg-surface p-4">
        <Text className="text-base font-semibold text-foreground mb-3">Mood</Text>
        <View className="flex-row justify-between gap-2">
          {MOOD_OPTIONS.map((option) => {
            const selected = mood === option.value;
            return (
              <Pressable
                key={option.value}
                className={`flex-1 items-center rounded-xl border py-3 ${
                  selected
                    ? "bg-warning/10 border-warning/30"
                    : "bg-background border-border"
                }`}
                onPress={() => setMood(option.value)}
              >
                <Text className="text-lg">{option.emoji}</Text>
                <Text
                  className={`text-[10px] uppercase mt-1 ${
                    selected ? "text-warning" : "text-muted-foreground"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="rounded-2xl border border-border bg-surface p-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-base font-semibold text-foreground">Energy</Text>
          <Text className="text-sm text-warning font-medium">{energy}/5</Text>
        </View>
        <View className="mt-3 flex-row gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <Pressable
              key={value}
              className={`flex-1 h-9 rounded-md items-center justify-center ${
                value <= energy ? "bg-warning/80" : "bg-background border border-border"
              }`}
              onPress={() => setEnergy(value as 1 | 2 | 3 | 4 | 5)}
            >
              <Text
                className={`text-xs font-medium ${
                  value <= energy ? "text-background" : "text-muted-foreground"
                }`}
              >
                {value}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="rounded-2xl border border-border bg-surface p-4">
        <Text className="text-base font-semibold text-foreground mb-3">Flags</Text>
        <View className="flex-row flex-wrap gap-2">
          {FLAG_OPTIONS.map((flag) => {
            const active = flags.includes(flag);
            return (
              <Pressable
                key={flag}
                className={`rounded-full border px-3 py-2 ${
                  active
                    ? "bg-primary/10 border-primary/30"
                    : "bg-background border-border"
                }`}
                onPress={() => toggleFlag(flag)}
              >
                <Text className={`text-xs ${active ? "text-primary" : "text-muted-foreground"}`}>
                  {flag}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {mode === "weekly" ? (
        <View className="rounded-2xl border border-border bg-surface p-4 gap-4">
          <Text className="text-base font-semibold text-foreground">Weekly reflection</Text>
          {WEEKLY_PROMPTS.map((prompt, index) => (
            <View key={prompt}>
              <Text className="text-sm text-muted-foreground mb-2">{prompt}</Text>
              <TextInput
                className="rounded-xl border border-border bg-background px-3.5 py-3 text-foreground min-h-[84]"
                placeholder="Write a short reflection..."
                placeholderTextColor="#8b8b8b"
                multiline
                textAlignVertical="top"
                value={weeklyAnswers[index]}
                onChangeText={(value) => {
                  setWeeklyAnswers((prev) => {
                    const next = [...prev];
                    next[index] = value;
                    return next;
                  });
                }}
              />
            </View>
          ))}
        </View>
      ) : null}

      <View className="rounded-2xl border border-border bg-surface p-4">
        <Text className="text-base font-semibold text-foreground mb-2">
          Private note
        </Text>
        <TextInput
          className="rounded-xl border border-border bg-background px-3.5 py-3 text-foreground min-h-[96]"
          placeholder="Anything else worth capturing?"
          placeholderTextColor="#8b8b8b"
          multiline
          textAlignVertical="top"
          value={note}
          onChangeText={setNote}
        />
      </View>

      <Pressable
        className={`rounded-xl py-3.5 items-center ${
          isSubmitting ? "bg-muted" : "bg-warning"
        }`}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text
          className={`text-sm font-semibold ${
            isSubmitting ? "text-muted-foreground" : "text-background"
          }`}
        >
          {isSubmitting
            ? "Saving..."
            : mode === "daily"
              ? "Save daily check-in"
              : "Save weekly check-in"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
