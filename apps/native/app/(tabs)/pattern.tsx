/**
 * Life OS — Patterns Screen
 * Route: app/(tabs)/patterns/index.tsx
 *
 * Shows AI-detected behavioral correlations.
 * Rules (backend enforced):
 *   - Max 3 visible at any time
 *   - Dismiss is silent
 *   - Pin preserves pattern beyond TTL
 */

import React, { useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import type { Doc, Id } from "@seila/backend/convex/_generated/dataModel";
import { api } from "@seila/backend/convex/_generated/api";
import { useToast } from "heroui-native";

type PatternItem = Doc<"patterns">;

type PatternType = PatternItem["type"];

const TYPE_ICON: Record<PatternType, string> = {
  mood_habit: "○",
  energy_checkin_timing: "◇",
  spending_mood: "◈",
};

function idempotencyKey(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

function confidenceLabel(confidence: number): "low" | "medium" | "high" {
  if (confidence >= 0.8) return "high";
  if (confidence >= 0.5) return "medium";
  return "low";
}

const CONFIDENCE_COLOR: Record<ReturnType<typeof confidenceLabel>, string> = {
  low: "#6b7280",
  medium: "#f59e0b",
  high: "#10b981",
};

function daysAgo(detectedAt: number) {
  const ms = Date.now() - detectedAt;
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function PatternCard({
  pattern,
  onDismiss,
  onPin,
  isMutating,
}: {
  pattern: PatternItem;
  onDismiss: (id: Id<"patterns">) => void;
  onPin: (id: Id<"patterns">) => void;
  isMutating: boolean;
}) {
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
  }, [entryAnim]);

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
    Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => onDismiss(pattern._id));
  };

  const detailHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 96],
  });

  const confidence = confidenceLabel(pattern.confidence);
  const confidencePct = Math.round(pattern.confidence * 100);

  return (
    <Animated.View
      className={`bg-surface rounded-xl border overflow-hidden mb-4 ${pattern.pinnedAt ? "border-l-2 border-amber-500" : "border-border"}`}
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
            <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CONFIDENCE_COLOR[confidence] }} />
            <Text className="text-xs text-muted-foreground">{confidence} confidence</Text>
            <Text className="text-xs text-muted-foreground">·</Text>
            <Text className="text-xs text-muted-foreground">{confidencePct}%</Text>
          </View>
        </View>

        <View className="flex-row items-start gap-1 mt-0.5">
          <Pressable onPress={() => onPin(pattern._id)} className="p-1" disabled={isMutating}>
            <Text className={`text-base ${pattern.pinnedAt ? "text-amber-500" : "text-muted-foreground"}`}>
              {pattern.pinnedAt ? "◆" : "◇"}
            </Text>
          </Pressable>
          <Pressable onPress={dismiss} className="p-1" disabled={isMutating}>
            <Text className="text-xl text-muted-foreground leading-5">×</Text>
          </Pressable>
        </View>
      </Pressable>

      <Animated.View className="overflow-hidden border-t border-border" style={{ height: detailHeight }}>
        <View className="p-4 gap-2">
          <Text className="text-sm text-muted-foreground italic leading-5" selectable>
            {pattern.subtext}
          </Text>
          <Text className="text-xs text-muted-foreground" selectable>
            Noticed {daysAgo(pattern.detectedAt)}d ago
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function AwarenessNote() {
  return (
    <View className="bg-amber-500/10 rounded-lg border border-amber-500/20 p-4 mb-8">
      <Text className="text-sm text-muted-foreground italic leading-5" selectable>
        Patterns are observations, not instructions. The AI surfaces what it notices - what you do
        with it is entirely yours.
      </Text>
    </View>
  );
}

