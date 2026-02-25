import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";
import type { Id } from "@seila/backend/convex/_generated/dataModel";

import {
  closeReviewRef,
  currentReviewRef,
  setReviewIntentionsRef,
  skipReviewRef,
  startReviewRef,
  submitReflectionRef,
} from "../../../lib/productivity-refs";
import { Colors } from "../../../lib/theme";
import { getNextReviewWindowStart, isReviewWindowOpen } from "../../../lib/review-window";
import { Button } from "../../../components/ui";

const REFLECT_PROMPTS = [
  "What felt good this week?",
  "What felt hard or heavy?",
  "What do you want to carry into next week?",
] as const;

type Phase = 0 | 1 | 2 | 3;

type ReviewSummary = {
  bullets: string[];
  brightSpot: string;
  worthNoticing: string;
};

function toKey(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

function phaseFromServer(phase?: "lookback" | "reflect" | "intentions" | "closed"): Phase {
  if (phase === "reflect") return 1;
  if (phase === "intentions") return 2;
  if (phase === "closed") return 3;
  return 0;
}

function parseSummary(currentReview: {
  summaryGenerated?: boolean;
  summary?: string;
  brightSpot?: string;
  worthNoticing?: string;
} | null): ReviewSummary | null {
  if (
    !currentReview?.summaryGenerated ||
    typeof currentReview.summary !== "string" ||
    typeof currentReview.brightSpot !== "string" ||
    typeof currentReview.worthNoticing !== "string"
  ) {
    return null;
  }

  return {
    bullets: currentReview.summary
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 5),
    brightSpot: currentReview.brightSpot,
    worthNoticing: currentReview.worthNoticing,
  };
}

function PhaseIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View className="flex-row gap-2">
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

function LookBackPhase({
  loading,
  summary,
  onNext,
}: {
  loading: boolean;
  summary: ReviewSummary | null;
  onNext: () => void;
}) {
  return (
    <View className="gap-6">
      <View>
        <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Look back</Text>
        <Text className="text-3xl font-serif text-foreground tracking-tight mb-2">Your week{"\n"}in brief.</Text>
      </View>

      {loading ? (
        <View className="py-12 items-center">
          <Text className="text-sm text-muted-foreground italic">The AI is reading your week...</Text>
        </View>
      ) : (
        <View className="bg-surface rounded-2xl border border-border overflow-hidden">
          <View className="p-5 gap-3 border-b border-border">
            {summary?.bullets.map((b, i) => (
              <View key={i} className="flex-row items-start gap-3">
                <View className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5" />
                <Text className="text-base text-muted-foreground flex-1 leading-6" selectable>
                  {b}
                </Text>
              </View>
            ))}
          </View>

          <View className="p-5 gap-2 border-b border-border bg-emerald-500/10">
            <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Bright spot</Text>
            <Text className="text-sm text-muted-foreground italic leading-5" selectable>
              {summary?.brightSpot}
            </Text>
          </View>

          <View className="p-5 gap-2 bg-amber-500/10">
            <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Worth noticing</Text>
            <Text className="text-sm text-muted-foreground italic leading-5" selectable>
              {summary?.worthNoticing}
            </Text>
          </View>
        </View>
      )}

      <Button label="Continue to reflection" variant="primary" onPress={onNext} disabled={loading} />
    </View>
  );
}

