/**
 * Life OS — Patterns Screen
 * Route: app/(tabs)/patterns/index.tsx
 *
 * Shows AI-detected behavioral correlations.
 * Rules:
 *   - Max 3 visible at any time
 *   - Dismiss is silent, no confirmation
 *   - Pin preserves past 30-day TTL
 *   - Positive/neutral framing only — tonePolicy enforced at backend
 */

import React, { useState, useRef } from "react";
import { View, Text, ScrollView, Pressable, Animated } from "react-native";
import { EmptyState } from "../../../components/ui";

type PatternType = "mood_habit" | "energy_sleep" | "spending_mood" | "habit_time" | "review";

interface Pattern {
  id: string;
  type: PatternType;
  headline: string;
  detail: string;
  confidence: "low" | "medium" | "high";
  dataPoints: number;
  pinned: boolean;
  detectedDaysAgo: number;
}

const MOCK_PATTERNS: Pattern[] = [
  {
    id: "1",
    type: "mood_habit",
    headline: "Mood lifts on walk days",
    detail:
      "Your mood scores are 0.8 points higher on days you log a morning walk. This shows up across the last 3 weeks.",
    confidence: "high",
    dataPoints: 21,
    pinned: true,
    detectedDaysAgo: 5,
  },
  {
    id: "2",
    type: "spending_mood",
    headline: "Eating out tracks with low energy",
    detail:
      "Food spend tends to increase on days when your energy is 2 or below. Worth noticing, not a problem.",
    confidence: "medium",
    dataPoints: 14,
    pinned: false,
    detectedDaysAgo: 2,
  },
  {
    id: "3",
    type: "review",
    headline: "Sunday check-ins shape the week",
    detail:
      "Weeks where you log a check-in on Sunday tend to have more habit completions Monday through Wednesday.",
    confidence: "medium",
    dataPoints: 8,
    pinned: false,
    detectedDaysAgo: 1,
  },
];

const TYPE_ICON: Record<PatternType, string> = {
  mood_habit: "○",
  energy_sleep: "◇",
  spending_mood: "◈",
  habit_time: "□",
  review: "◎",
};

const CONFIDENCE_COLOR: Record<Pattern["confidence"], string> = {
  low: "#6b7280",
  medium: "#f59e0b",
  high: "#10b981",
};

interface PatternCardProps {
  pattern: Pattern;
  onDismiss: () => void;
  onPin: () => void;
}

function PatternCard({ pattern, onDismiss, onPin }: PatternCardProps) {
  const [expanded, setExpanded] = useState(false);
  const slideAnim = useRef(new Animated.Value(1)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;
  const entryAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(entryAnim, {
      toValue: 1,
      damping: 20,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const toggleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    Animated.timing(heightAnim, {
      toValue: next ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  };

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(onDismiss);
  };

  const detailHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 80],
  });

  return (
    <Animated.View
      className={`bg-surface rounded-xl border overflow-hidden mb-4 ${pattern.pinned ? "border-l-2 border-amber-500" : "border-border"}`}
      style={{
        opacity: slideAnim,
        transform: [
          { scale: entryAnim },
          { translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
        ],
      }}
    >
      <Pressable onPress={toggleExpand} className="flex-row items-start gap-3 p-4">
        <View className="w-8 h-8 bg-muted rounded-sm border border-border items-center justify-center mt-0.5">
          <Text className="text-xs text-muted-foreground font-mono">{TYPE_ICON[pattern.type]}</Text>
        </View>

        <View className="flex-1">
          <Text className="text-base font-medium text-foreground mb-1 leading-5">{pattern.headline}</Text>
          <View className="flex-row items-center gap-2">
            <View
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: CONFIDENCE_COLOR[pattern.confidence] }}
            />
            <Text className="text-xs text-muted-foreground">{pattern.confidence} confidence</Text>
            <Text className="text-xs text-muted-foreground">·</Text>
            <Text className="text-xs text-muted-foreground">{pattern.dataPoints} days of data</Text>
          </View>
        </View>

        <View className="flex-row items-start gap-1 mt-0.5">
          <Pressable onPress={onPin} className="p-1">
            <Text className={`text-base ${pattern.pinned ? "text-amber-500" : "text-muted-foreground"}`}>
              {pattern.pinned ? "◆" : "◇"}
            </Text>
          </Pressable>
          <Pressable onPress={dismiss} className="p-1">
            <Text className="text-xl text-muted-foreground leading-5">×</Text>
          </Pressable>
        </View>
      </Pressable>

      <Animated.View className="overflow-hidden border-t border-border" style={{ height: detailHeight }}>
        <View className="p-4 gap-2">
          <Text className="text-sm text-muted-foreground italic leading-5">{pattern.detail}</Text>
          <Text className="text-xs text-muted-foreground">Noticed {pattern.detectedDaysAgo}d ago</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function AwarenessNote() {
  return (
    <View className="bg-amber-500/10 rounded-lg border border-amber-500/20 p-4 mb-8">
      <Text className="text-sm text-muted-foreground italic leading-5">
        Patterns are observations, not instructions. The AI surfaces what it notices — what you do
        with it is entirely yours.
      </Text>
    </View>
  );
}

export default function PatternsScreen() {
  const [patterns, setPatterns] = useState(MOCK_PATTERNS);

  const dismiss = (id: string) => {
    setPatterns((prev) => prev.filter((p) => p.id !== id));
  };

  const pin = (id: string) => {
    setPatterns((prev) => prev.map((p) => (p.id === id ? { ...p, pinned: !p.pinned } : p)));
  };

  const pinned = patterns.filter((p) => p.pinned);
  const unpinned = patterns.filter((p) => !p.pinned);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-6 pb-24 gap-6"
      showsVerticalScrollIndicator={false}
    >
      <View className="mb-8">
        <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Patterns</Text>
        <Text className="text-3xl font-serif text-foreground tracking-tight mb-2">What the AI{"\n"}has noticed.</Text>
        <Text className="text-base text-muted-foreground">
          Up to 3 at a time. Tap to expand, pin to keep, dismiss to clear.
        </Text>
      </View>

      <AwarenessNote />

      {patterns.length === 0 ? (
        <View className="py-12 items-center justify-center">
          <Text className="text-2xl mb-2">◎</Text>
          <Text className="text-lg font-medium text-foreground">Nothing yet</Text>
          <Text className="text-sm text-muted-foreground text-center mt-1">
            Patterns emerge after a week or two of check-ins and habit logging
          </Text>
        </View>
      ) : (
        <>
          {pinned.length > 0 && (
            <View className="gap-3">
              <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Pinned</Text>
              {pinned.map((p) => (
                <PatternCard
                  key={p.id}
                  pattern={p}
                  onDismiss={() => dismiss(p.id)}
                  onPin={() => pin(p.id)}
                />
              ))}
            </View>
          )}
          {unpinned.length > 0 && (
            <View className="gap-3">
              {pinned.length > 0 && (
                <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Recent</Text>
              )}
              {unpinned.map((p) => (
                <PatternCard
                  key={p.id}
                  pattern={p}
                  onDismiss={() => dismiss(p.id)}
                  onPin={() => pin(p.id)}
                />
              ))}
            </View>
          )}
        </>
      )}

      <View className="items-center pt-8">
        <Text className="text-xs text-muted-foreground">{patterns.length}/3 patterns active</Text>
      </View>

      <View className="h-10" />
    </ScrollView>
  );
}
