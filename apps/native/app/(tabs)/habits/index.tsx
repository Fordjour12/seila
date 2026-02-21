/**
 * Life OS — Habits Screen
 * Route: app/(tabs)/habits/index.tsx
 *
 * Sections:
 *   - Today's habits (anchor-grouped)
 *   - Habit history strip
 *   - Add habit sheet
 *
 * Design rules enforced here:
 *   - No streaks visible anywhere
 *   - Skip is a positive, intentional action
 *   - Missed habits leave no gap or negative state
 */

import React, { useState, useRef } from "react";
import { View, Text, ScrollView, Pressable, Animated, TextInput } from "react-native";
import { SectionLabel, Button, Badge } from "../../../components/ui";

type Anchor = "morning" | "afternoon" | "evening" | "anytime";
type Difficulty = "low" | "medium" | "high";
type HabitStatus = "pending" | "done" | "skipped";

interface Habit {
  id: string;
  name: string;
  cadence: string;
  anchor: Anchor;
  difficulty: Difficulty;
  status: HabitStatus;
}

const MOCK_HABITS: Habit[] = [
  {
    id: "1",
    name: "Morning walk",
    cadence: "daily",
    anchor: "morning",
    difficulty: "low",
    status: "done",
  },
  {
    id: "2",
    name: "Journaling",
    cadence: "daily",
    anchor: "morning",
    difficulty: "medium",
    status: "pending",
  },
  {
    id: "3",
    name: "Afternoon stretch",
    cadence: "weekdays",
    anchor: "afternoon",
    difficulty: "low",
    status: "pending",
  },
  {
    id: "4",
    name: "Read 20 pages",
    cadence: "daily",
    anchor: "evening",
    difficulty: "low",
    status: "pending",
  },
  {
    id: "5",
    name: "Meditation",
    cadence: "daily",
    anchor: "evening",
    difficulty: "medium",
    status: "pending",
  },
];

const ANCHOR_LABEL: Record<Anchor, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  anytime: "Anytime",
};

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#f43f5e",
};

interface HabitCardProps {
  habit: Habit;
  onLog: (id: string) => void;
  onSkip: (id: string) => void;
}

function HabitCard({ habit, onLog, onSkip }: HabitCardProps) {
  const [showActions, setShowActions] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;

  const toggleActions = () => {
    const next = !showActions;
    setShowActions(next);
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: next ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(expandAnim, {
        toValue: next ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  const actionsHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 52],
  });

  const isDone = habit.status === "done";
  const isSkipped = habit.status === "skipped";
  const isResolved = isDone || isSkipped;

  return (
    <View className={`bg-surface rounded-lg border border-border overflow-hidden mb-2 ${isResolved ? "opacity-65" : ""}`}>
      <Pressable onPress={isResolved ? undefined : toggleActions} className="flex-row items-center gap-3 p-4">
        <View
          className={`w-6 h-6 rounded-sm border-1.5 border-border items-center justify-center ${
            isDone ? "bg-emerald-500 border-emerald-500" : isSkipped ? "bg-muted border-border" : ""
          }`}
        >
          {isDone && <Text className="text-xs text-background font-bold">✓</Text>}
          {isSkipped && <Text className="text-xs text-foreground">·</Text>}
        </View>

        <View className="flex-1">
          <Text className={`text-base mb-0.5 ${isResolved ? "text-muted-foreground" : "text-foreground"}`}>
            {habit.name}
          </Text>
          <View className="flex-row items-center gap-2">
            <View
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: DIFFICULTY_COLOR[habit.difficulty] }}
            />
            <Text className="text-xs text-muted-foreground">{habit.cadence}</Text>
            {isSkipped && (
              <Text className="text-[9px] text-emerald-500 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                intentional rest
              </Text>
            )}
          </View>
        </View>

        {!isResolved && (
          <Animated.Text className="text-muted-foreground text-xl leading-6" style={{ transform: [{ rotate }] }}>
            ›
          </Animated.Text>
        )}
      </Pressable>

      {!isResolved && (
        <Animated.View className="overflow-hidden border-t border-border" style={{ height: actionsHeight }}>
          <View className="flex-row gap-2 p-3">
            <Pressable
              onPress={() => {
                onLog(habit.id);
                setShowActions(false);
              }}
              className="flex-1 items-center py-3 rounded-sm border bg-emerald-500/10 border-emerald-500/20"
            >
              <Text className="text-sm text-emerald-500 font-medium">Done</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onSkip(habit.id);
                setShowActions(false);
              }}
              className="flex-1 items-center py-3 rounded-sm border border-border"
            >
              <Text className="text-sm text-muted-foreground">Skip today</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const ANCHORS: Anchor[] = ["morning", "afternoon", "evening", "anytime"];
const DIFFICULTIES: Difficulty[] = ["low", "medium", "high"];
const CADENCES = ["daily", "weekdays", "custom"];

interface AddHabitSheetProps {
  onClose: () => void;
  onAdd: (h: Partial<Habit>) => void;
}

