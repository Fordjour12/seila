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
import { View, Text, ScrollView, StyleSheet, Pressable, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radius } from "../../../constants/theme";
import { EmptyState } from "../../../components/ui";

// ─────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────

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
  low: Colors.textMuted,
  medium: Colors.amber,
  high: Colors.sage,
};

// ─────────────────────────────────────────────
// PATTERN CARD
// ─────────────────────────────────────────────

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
      style={[
        cardStyles.wrap,
        pattern.pinned && cardStyles.wrapPinned,
        {
          opacity: slideAnim,
          transform: [
            { scale: entryAnim },
            { translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
          ],
        },
      ]}
    >
      <Pressable onPress={toggleExpand} style={cardStyles.main}>
        {/* Type icon */}
        <View style={cardStyles.typeIcon}>
          <Text style={cardStyles.typeIconText}>{TYPE_ICON[pattern.type]}</Text>
        </View>

        {/* Content */}
        <View style={cardStyles.content}>
          <Text style={cardStyles.headline}>{pattern.headline}</Text>
          <View style={cardStyles.meta}>
            <View
              style={[
                cardStyles.confidenceDot,
                { backgroundColor: CONFIDENCE_COLOR[pattern.confidence] },
              ]}
            />
            <Text style={cardStyles.metaText}>{pattern.confidence} confidence</Text>
            <Text style={cardStyles.metaDivider}>·</Text>
            <Text style={cardStyles.metaText}>{pattern.dataPoints} days of data</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={cardStyles.actions}>
          <Pressable onPress={onPin} style={cardStyles.actionBtn}>
            <Text style={[cardStyles.actionIcon, pattern.pinned && cardStyles.actionIconPinned]}>
              {pattern.pinned ? "◆" : "◇"}
            </Text>
          </Pressable>
          <Pressable onPress={dismiss} style={cardStyles.actionBtn}>
            <Text style={cardStyles.dismissIcon}>×</Text>
          </Pressable>
        </View>
      </Pressable>

      {/* Expanded detail */}
      <Animated.View style={[cardStyles.detail, { height: detailHeight }]}>
        <View style={cardStyles.detailInner}>
          <Text style={cardStyles.detailText}>{pattern.detail}</Text>
          <Text style={cardStyles.detectedAgo}>Noticed {pattern.detectedDaysAgo}d ago</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.bgRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  wrapPinned: {
    borderColor: Colors.amberBorder,
    borderLeftWidth: 2,
    borderLeftColor: Colors.amber,
  },
  main: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  typeIcon: {
    width: 32,
    height: 32,
    backgroundColor: Colors.bgFloat,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  typeIconText: { fontSize: 12, color: Colors.textMuted, fontFamily: "monospace" },
  content: { flex: 1 },
  headline: {
    ...Typography.labelLG,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
  meta: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  confidenceDot: { width: 5, height: 5, borderRadius: 3 },
  metaText: { ...Typography.bodyXS, color: Colors.textMuted },
  metaDivider: { ...Typography.bodyXS, color: Colors.textMuted },
  actions: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.xs, marginTop: 2 },
  actionBtn: { padding: Spacing.xs },
  actionIcon: { fontSize: 13, color: Colors.textMuted },
  actionIconPinned: { color: Colors.amber },
  dismissIcon: { fontSize: 18, color: Colors.textMuted, lineHeight: 20 },
  detail: { overflow: "hidden", borderTopWidth: 1, borderTopColor: Colors.borderSoft },
  detailInner: { padding: Spacing.lg, gap: Spacing.sm },
  detailText: {
    ...Typography.bodySM,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontFamily: "DMSans_300Light",
    fontStyle: "italic",
  },
  detectedAgo: { ...Typography.bodyXS, color: Colors.textMuted },
});

// ─────────────────────────────────────────────
// AWARENESS NOTE
// ─────────────────────────────────────────────

function AwarenessNote() {
  return (
    <View style={noteStyles.wrap}>
      <Text style={noteStyles.text}>
        Patterns are observations, not instructions. The AI surfaces what it notices — what you do
        with it is entirely yours.
      </Text>
    </View>
  );
}

const noteStyles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.amberGlow,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  text: {
    ...Typography.bodySM,
    color: Colors.textSecondary,
    fontFamily: "DMSans_300Light",
    fontStyle: "italic",
    lineHeight: 20,
  },
});

// ─────────────────────────────────────────────
// PATTERNS SCREEN
// ─────────────────────────────────────────────

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
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Patterns</Text>
          <Text style={styles.title}>What the AI{"\n"}has noticed.</Text>
          <Text style={styles.subtitle}>
            Up to 3 at a time. Tap to expand, pin to keep, dismiss to clear.
          </Text>
        </View>

        <AwarenessNote />

        {patterns.length === 0 ? (
          <EmptyState
            icon="◎"
            title="Nothing yet"
            subtitle="Patterns emerge after a week or two of check-ins and habit logging"
          />
        ) : (
          <>
            {pinned.length > 0 && (
              <View style={styles.group}>
                <Text style={styles.groupLabel}>Pinned</Text>
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
              <View style={styles.group}>
                {pinned.length > 0 && <Text style={styles.groupLabel}>Recent</Text>}
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

        {/* Sparsity note */}
        <View style={styles.sparsityRow}>
          <Text style={styles.sparsityText}>{patterns.length}/3 patterns active</Text>
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
  eyebrow: { ...Typography.eyebrow, color: Colors.textMuted, marginBottom: Spacing.sm },
  title: { ...Typography.displayXL, color: Colors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { ...Typography.bodyMD, color: Colors.textSecondary, fontFamily: "DMSans_300Light" },
  group: { marginBottom: Spacing.xl },
  groupLabel: { ...Typography.eyebrow, color: Colors.textMuted, marginBottom: Spacing.md },
  sparsityRow: { alignItems: "center", paddingTop: Spacing.xl },
  sparsityText: { ...Typography.bodyXS, color: Colors.textMuted },
});
