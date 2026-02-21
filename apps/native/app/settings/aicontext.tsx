/**
 * Life OS — AI Context Viewer
 * Route: app/settings/aicontext.tsx
 *
 * Read-only view of the AI's working model.
 * Shows workingModel fields + last 10 memory entries.
 * One action: Clear AI memory.
 */

import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Colors, Typography, Spacing, Radius } from "../../constants/theme";
import { SectionLabel, Button } from "../../components/ui";

// ─────────────────────────────────────────────
// MOCK AI CONTEXT
// ─────────────────────────────────────────────

const MOCK_WORKING_MODEL = {
  energyPatterns:
    "Energy tends to peak mid-morning. Lowest on Sunday evenings and after high-spend days.",
  habitResonance:
    "Morning walk and journaling complete most consistently. Meditation often skipped in evening.",
  flagPatterns:
    "not_now flags cluster around early morning and post-lunch. not_aligned mostly on finance tasks.",
  triggerSignals: "Low mood often follows low-sleep days and high eating-out spend weeks.",
  suggestionResponse:
    "Responds well to one specific suggestion. Dismisses vague or multi-part suggestions.",
  reviewEngagement: "Weekly reviews completed 3 of last 4 weeks. Look-back section skipped once.",
  financeRelationship:
    "Spending awareness improves mood correlation. High credit spend weeks correlate with lower energy.",
};

const MOCK_MEMORY = [
  {
    occurredAt: Date.now() - 1000 * 60 * 30,
    source: "captureAgent",
    module: "capture",
    observation: "Capture signal: mood ~2. Morning context.",
    confidence: "low",
  },
  {
    occurredAt: Date.now() - 1000 * 60 * 60 * 3,
    source: "plannerAgent",
    module: "hardMode",
    observation: "Hard Mode plan: 4 items scheduled",
    confidence: "high",
  },
  {
    occurredAt: Date.now() - 1000 * 60 * 60 * 5,
    source: "dayClose",
    module: "hardMode",
    observation: "not_now flags: 2 afternoon items",
    confidence: "medium",
  },
  {
    occurredAt: Date.now() - 1000 * 60 * 60 * 26,
    source: "summaryAgent",
    module: "weeklyReview",
    observation: "Weekly summary generated",
    confidence: "high",
  },
  {
    occurredAt: Date.now() - 1000 * 60 * 60 * 30,
    source: "patternAgent",
    module: "patterns",
    observation: "Pattern explained: walk-mood correlation",
    confidence: "medium",
  },
  {
    occurredAt: Date.now() - 1000 * 60 * 60 * 50,
    source: "dayClose",
    module: "hardMode",
    observation: "Accuracy 0.75 — plan volume appropriate",
    confidence: "high",
  },
  {
    occurredAt: Date.now() - 1000 * 60 * 60 * 72,
    source: "captureAgent",
    module: "capture",
    observation: "Capture signal: mood ~4. Positive signal.",
    confidence: "low",
  },
];

const MOCK_CALIBRATION = {
  preferredSuggestionVolume: "moderate",
  hardModePlanAccuracy: 0.74,
  patternDismissRate: 0.2,
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const CONFIDENCE_COLOR: Record<string, string> = {
  low: Colors.textMuted,
  medium: Colors.amber,
  high: Colors.sage,
};

// ─────────────────────────────────────────────
// WORKING MODEL FIELD
// ─────────────────────────────────────────────

const FIELD_LABELS: Record<keyof typeof MOCK_WORKING_MODEL, string> = {
  energyPatterns: "Energy patterns",
  habitResonance: "Habit resonance",
  flagPatterns: "Flag patterns",
  triggerSignals: "Trigger signals",
  suggestionResponse: "Suggestion response",
  reviewEngagement: "Review engagement",
  financeRelationship: "Finance relationship",
};

function ModelField({ field, value }: { field: string; value: string }) {
  const isEmpty = !value || value.trim() === "";
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{field}</Text>
      <Text style={[fieldStyles.value, isEmpty && fieldStyles.valueEmpty]}>
        {isEmpty ? "Not enough data yet." : value}
      </Text>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
  },
  label: { ...Typography.eyebrow, color: Colors.textMuted, marginBottom: Spacing.xs },
  value: {
    ...Typography.bodyMD,
    color: Colors.textSecondary,
    lineHeight: 22,
    fontFamily: "DMSans_300Light",
  },
  valueEmpty: { color: Colors.textMuted, fontStyle: "italic" },
});

// ─────────────────────────────────────────────
// MEMORY ENTRY
// ─────────────────────────────────────────────

function MemoryEntry({ entry }: { entry: (typeof MOCK_MEMORY)[0] }) {
  return (
    <View style={memStyles.row}>
      <View style={[memStyles.dot, { backgroundColor: CONFIDENCE_COLOR[entry.confidence] }]} />
      <View style={memStyles.content}>
        <Text style={memStyles.observation}>{entry.observation}</Text>
        <View style={memStyles.meta}>
          <Text style={memStyles.source}>{entry.source}</Text>
          <Text style={memStyles.sep}>·</Text>
          <Text style={memStyles.module}>{entry.module}</Text>
          <Text style={memStyles.sep}>·</Text>
          <Text style={memStyles.time}>{timeAgo(entry.occurredAt)}</Text>
        </View>
      </View>
    </View>
  );
}

const memStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  content: { flex: 1, gap: 4 },
  observation: { ...Typography.bodySM, color: Colors.textSecondary, lineHeight: 18 },
  meta: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  source: { ...Typography.bodyXS, color: Colors.textMuted },
  sep: { ...Typography.bodyXS, color: Colors.textMuted },
  module: { ...Typography.bodyXS, color: Colors.textMuted },
  time: { ...Typography.bodyXS, color: Colors.textMuted },
});

// ─────────────────────────────────────────────
// AI CONTEXT SCREEN
// ─────────────────────────────────────────────

export default function AiContextScreen() {
  const [cleared, setCleared] = useState(false);

  const handleClear = () => {
    Alert.alert(
      "Clear AI memory",
      "This resets the working model and all memory entries. The AI starts fresh. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => setCleared(true),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.title}>What the AI knows</Text>
          <Text style={styles.subtitle}>Read-only. Updated automatically.</Text>
        </View>
      </View>

      {cleared ? (
        <View style={styles.clearedState}>
          <Text style={styles.clearedEmoji}>○</Text>
          <Text style={styles.clearedTitle}>Memory cleared.</Text>
          <Text style={styles.clearedSub}>
            The AI will rebuild its understanding over the next week of use.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Calibration strip */}
          <View style={styles.calibrationRow}>
            <View style={styles.calibrationItem}>
              <Text style={styles.calibrationLabel}>Plan accuracy</Text>
              <Text style={styles.calibrationValue}>
                {Math.round(MOCK_CALIBRATION.hardModePlanAccuracy * 100)}%
              </Text>
            </View>
            <View style={styles.calibrationDivider} />
            <View style={styles.calibrationItem}>
              <Text style={styles.calibrationLabel}>Dismiss rate</Text>
              <Text style={styles.calibrationValue}>
                {Math.round(MOCK_CALIBRATION.patternDismissRate * 100)}%
              </Text>
            </View>
            <View style={styles.calibrationDivider} />
            <View style={styles.calibrationItem}>
              <Text style={styles.calibrationLabel}>Suggestions</Text>
              <Text style={styles.calibrationValue}>
                {MOCK_CALIBRATION.preferredSuggestionVolume}
              </Text>
            </View>
          </View>

          {/* Working model */}
          <SectionLabel>Working model</SectionLabel>
          <View style={styles.modelCard}>
            {(Object.keys(FIELD_LABELS) as Array<keyof typeof MOCK_WORKING_MODEL>).map(
              (key, i, arr) => (
                <View key={key} style={i === arr.length - 1 ? { borderBottomWidth: 0 } : {}}>
                  <ModelField field={FIELD_LABELS[key]} value={MOCK_WORKING_MODEL[key]} />
                </View>
              ),
            )}
          </View>

          {/* Memory entries */}
          <SectionLabel>Recent memory</SectionLabel>
          <View style={styles.memoryCard}>
            {MOCK_MEMORY.map((entry, i) => (
              <MemoryEntry key={i} entry={entry} />
            ))}
          </View>

          {/* Clear button */}
          <View style={styles.clearSection}>
            <Text style={styles.clearNote}>
              Clearing memory resets everything above. The AI will start from scratch and rebuild
              understanding from your event log.
            </Text>
            <Button
              label="Clear AI memory"
              variant="ghost"
              onPress={handleClear}
              style={styles.clearBtn}
            />
          </View>

          <View style={{ height: 48 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
    gap: Spacing.md,
  },
  backBtn: { padding: Spacing.xs, paddingTop: 3 },
  backText: { fontSize: 24, color: Colors.textSecondary, lineHeight: 28 },
  headerContent: { flex: 1 },
  title: { ...Typography.displaySM, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySM, color: Colors.textMuted, marginTop: 2 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxl },

  // Calibration
  calibrationRow: {
    flexDirection: "row",
    backgroundColor: Colors.bgRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  calibrationItem: { flex: 1, alignItems: "center", gap: 4 },
  calibrationLabel: { ...Typography.eyebrow, color: Colors.textMuted },
  calibrationValue: { ...Typography.labelLG, color: Colors.textPrimary },
  calibrationDivider: { width: 1, backgroundColor: Colors.borderSoft },

  // Cards
  modelCard: {
    backgroundColor: Colors.bgRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    overflow: "hidden",
    marginBottom: Spacing.xxl,
  },
  memoryCard: {
    backgroundColor: Colors.bgRaised,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    overflow: "hidden",
    marginBottom: Spacing.xxl,
  },

  // Clear
  clearSection: { gap: Spacing.lg, marginBottom: Spacing.xl },
  clearNote: {
    ...Typography.bodySM,
    color: Colors.textMuted,
    textAlign: "center",
    fontFamily: "DMSans_300Light",
    fontStyle: "italic",
    lineHeight: 20,
    paddingHorizontal: Spacing.lg,
  },
  clearBtn: { borderColor: Colors.roseDim },

  // Cleared state
  clearedState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
  },
  clearedEmoji: { fontSize: 40, color: Colors.textMuted },
  clearedTitle: { ...Typography.displayMD, color: Colors.textPrimary },
  clearedSub: {
    ...Typography.bodyMD,
    color: Colors.textSecondary,
    textAlign: "center",
    fontFamily: "DMSans_300Light",
    lineHeight: 22,
  },
});