function ReflectPhase({
  initialAnswers,
  isSubmitting,
  onNext,
}: {
  initialAnswers: string[];
  isSubmitting: boolean;
  onNext: (answers: string[]) => void;
}) {
  const [answers, setAnswers] = useState(initialAnswers);
  const [current, setCurrent] = useState(0);

  React.useEffect(() => {
    setAnswers(initialAnswers);
  }, [initialAnswers]);

  const updateAnswer = (i: number, text: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[i] = text;
      return next;
    });
  };

  const nextPrompt = () => {
    if (current < REFLECT_PROMPTS.length - 1) {
      setCurrent((idx) => idx + 1);
      return;
    }

    onNext(answers);
  };

  return (
    <View className="gap-6">
      <View>
        <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Reflect</Text>
        <Text className="text-3xl font-serif text-foreground tracking-tight mb-2">
          {current + 1}/{REFLECT_PROMPTS.length}
        </Text>
      </View>

      <View className="bg-surface rounded-2xl border border-border p-5 gap-4 min-h-[280px]">
        <Text className="text-xl text-foreground italic leading-6">{REFLECT_PROMPTS[current]}</Text>
        <TextInput
          className="text-base text-foreground leading-6 min-h-[180px]"
          placeholder="Take your time..."
          placeholderTextColor={Colors.fieldPlaceholder}
          value={answers[current]}
          onChangeText={(text) => updateAnswer(current, text)}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          autoFocus
          accessibilityLabel={REFLECT_PROMPTS[current]}
        />
      </View>

      <View className="flex-row gap-3 items-center justify-between">
        <Pressable
          onPress={nextPrompt}
          className="py-3 px-2"
          accessibilityRole="button"
          accessibilityLabel="Skip this reflection prompt"
        >
          <Text className="text-sm text-muted-foreground">Skip this one</Text>
        </Pressable>
        <Button
          label={current < REFLECT_PROMPTS.length - 1 ? "Next" : "Continue"}
          variant="primary"
          onPress={nextPrompt}
          disabled={isSubmitting}
        />
      </View>
    </View>
  );
}

function IntentionsPhase({
  initialIntentions,
  isSubmitting,
  onNext,
}: {
  initialIntentions: string[];
  isSubmitting: boolean;
  onNext: (intentions: string[]) => void;
}) {
  const [intentions, setIntentions] = useState([
    initialIntentions[0] ?? "",
    initialIntentions[1] ?? "",
    initialIntentions[2] ?? "",
  ]);

  React.useEffect(() => {
    setIntentions([
      initialIntentions[0] ?? "",
      initialIntentions[1] ?? "",
      initialIntentions[2] ?? "",
    ]);
  }, [initialIntentions]);

  const update = (i: number, text: string) => {
    setIntentions((prev) => {
      const next = [...prev];
      next[i] = text;
      return next;
    });
  };

  const filled = intentions.filter((item) => item.trim()).length;

  return (
    <View className="gap-6">
      <View>
        <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Intentions</Text>
        <Text className="text-3xl font-serif text-foreground tracking-tight mb-2">Next week,{"\n"}I want to...</Text>
        <Text className="text-base text-muted-foreground">1-3 loose intentions. Not commitments, directions.</Text>
      </View>

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
                  ? "Something I want to nurture..."
                  : i === 1
                    ? "Something I want to try..."
                    : "Something I want to let go of..."
              }
              placeholderTextColor={Colors.fieldPlaceholder}
              value={val}
              onChangeText={(text) => update(i, text)}
              returnKeyType="next"
              accessibilityLabel={`Intention ${i + 1}`}
            />
          </View>
        ))}
      </View>

      <Button
        label="Seal the week"
        variant="primary"
        onPress={() => onNext(intentions.filter((item) => item.trim()))}
        disabled={filled === 0 || isSubmitting}
      />
    </View>
  );
}

function ClosePhase({ intentions }: { intentions: string[] }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, damping: 15, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const weekStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <Animated.View
      className="items-center justify-center gap-4 px-2 py-8"
      style={{ transform: [{ scale: scaleAnim }], opacity: scaleAnim }}
    >
      <Text className="text-4xl text-amber-500" accessible={false}>
        *
      </Text>
      <Text className="text-2xl font-serif text-foreground">Week sealed.</Text>
      <Text className="text-base text-muted-foreground" selectable>
        {weekStr}
      </Text>

      {intentions.length > 0 && (
        <View className="w-full bg-surface rounded-2xl border border-border p-5 gap-3 mt-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Going into next week</Text>
          {intentions.map((intent, i) => (
            <Text key={i} className="text-base text-muted-foreground italic" selectable>
              - {intent}
            </Text>
          ))}
        </View>
      )}

      <Text className="text-sm text-muted-foreground text-center mt-4" selectable>
        This review is saved.
      </Text>
    </Animated.View>
  );
}