function AddHabitSheet({ onClose, onAdd }: AddHabitSheetProps) {
  const [name, setName] = useState("");
  const [anchor, setAnchor] = useState<Anchor>("morning");
  const [difficulty, setDifficulty] = useState<Difficulty>("low");
  const [cadence, setCadence] = useState("daily");
  const slideAnim = useRef(new Animated.Value(600)).current;

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      damping: 28,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const close = () => {
    Animated.timing(slideAnim, { toValue: 600, duration: 220, useNativeDriver: true }).start(onClose);
  };

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), anchor, difficulty, cadence, status: "pending" });
    close();
  };

  return (
    <View className="absolute inset-0 z-50 justify-end">
      <Pressable className="absolute inset-0 bg-black/70" onPress={close} />
      <Animated.View
        className="bg-surface rounded-t-3xl border border-border p-6 pb-12"
        style={{ transform: [{ translateY: slideAnim }] }}
      >
        <View className="w-9 h-0.75 bg-border rounded-sm self-center mb-8" />
        <Text className="text-xl font-serif text-foreground mb-6">New habit</Text>

        <TextInput
          className="bg-muted border border-border rounded-sm px-4 py-3 text-base text-foreground mb-6"
          placeholder="What do you want to do?"
          placeholderTextColor="#6b7280"
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-3">When</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {ANCHORS.map((a) => (
            <Pressable
              key={a}
              onPress={() => setAnchor(a)}
              className={`px-4 py-2 rounded-full border ${
                anchor === a ? "bg-amber-500/10 border-amber-500/20" : "bg-muted border-border"
              }`}
            >
              <Text className={`text-sm font-medium ${anchor === a ? "text-amber-500" : "text-muted-foreground"}`}>
                {ANCHOR_LABEL[a]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-3">How often</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {CADENCES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCadence(c)}
              className={`px-4 py-2 rounded-full border ${
                cadence === c ? "bg-amber-500/10 border-amber-500/20" : "bg-muted border-border"
              }`}
            >
              <Text className={`text-sm font-medium ${cadence === c ? "text-amber-500" : "text-muted-foreground"}`}>
                {c}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-3">Effort level</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {DIFFICULTIES.map((d) => (
            <Pressable
              key={d}
              onPress={() => setDifficulty(d)}
              className={`flex-row items-center gap-1 px-4 py-2 rounded-full border ${
                difficulty === d ? "bg-amber-500/10 border-amber-500/20" : "bg-muted border-border"
              }`}
            >
              <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: DIFFICULTY_COLOR[d] }} />
              <Text className={`text-sm font-medium ${difficulty === d ? "text-amber-500" : "text-muted-foreground"}`}>
                {d}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="flex-row gap-3 mt-3">
          <Button label="Cancel" variant="ghost" onPress={close} style={{ flex: 0, paddingHorizontal: 20 }} />
          <Button label="Add habit" variant="primary" onPress={submit} disabled={!name.trim()} style={{ flex: 1 }} />
        </View>
      </Animated.View>
    </View>
  );
}

export default function HabitsScreen() {
  const [habits, setHabits] = useState(MOCK_HABITS);
  const [showAdd, setShowAdd] = useState(false);

  const grouped = ANCHORS.reduce(
    (acc, anchor) => {
      const items = habits.filter((h) => h.anchor === anchor);
      if (items.length) acc[anchor] = items;
      return acc;
    },
    {} as Record<Anchor, Habit[]>,
  );

  const logHabit = (id: string) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, status: "done" } : h)));
  };

  const skipHabit = (id: string) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, status: "skipped" } : h)));
  };

  const addHabit = (data: Partial<Habit>) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: data.name ?? "",
      cadence: data.cadence ?? "daily",
      anchor: data.anchor ?? "morning",
      difficulty: data.difficulty ?? "low",
      status: "pending",
    };
    setHabits((prev) => [...prev, newHabit]);
  };

  const doneCount = habits.filter((h) => h.status === "done").length;
  const skippedCount = habits.filter((h) => h.status === "skipped").length;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-6 pb-24 gap-6"
      showsVerticalScrollIndicator={false}
    >
      <View className="mb-6">
        <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Habits</Text>
        <Text className="text-3xl font-serif text-foreground tracking-tight mb-4">Today&apos;s{"\n"}routines.</Text>
        <View className="flex-row gap-2">
          <View className="bg-emerald-500/10 rounded-full px-3 py-1 border border-emerald-500/20">
            <Text className="text-sm font-medium text-emerald-500">{doneCount} done</Text>
          </View>
          {skippedCount > 0 && (
            <View className="bg-surface rounded-full px-3 py-1 border border-border">
              <Text className="text-sm font-medium text-muted-foreground">{skippedCount} resting</Text>
            </View>
          )}
        </View>
      </View>

      {(Object.keys(grouped) as Anchor[]).map((anchor) => (
        <View key={anchor} className="gap-3">
          <SectionLabel>{ANCHOR_LABEL[anchor]}</SectionLabel>
          {grouped[anchor].map((h) => (
            <HabitCard key={h.id} habit={h} onLog={logHabit} onSkip={skipHabit} />
          ))}
        </View>
      ))}

      <Pressable onPress={() => setShowAdd(true)} className="items-center py-4 rounded-lg border border-border border-dashed">
        <Text className="text-base text-muted-foreground">+ Add habit</Text>
      </Pressable>

      <View className="h-10" />

      {showAdd && <AddHabitSheet onClose={() => setShowAdd(false)} onAdd={addHabit} />}
    </ScrollView>
  );
}
