/**
 * Life OS — Weekly Review Screen
 * Route: app/(tabs)/review/index.tsx
 *
 * 4 phases: Look Back → Reflect → Intentions → Close
 * AI generates the look-back summary.
 * User controls: skip any phase, skip entire review.
 */

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Animated,
  Dimensions,
} from "react-native";
import { Button } from "../../../components/ui";

const { width: SCREEN_W } = Dimensions.get("window");

const MOCK_SUMMARY = {
  bullets: [
    "5 habit completions logged across the week",
    "4 daily check-ins completed — Monday through Friday",
    "2 focus tasks completed, 1 carried forward",
    "Spending stayed within most envelope ceilings",
  ],
  brightSpot:
    "Wednesday showed your highest energy of the week — you logged both a walk and journaling.",
  worthNoticing:
    "Check-ins trailed off toward the weekend, which tracks with your Sunday energy pattern.",
};

const REFLECT_PROMPTS = [
  "What felt good this week?",
  "What felt hard or heavy?",
  "What do you want to carry into next week?",
];

function PhaseIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View className="flex-row gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          className={`h-0.75 flex-1 rounded-sm ${
            i < current ? "bg-emerald-500" : i === current ? "bg-amber-500" : "bg-border"
          }`}
        />
      ))}
    </View>
  );
}

function LookBackPhase({ onNext }: { onNext: () => void }) {
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <View className="flex-1">
      <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Look back</Text>
      <Text className="text-3xl font-serif text-foreground tracking-tight mb-2">Your week{"\n"}in brief.</Text>

      {loading ? (
        <View className="py-12 items-center">
          <Text className="text-sm text-muted-foreground italic">The AI is reading your week…</Text>
        </View>
      ) : (
        <View className="bg-surface rounded-2xl border border-border overflow-hidden mb-8">
          <View className="p-5 gap-3 border-b border-border">
            {MOCK_SUMMARY.bullets.map((b, i) => (
              <View key={i} className="flex-row items-start gap-3">
                <View className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5" />
                <Text className="text-base text-muted-foreground flex-1 leading-6">{b}</Text>
              </View>
            ))}
          </View>

          <View className="p-5 gap-2 border-b border-border bg-emerald-500/10">
            <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Bright spot</Text>
            <Text className="text-sm text-muted-foreground italic leading-5">{MOCK_SUMMARY.brightSpot}</Text>
          </View>

          <View className="p-5 gap-2 bg-amber-500/10">
            <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Worth noticing</Text>
            <Text className="text-sm text-muted-foreground italic leading-5">{MOCK_SUMMARY.worthNoticing}</Text>
          </View>
        </View>
      )}

      {!loading && <Button label="Continue to reflection →" variant="primary" onPress={onNext} />}
    </View>
  );
}

function ReflectPhase({ onNext }: { onNext: (answers: string[]) => void }) {
  const [answers, setAnswers] = useState(["", "", ""]);
  const [current, setCurrent] = useState(0);

  const updateAnswer = (i: number, text: string) => {
    setAnswers((prev) => {
      const n = [...prev];
      n[i] = text;
      return n;
    });
  };

  const next = () => {
    if (current < REFLECT_PROMPTS.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      onNext(answers);
    }
  };

  return (
    <View className="flex-1">
      <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Reflect</Text>
      <Text className="text-3xl font-serif text-foreground tracking-tight mb-6">
        {current + 1}/{REFLECT_PROMPTS.length}
      </Text>

      <View className="bg-surface rounded-2xl border border-border p-5 gap-4 mb-6 flex-1">
        <Text className="text-xl text-foreground italic leading-6">{REFLECT_PROMPTS[current]}</Text>
        <TextInput
          className="text-base text-foreground flex-1 leading-6"
          placeholder="Take your time…"
          placeholderTextColor="#6b7280"
          value={answers[current]}
          onChangeText={(text) => updateAnswer(current, text)}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          autoFocus
        />
      </View>

      <View className="flex-row gap-3 items-center">
        <Pressable onPress={next} className="py-3 px-2">
          <Text className="text-sm text-muted-foreground">Skip this one</Text>
        </Pressable>
        <Button
          label={current < REFLECT_PROMPTS.length - 1 ? "Next →" : "Continue →"}
          variant="primary"
          onPress={next}
        />
      </View>
    </View>
  );
}

function IntentionsPhase({ onNext }: { onNext: (intentions: string[]) => void }) {
  const [intentions, setIntentions] = useState(["", "", ""]);

  const update = (i: number, text: string) => {
    setIntentions((prev) => {
      const n = [...prev];
      n[i] = text;
      return n;
    });
  };

  const filled = intentions.filter((i) => i.trim()).length;

  return (
    <View className="flex-1">
      <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Intentions</Text>
      <Text className="text-3xl font-serif text-foreground tracking-tight mb-2">Next week,{"\n"}I want to…</Text>
      <Text className="text-base text-muted-foreground mb-8">1–3 loose intentions. Not commitments — directions.</Text>

      <View className="gap-3">
        {intentions.map((val, i) => (
          <View key={i} className="flex-row items-center gap-3 bg-surface rounded-lg border border-border py-3 px-4">
            <View className="w-6 h-6 rounded-full bg-muted border border-border items-center justify-center">
              <Text className="text-xs text-muted-foreground">{i + 1}</Text>
            </View>
            <TextInput
              className="flex-1 text-base text-foreground py-0"
              placeholder={
                i === 0
                  ? "Something I want to nurture…"
                  : i === 1
                    ? "Something I want to try…"
                    : "Something I want to let go of…"
              }
              placeholderTextColor="#6b7280"
              value={val}
              onChangeText={(text) => update(i, text)}
              returnKeyType="next"
            />
          </View>
        ))}
      </View>

      <Button
        label="Seal the week →"
        variant="primary"
        onPress={() => onNext(intentions.filter((i) => i.trim()))}
        disabled={filled === 0}
      />
    </View>
  );
}

function ClosePhase({ intentions }: { intentions: string[] }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, damping: 15, useNativeDriver: true }).start();
  }, []);

  const weekStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <Animated.View
      className="flex-1 items-center justify-center gap-4 px-6"
      style={{ transform: [{ scale: scaleAnim }], opacity: scaleAnim }}
    >
      <Text className="text-4xl text-amber-500">✦</Text>
      <Text className="text-2xl font-serif text-foreground">Week sealed.</Text>
      <Text className="text-base text-muted-foreground">{weekStr}</Text>

      {intentions.length > 0 && (
        <View className="w-full bg-surface rounded-2xl border border-border p-5 gap-3 mt-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Going into next week</Text>
          {intentions.map((intent, i) => (
            <Text key={i} className="text-base text-muted-foreground italic">— {intent}</Text>
          ))}
        </View>
      )}

      <Text className="text-sm text-muted-foreground text-center mt-4">
        This review is saved. You can revisit it from your history.
      </Text>
    </Animated.View>
  );
}

type Phase = 0 | 1 | 2 | 3;

export default function ReviewScreen() {
  const [phase, setPhase] = useState<Phase>(0);
  const [intentions, setIntentions] = useState<string[]>([]);
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="p-6 pb-24 gap-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-4">
          <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Weekly Review</Text>
          <Text className="text-3xl font-serif text-foreground tracking-tight mb-2">Time to close{"\n"}the week.</Text>
          <Text className="text-base text-muted-foreground mb-8">Takes about 5 minutes. You can skip any part.</Text>
        </View>

        <View className="gap-3 mb-8">
          {["Look back", "Reflect", "Intentions", "Seal it"].map((p, i) => (
            <View key={i} className="flex-row items-center gap-3">
              <View className="w-7 h-7 rounded-full bg-surface border border-border items-center justify-center">
                <Text className="text-sm text-muted-foreground font-medium">{i + 1}</Text>
              </View>
              <Text className="text-base text-muted-foreground">{p}</Text>
            </View>
          ))}
        </View>

        <View className="gap-3">
          <Button
            label="Start review"
            variant="primary"
            onPress={() => setStarted(true)}
          />
          <Pressable className="items-center py-3">
            <Text className="text-sm text-muted-foreground">Skip this week</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 bg-background p-6 pt-8">
      <PhaseIndicator current={phase} total={4} />

      {phase === 0 && <LookBackPhase onNext={() => setPhase(1)} />}
      {phase === 1 && <ReflectPhase onNext={() => setPhase(2)} />}
      {phase === 2 && (
        <IntentionsPhase
          onNext={(i) => {
            setIntentions(i);
            setPhase(3);
          }}
        />
      )}
      {phase === 3 && <ClosePhase intentions={intentions} />}
    </View>
  );
}