export default function ReviewScreen() {
  const { toast } = useToast();
  const reviewWindowOpen = isReviewWindowOpen();

  const currentReview = useQuery(currentReviewRef, {});
  const startReview = useMutation(startReviewRef);
  const submitReflection = useMutation(submitReflectionRef);
  const setIntentions = useMutation(setReviewIntentionsRef);
  const closeReview = useMutation(closeReviewRef);
  const skipReview = useMutation(skipReviewRef);

  const [phase, setPhase] = useState<Phase>(0);
  const [started, setStarted] = useState(false);
  const [reviewId, setReviewId] = useState<Id<"reviews"> | null>(null);
  const [reflectAnswers, setReflectAnswers] = useState(["", "", ""]);
  const [intentions, setIntentionsState] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hydratedReviewIdRef = useRef<Id<"reviews"> | null>(null);
  const autoSkipHandledRef = useRef(false);

  React.useEffect(() => {
    if (!currentReview) return;
    if (hydratedReviewIdRef.current === currentReview._id) return;

    hydratedReviewIdRef.current = currentReview._id;
    setStarted(true);
    setReviewId(currentReview._id);
    setPhase(phaseFromServer(currentReview.phase));
    setReflectAnswers([
      currentReview.feltGood ?? "",
      currentReview.feltHard ?? "",
      currentReview.carryForward ?? "",
    ]);
    setIntentionsState(currentReview.intentions ?? []);
  }, [currentReview]);

  const summary = useMemo(() => parseSummary(currentReview ?? null), [currentReview]);

  const resetLocalState = () => {
    hydratedReviewIdRef.current = null;
    autoSkipHandledRef.current = false;
    setStarted(false);
    setPhase(0);
    setReviewId(null);
    setReflectAnswers(["", "", ""]);
    setIntentionsState([]);
  };

  const activeReviewId = currentReview?._id ?? reviewId;
  const lookbackLoading = started && phase === 0 && !summary;
  const nextWindowStartLabel = getNextReviewWindowStart().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  React.useEffect(() => {
    if (!currentReview || currentReview.phase === "closed" || reviewWindowOpen || autoSkipHandledRef.current) {
      return;
    }

    autoSkipHandledRef.current = true;
    setIsSubmitting(true);

    void skipReview({ idempotencyKey: toKey("review.auto-skip.window-closed") })
      .then(() => {
        resetLocalState();
        toast.show({ variant: "success", label: "Review window closed. This week was marked skipped." });
      })
      .catch(() => {
        toast.show({ variant: "danger", label: "Failed to close expired review window" });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }, [currentReview, reviewWindowOpen, skipReview, toast]);

  const handleStart = async () => {
    setIsSubmitting(true);
    try {
      const id = await startReview({ idempotencyKey: toKey("review.start") });
      setReviewId(id);
      setStarted(true);
      setPhase(0);
    } catch {
      toast.show({ variant: "danger", label: "Failed to start review" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipWeek = async () => {
    setIsSubmitting(true);
    try {
      await skipReview({ idempotencyKey: toKey("review.skip") });
      resetLocalState();
      toast.show({ variant: "success", label: "Review skipped" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to skip review" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReflection = async (answers: string[]) => {
    if (!activeReviewId) {
      toast.show({ variant: "danger", label: "No active review found" });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReflection({
        idempotencyKey: toKey("review.reflection"),
        reviewId: activeReviewId,
        feltGood: answers[0]?.trim() ?? "",
        feltHard: answers[1]?.trim() ?? "",
        carryForward: answers[2]?.trim() ?? "",
      });
      setReflectAnswers(answers);
      setPhase(2);
    } catch {
      toast.show({ variant: "danger", label: "Failed to save reflection" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitIntentions = async (nextIntentions: string[]) => {
    if (!activeReviewId) {
      toast.show({ variant: "danger", label: "No active review found" });
      return;
    }

    setIsSubmitting(true);
    try {
      await setIntentions({
        idempotencyKey: toKey("review.intentions"),
        reviewId: activeReviewId,
        intentions: nextIntentions,
      });

      await closeReview({
        idempotencyKey: toKey("review.close"),
        reviewId: activeReviewId,
        summary: summary?.bullets.join("\n"),
        brightSpot: summary?.brightSpot,
        worthNoticing: summary?.worthNoticing,
      });

      setIntentionsState(nextIntentions);
      setPhase(3);
      toast.show({ variant: "success", label: "Review complete" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to save review" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentReview === undefined && !started) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-sm text-muted-foreground">Loading weekly review...</Text>
      </View>
    );
  }

  if (!reviewWindowOpen && !started) {
    return (
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="p-6 pb-24 gap-6"
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Weekly Review</Text>
          <Text className="text-3xl font-serif text-foreground tracking-tight mb-2">Review window{"\n"}is closed.</Text>
          <Text className="text-base text-muted-foreground">
            Weekly review is available from Sunday through Tuesday in your local timezone.
          </Text>
        </View>

        <View className="bg-surface border border-border rounded-2xl p-5 gap-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Next window opens</Text>
          <Text className="text-lg text-foreground font-medium" selectable>
            {nextWindowStartLabel}
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (!started) {
    return (
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="p-6 pb-24 gap-6"
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-2">
          <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Weekly Review</Text>
          <Text className="text-3xl font-serif text-foreground tracking-tight mb-2">Time to close{"\n"}the week.</Text>
          <Text className="text-base text-muted-foreground">Takes about 5 minutes. You can skip any part.</Text>
        </View>

        <View className="gap-3 mb-4">
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
          <Button label="Start review" variant="primary" onPress={handleStart} disabled={isSubmitting} />
          <Pressable
            className="items-center py-3"
            onPress={handleSkipWeek}
            accessibilityRole="button"
            accessibilityLabel="Skip weekly review"
          >
            <Text className="text-sm text-muted-foreground">Skip this week</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="p-6 pb-32 gap-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <PhaseIndicator current={phase} total={4} />

        {phase < 3 ? (
          <View className="flex-row justify-between items-center">
            <Pressable
              onPress={() => setPhase((prev) => (prev > 0 ? ((prev - 1) as Phase) : prev))}
              disabled={phase === 0 || isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Go to previous phase"
              className={phase === 0 ? "opacity-40" : ""}
            >
              <Text className="text-sm text-muted-foreground">Previous</Text>
            </Pressable>
            <Pressable
              onPress={handleSkipWeek}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Skip weekly review"
            >
              <Text className="text-sm text-muted-foreground">Skip review</Text>
            </Pressable>
          </View>
        ) : null}

        {phase === 0 ? (
          <LookBackPhase loading={lookbackLoading} summary={summary} onNext={() => setPhase(1)} />
        ) : null}

        {phase === 1 ? (
          <ReflectPhase
            initialAnswers={reflectAnswers}
            isSubmitting={isSubmitting}
            onNext={handleSubmitReflection}
          />
        ) : null}

        {phase === 2 ? (
          <IntentionsPhase
            initialIntentions={intentions}
            isSubmitting={isSubmitting}
            onNext={handleSubmitIntentions}
          />
        ) : null}

        {phase === 3 ? (
          <>
            <ClosePhase intentions={intentions} />
            <Button
              label="Done"
              variant="primary"
              onPress={resetLocalState}
              disabled={isSubmitting}
            />
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
