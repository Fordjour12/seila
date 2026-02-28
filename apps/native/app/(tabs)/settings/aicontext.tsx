import React, { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useModeThemeColors } from "@/lib/theme";
import { SettingsCard, SettingsHeader, SettingsSectionLabel } from "./_components/SettingsUI";

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
] as const;

const MOCK_CALIBRATION = {
  preferredSuggestionVolume: "moderate",
  hardModePlanAccuracy: 0.74,
  patternDismissRate: 0.2,
};

const FIELD_LABELS: Record<keyof typeof MOCK_WORKING_MODEL, string> = {
  energyPatterns: "Energy patterns",
  habitResonance: "Habit resonance",
  flagPatterns: "Flag patterns",
  triggerSignals: "Trigger signals",
  suggestionResponse: "Suggestion response",
  reviewEngagement: "Review engagement",
  financeRelationship: "Finance relationship",
};

function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ModelField({ field, value, isLast }: { field: string; value: string; isLast: boolean }) {
  const isEmpty = !value || value.trim() === "";

  return (
    <View className={`px-5 py-4 ${!isLast ? "border-b border-border" : ""}`}>
      <Text className="mb-1 text-[11px] uppercase tracking-[0.5px] text-muted-foreground">{field}</Text>
      <Text className={`text-sm leading-6 ${isEmpty ? "italic text-muted-foreground" : "text-foreground/80"}`}>
        {isEmpty ? "Not enough data yet." : value}
      </Text>
    </View>
  );
}

function MemoryEntry({
  entry,
  dotColor,
  isLast,
}: {
  entry: (typeof MOCK_MEMORY)[number];
  dotColor: string;
  isLast: boolean;
}) {
  return (
    <View className={`flex-row gap-3 px-4 py-3 ${!isLast ? "border-b border-border" : ""}`}>
      <View className="mt-1.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
      <View className="flex-1 gap-1">
        <Text className="text-sm leading-5 text-foreground/80">{entry.observation}</Text>
        <View className="flex-row items-center gap-1">
          <Text className="text-xs text-muted-foreground">{entry.source}</Text>
          <Text className="text-xs text-muted-foreground">·</Text>
          <Text className="text-xs text-muted-foreground">{entry.module}</Text>
          <Text className="text-xs text-muted-foreground">·</Text>
          <Text className="text-xs text-muted-foreground">{timeAgo(entry.occurredAt)}</Text>
        </View>
      </View>
    </View>
  );
}

export default function AiContextScreen() {
  const [cleared, setCleared] = useState(false);
  const colors = useModeThemeColors();

  const confidenceColor: Record<string, string> = {
    low: colors.mutedForeground,
    medium: colors.warning,
    high: colors.success,
  };

  const handleClear = () => {
    Alert.alert(
      "Clear AI memory",
      "This resets the working model and all memory entries. The AI starts fresh. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: () => setCleared(true) },
      ],
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <SettingsHeader
        title="What the AI knows"
        subtitle="Read-only. Updated automatically."
      />

      {cleared ? (
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Text className="text-4xl text-muted-foreground">○</Text>
          <Text className="text-2xl font-bold text-foreground">Memory cleared.</Text>
          <Text className="text-center text-base leading-6 text-foreground/80">
            The AI will rebuild its understanding over the next week of use.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-6 flex-row rounded-2xl border border-border bg-surface p-5">
            <View className="flex-1 items-center">
              <Text className="text-[11px] uppercase tracking-[0.5px] text-muted-foreground">Plan accuracy</Text>
              <Text className="text-base font-semibold text-foreground">
                {Math.round(MOCK_CALIBRATION.hardModePlanAccuracy * 100)}%
              </Text>
            </View>
            <View className="w-px bg-border" />
            <View className="flex-1 items-center">
              <Text className="text-[11px] uppercase tracking-[0.5px] text-muted-foreground">Dismiss rate</Text>
              <Text className="text-base font-semibold text-foreground">
                {Math.round(MOCK_CALIBRATION.patternDismissRate * 100)}%
              </Text>
            </View>
            <View className="w-px bg-border" />
            <View className="flex-1 items-center">
              <Text className="text-[11px] uppercase tracking-[0.5px] text-muted-foreground">Suggestions</Text>
              <Text className="text-base font-semibold capitalize text-foreground">
                {MOCK_CALIBRATION.preferredSuggestionVolume}
              </Text>
            </View>
          </View>

          <SettingsSectionLabel>Working model</SettingsSectionLabel>
          <SettingsCard>
            {(Object.keys(FIELD_LABELS) as Array<keyof typeof MOCK_WORKING_MODEL>).map((key, index, arr) => (
              <ModelField
                key={key}
                field={FIELD_LABELS[key]}
                value={MOCK_WORKING_MODEL[key]}
                isLast={index === arr.length - 1}
              />
            ))}
          </SettingsCard>

          <SettingsSectionLabel>Recent memory</SettingsSectionLabel>
          <SettingsCard>
            {MOCK_MEMORY.map((entry, index) => (
              <MemoryEntry
                key={`${entry.source}-${entry.occurredAt}`}
                entry={entry}
                dotColor={confidenceColor[entry.confidence] ?? colors.mutedForeground}
                isLast={index === MOCK_MEMORY.length - 1}
              />
            ))}
          </SettingsCard>

          <View className="mb-5 gap-4">
            <Text className="px-4 text-center text-sm italic leading-5 text-muted-foreground">
              Clearing memory resets everything above. The AI will start from scratch and rebuild
              understanding from your event log.
            </Text>
            <Pressable
              onPress={handleClear}
              className="min-h-11 items-center justify-center rounded-xl border border-danger/30 px-4 py-3"
            >
              <Text className="text-sm font-medium text-danger">Clear AI memory</Text>
            </Pressable>
          </View>

          <View className="h-12" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
