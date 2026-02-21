/**
 * Life OS — Check-in Screen
 * Route: app/(tabs)/checkin/index.tsx
 *
 * Two modes: daily (quick) and weekly (reflective).
 * Mood picker: emoji-anchored 1–5.
 * Energy slider: 1–5 with haptic feedback.
 * Flag chips: quick tags.
 * Optional private note.
 */

import React, { useState, useRef } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Animated } from "react-native";
import { Button } from "../../../components/ui";

const MOOD_OPTIONS = [
  { value: 1, emoji: "😞", label: "Rough" },
  { value: 2, emoji: "😕", label: "Low" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😊", label: "Great" },
];

const FLAG_OPTIONS = [
  "anxious",
  "calm",
  "grateful",
  "overwhelmed",
  "focused",
  "tired",
  "restless",
  "hopeful",
  "irritable",
  "connected",
  "lonely",
  "proud",
];

const WEEKLY_PROMPTS = [
  "What felt good this week?",
  "What felt hard?",
  "What do I want to carry into next week?",
];

function MoodPicker({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <View className="flex-row justify-between gap-2">
      {MOOD_OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={`flex-1 items-center gap-1 py-3 rounded-lg border ${
              selected ? "bg-amber-500/10 border-amber-500/20" : "bg-surface border-border"
            }`}
          >
            <Text className={selected ? "text-amber-500" : ""}>{opt.emoji}</Text>
            <Text className={`text-[9px] uppercase tracking-widest font-bold ${selected ? "text-amber-500" : "text-muted-foreground"}`}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function EnergySlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const LEVELS = [1, 2, 3, 4, 5];
  return (
    <View className="gap-2">
      <View className="flex-row h-2.5 gap-0.5">
        {LEVELS.map((l) => (
          <Pressable
            key={l}
            onPress={() => onChange(l)}
            className={`flex-1 rounded-sm ${
              l <= value ? "bg-amber-500" : "bg-border"
            } ${l === 1 ? "rounded-l-sm" : ""} ${l === 5 ? "rounded-r-sm" : ""}`}
          />
        ))}
      </View>
      <View className="flex-row justify-between items-center">
        <Text className="text-xs text-muted-foreground">Low</Text>
        <Text className="text-sm font-medium text-amber-500">{value}/5</Text>
        <Text className="text-xs text-muted-foreground">High</Text>
      </View>
    </View>
  );
}

function FlagChips({ selected, onToggle }: { selected: string[]; onToggle: (f: string) => void }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {FLAG_OPTIONS.map((flag) => {
        const active = selected.includes(flag);
        return (
          <Pressable
            key={flag}
            onPress={() => onToggle(flag)}
            className={`px-3 py-2 rounded-full border ${
              active ? "bg-amber-500/10 border-amber-500/20" : "bg-surface border-border"
            }`}
          >
            <Text className={`text-sm font-medium ${active ? "text-amber-500" : "text-muted-foreground"}`}>
              {flag}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const RECENT = [
  { day: "Mon", mood: 4, energy: 3 },
  { day: "Tue", mood: 2, energy: 2 },
  { day: "Wed", mood: 3, energy: 4 },
  { day: "Thu", mood: 4, energy: 4 },
  { day: "Fri", mood: 5, energy: 4 },
  { day: "Sat", mood: 3, energy: 3 },
  { day: "Sun", mood: null, energy: null },
];

const MOOD_EMOJI_SM = ["", "😞", "😕", "😐", "🙂", "😊"];

function RecentStrip() {
  return (
    <View className="flex-row justify-between bg-surface rounded-xl border border-border p-4">
      {RECENT.map((r, i) => (
        <View key={i} className="items-center gap-1">
          <Text className="text-sm">{r.mood ? MOOD_EMOJI_SM[r.mood] : "—"}</Text>
          <View
            className={`w-1 rounded-sm ${r.energy ? "bg-amber-500" : "bg-border"}`}
            style={{ height: r.energy ? r.energy * 5 + 4 : 4 }}
          />
          <Text className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">{r.day}</Text>
        </View>
      ))}
    </View>
  );
}

export default function CheckinScreen() {
  const [mode, setMode] = useState<"daily" | "weekly">("daily");
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number>(3);
  const [flags, setFlags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [weeklyAnswers, setWeeklyAnswers] = useState<string[]>(["", "", ""]);
  const [submitted, setSubmitted] = useState(false);

  const successAnim = useRef(new Animated.Value(0)).current;

  const toggleFlag = (f: string) => {
    setFlags((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };

  const submit = () => {
    setSubmitted(true);
    Animated.spring(successAnim, { toValue: 1, useNativeDriver: true, damping: 15 }).start();
  };

  const canSubmit = mood !== null;

  if (submitted) {
    return (
      <View className="flex-1 bg-background items-center justify-center gap-4">
        <Animated.View
          className="items-center gap-4"
          style={{
            opacity: successAnim,
            transform: [
              { scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
            ],
          }}
        >
          <Text className="text-5xl">{MOOD_EMOJI_SM[mood ?? 3]}</Text>
          <Text className="text-2xl font-serif text-foreground">Checked in.</Text>
          <Text className="text-base text-muted-foreground">
            {flags.length > 0 ? `Feeling ${flags.slice(0, 2).join(" and ")}.` : "See you tomorrow."}
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-6 pb-24 gap-6"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View className="mb-8">
        <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Check-in</Text>
        <Text className="text-3xl font-serif text-foreground tracking-tight">How are{"\n"}you doing?</Text>
      </View>

      <View className="flex-row bg-surface rounded-lg border border-border p-0.5 mb-8">
        {(["daily", "weekly"] as const).map((m) => (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            className={`flex-1 items-center py-2 rounded-md ${mode === m ? "bg-muted" : ""}`}
          >
            <Text className={`text-sm font-medium ${mode === m ? "text-foreground" : "text-muted-foreground"}`}>
              {m === "daily" ? "Daily" : "Weekly"}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="gap-3">
        <Text className="text-base font-medium text-muted-foreground mb-3">Recent</Text>
        <RecentStrip />
      </View>

      <View className="gap-3">
        <Text className="text-base font-medium text-muted-foreground mb-3">How&apos;s your mood?</Text>
        <MoodPicker value={mood} onChange={setMood} />
      </View>

      <View className="gap-3">
        <Text className="text-base font-medium text-muted-foreground mb-3">Energy level</Text>
        <EnergySlider value={energy} onChange={setEnergy} />
      </View>

      <View className="gap-3">
        <Text className="text-base font-medium text-muted-foreground mb-3">Anything showing up?</Text>
        <FlagChips selected={flags} onToggle={toggleFlag} />
      </View>

      {mode === "weekly" && (
        <View className="gap-3">
          <Text className="text-base font-medium text-muted-foreground mb-3">Reflect</Text>
          {WEEKLY_PROMPTS.map((prompt, i) => (
            <View key={i} className="mb-4">
              <Text className="text-sm text-muted-foreground mb-2 italic">{prompt}</Text>
              <TextInput
                className="bg-surface border border-border rounded-lg p-4 text-base text-foreground min-h-[80]"
                placeholder="Take your time…"
                placeholderTextColor="#6b7280"
                value={weeklyAnswers[i]}
                onChangeText={(text) => {
                  const next = [...weeklyAnswers];
                  next[i] = text;
                  setWeeklyAnswers(next);
                }}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          ))}
        </View>
      )}

      <View className="gap-2">
        <Text className="text-base font-medium text-muted-foreground">
          Private note <Text className="text-xs text-muted-foreground font-light">(optional)</Text>
        </Text>
        <TextInput
          className="bg-surface border border-border rounded-xl p-4 text-base text-foreground min-h-[100]"
          placeholder="Anything else on your mind…"
          placeholderTextColor="#6b7280"
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <Button
        label="Submit check-in"
        variant="primary"
        onPress={submit}
        disabled={!canSubmit}
        style={{ marginBottom: 48 }}
      />
    </ScrollView>
  );
}