export default function PatternsScreen() {
  const { toast } = useToast();
  const patterns = useQuery(api.queries.activePatterns.activePatterns);
  const dismissPattern = useMutation(api.commands.patterns.dismissPattern.dismissPattern);
  const pinPattern = useMutation(api.commands.patterns.pinPattern.pinPattern);
  const [pendingDismissedIds, setPendingDismissedIds] = useState<Set<Id<"patterns">>>(new Set());
  const [pendingPinnedIds, setPendingPinnedIds] = useState<Set<Id<"patterns">>>(new Set());
  const [pendingActionIds, setPendingActionIds] = useState<Set<Id<"patterns">>>(new Set());

  React.useEffect(() => {
    if (!patterns) return;

    const serverIds = new Set(patterns.map((pattern) => pattern._id));
    setPendingDismissedIds((prev) => {
      const next = new Set<Id<"patterns">>();
      prev.forEach((id) => {
        if (serverIds.has(id)) next.add(id);
      });
      return next;
    });
    setPendingPinnedIds((prev) => {
      const next = new Set<Id<"patterns">>();
      prev.forEach((id) => {
        const serverPattern = patterns.find((pattern) => pattern._id === id);
        if (serverPattern && !serverPattern.pinnedAt) next.add(id);
      });
      return next;
    });
  }, [patterns]);

  const effectivePatterns = useMemo(() => {
    return (patterns ?? [])
      .filter((pattern) => !pendingDismissedIds.has(pattern._id))
      .map((pattern) =>
        pendingPinnedIds.has(pattern._id) && !pattern.pinnedAt
          ? { ...pattern, pinnedAt: Date.now() }
          : pattern,
      );
  }, [patterns, pendingDismissedIds, pendingPinnedIds]);

  const pinned = useMemo(() => effectivePatterns.filter((p) => !!p.pinnedAt), [effectivePatterns]);
  const unpinned = useMemo(() => effectivePatterns.filter((p) => !p.pinnedAt), [effectivePatterns]);

  const dismiss = async (patternId: Id<"patterns">) => {
    if (pendingActionIds.has(patternId)) return;
    setPendingActionIds((prev) => new Set(prev).add(patternId));
    setPendingDismissedIds((prev) => new Set(prev).add(patternId));
    try {
      await dismissPattern({
        patternId,
        idempotencyKey: idempotencyKey("pattern.dismiss"),
      });
    } catch {
      setPendingDismissedIds((prev) => {
        const next = new Set(prev);
        next.delete(patternId);
        return next;
      });
      toast.show({ variant: "danger", label: "Failed to dismiss pattern" });
    } finally {
      setPendingActionIds((prev) => {
        const next = new Set(prev);
        next.delete(patternId);
        return next;
      });
    }
  };

  const pin = async (patternId: Id<"patterns">) => {
    if (pendingActionIds.has(patternId)) return;
    if (effectivePatterns.some((pattern) => pattern._id === patternId && !!pattern.pinnedAt)) return;

    setPendingActionIds((prev) => new Set(prev).add(patternId));
    setPendingPinnedIds((prev) => new Set(prev).add(patternId));
    try {
      await pinPattern({
        patternId,
        idempotencyKey: idempotencyKey("pattern.pin"),
      });
    } catch {
      setPendingPinnedIds((prev) => {
        const next = new Set(prev);
        next.delete(patternId);
        return next;
      });
      toast.show({ variant: "danger", label: "Failed to pin pattern" });
    } finally {
      setPendingActionIds((prev) => {
        const next = new Set(prev);
        next.delete(patternId);
        return next;
      });
    }
  };

  if (patterns === undefined) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-sm text-muted-foreground">Loading patterns...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-6 pb-24 gap-6"
      contentInsetAdjustmentBehavior="automatic"
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

      {effectivePatterns.length === 0 ? (
        <View className="py-12 items-center justify-center">
          <Text className="text-2xl mb-2">◎</Text>
          <Text className="text-lg font-medium text-foreground">Nothing yet</Text>
          <Text className="text-sm text-muted-foreground text-center mt-1">
            Patterns emerge after a week or two of check-ins and habit logging
          </Text>
        </View>
      ) : (
        <>
          {pinned.length > 0 ? (
            <View className="gap-3">
              <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Pinned</Text>
              {pinned.map((pattern) => (
                <PatternCard
                  key={pattern._id}
                  pattern={pattern}
                  onDismiss={dismiss}
                  onPin={pin}
                  isMutating={pendingActionIds.has(pattern._id)}
                />
              ))}
            </View>
          ) : null}

          {unpinned.length > 0 ? (
            <View className="gap-3">
              {pinned.length > 0 ? (
                <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Recent</Text>
              ) : null}
              {unpinned.map((pattern) => (
                <PatternCard
                  key={pattern._id}
                  pattern={pattern}
                  onDismiss={dismiss}
                  onPin={pin}
                  isMutating={pendingActionIds.has(pattern._id)}
                />
              ))}
            </View>
          ) : null}
        </>
      )}

      <View className="items-center pt-8">
        <Text className="text-xs text-muted-foreground">{effectivePatterns.length}/3 patterns active</Text>
      </View>

      <View className="h-10" />
    </ScrollView>
  );
}
