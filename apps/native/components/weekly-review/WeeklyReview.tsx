import { api } from "@seila/backend/convex/_generated/api";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Button, Surface, useToast } from "heroui-native";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";

function getIdempotencyKey(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}

interface WeeklySummary {
  bullets: string[];
  brightSpot: string;
  worthNoticing: string;
}

export function WeeklyReview() {
  const { isAuthenticated } = useConvexAuth();
  const { toast } = useToast();

  const currentReview = useQuery(api.queries.reviewQueries.currentReview);
  const startReview = useMutation(api.commands.reviewCommands.startReview);
  const submitReflection = useMutation(api.commands.reviewCommands.submitReflection);
  const setIntentions = useMutation(api.commands.reviewCommands.setIntentions);
  const closeReview = useMutation(api.commands.reviewCommands.closeReview);
  const skipReview = useMutation(api.commands.reviewCommands.skipReview);

  const [phase, setPhase] = useState<"closed" | "lookback" | "reflect" | "intentions">("closed");
  const [reviewId, setReviewId] = useState<Id<"reviews"> | null>(null);
  const [feltGood, setFeltGood] = useState("");
  const [feltHard, setFeltHard] = useState("");
  const [carryForward, setCarryForward] = useState("");
  const [aiSuggested, setAiSuggested] = useState("");
  const [intention1, setIntention1] = useState("");
  const [intention2, setIntention2] = useState("");
  const [intention3, setIntention3] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const summary: WeeklySummary | null = currentReview?.summaryGenerated &&
    currentReview.summary &&
    currentReview.brightSpot &&
    currentReview.worthNoticing
    ? {
        bullets: currentReview.summary
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .slice(0, 5),
        brightSpot: currentReview.brightSpot,
        worthNoticing: currentReview.worthNoticing,
      }
    : null;

  if (!isAuthenticated) {
    return null;
  }

  if (!currentReview && phase === "closed") {
    return (
      <Surface variant="secondary" className="p-4 rounded-xl">
        <Text className="text-foreground font-medium mb-2">Weekly Review</Text>
        <Text className="text-muted text-sm mb-4">
          Time to reflect on your week. Set intentions for the week ahead.
        </Text>
        <View className="flex-row gap-2">
          <Button
            variant="primary"
            onPress={async () => {
              try {
                const id = await startReview({
                  idempotencyKey: getIdempotencyKey("review.start"),
                });
                setReviewId(id);
                setPhase("lookback");
              } catch (error) {
                toast.show({ variant: "danger", label: "Failed to start review" });
              }
            }}
          >
            Start Review
          </Button>
          <Button
            variant="secondary"
            onPress={async () => {
              try {
                await skipReview({
                  idempotencyKey: getIdempotencyKey("review.skip"),
                });
                toast.show({ variant: "success", label: "Review skipped" });
              } catch (error) {
                toast.show({ variant: "danger", label: "Failed to skip" });
              }
            }}
          >
            Skip
          </Button>
        </View>
      </Surface>
    );
  }

  if (phase === "lookback" || currentReview?.phase === "lookback") {
    return (
      <Surface variant="secondary" className="p-4 rounded-xl">
        <Text className="text-foreground font-medium mb-4">Looking Back</Text>
        
        <View className="mb-4">
          <Text className="text-muted text-sm mb-2">Week Summary</Text>
          {summary ? (
            <View className="gap-1">
              {summary.bullets.map((bullet, i) => (
                <Text key={i} className="text-foreground text-sm">• {bullet}</Text>
              ))}
            </View>
          ) : (
            <Text className="text-muted text-sm">
              Generating your weekly summary...
            </Text>
          )}
        </View>

        <View className="mb-4 p-3 bg-default-100 rounded-lg">
          <Text className="text-muted text-xs mb-1">Bright Spot</Text>
          <Text className="text-foreground text-sm">
            {summary?.brightSpot ?? "Looking for a bright spot from this week..."}
          </Text>
        </View>

        <View className="mb-4 p-3 bg-default-100 rounded-lg">
          <Text className="text-muted text-xs mb-1">Worth Noticing</Text>
          <Text className="text-foreground text-sm">
            {summary?.worthNoticing ?? "Gathering what stands out from this week..."}
          </Text>
        </View>

        <Button
          variant="primary"
          onPress={() => setPhase("reflect")}
        >
          Continue to Reflection
        </Button>
      </Surface>
    );
  }

  if (phase === "reflect" || currentReview?.phase === "reflect") {
    return (
      <Surface variant="secondary" className="p-4 rounded-xl">
        <Text className="text-foreground font-medium mb-4">Reflection</Text>
        
        <View className="mb-4">
          <Text className="text-muted text-sm mb-2">What felt good this week?</Text>
          <TextInput
            placeholder="Reflect on the positives..."
            placeholderTextColor="#9CA3AF"
            value={feltGood}
            onChangeText={setFeltGood}
            multiline
            numberOfLines={2}
            className="bg-default-100 rounded-lg px-3 py-2 text-foreground"
            style={{ minHeight: 60, textAlignVertical: "top" }}
          />
        </View>

        <View className="mb-4">
          <Text className="text-muted text-sm mb-2">What felt hard?</Text>
          <TextInput
            placeholder="What were the challenges?"
            placeholderTextColor="#9CA3AF"
            value={feltHard}
            onChangeText={setFeltHard}
            multiline
            numberOfLines={2}
            className="bg-default-100 rounded-lg px-3 py-2 text-foreground"
            style={{ minHeight: 60, textAlignVertical: "top" }}
          />
        </View>

        <View className="mb-4">
          <Text className="text-muted text-sm mb-2">What do you want to carry into next week?</Text>
          <TextInput
            placeholder="Your intentions..."
            placeholderTextColor="#9CA3AF"
            value={carryForward}
            onChangeText={setCarryForward}
            multiline
            numberOfLines={2}
            className="bg-default-100 rounded-lg px-3 py-2 text-foreground"
            style={{ minHeight: 60, textAlignVertical: "top" }}
          />
        </View>

        <View className="mb-4">
          <Text className="text-muted text-sm mb-2">Optional AI prompt</Text>
          <TextInput
            placeholder="Optional: ask AI to highlight one thing to notice."
            placeholderTextColor="#9CA3AF"
            value={aiSuggested}
            onChangeText={setAiSuggested}
            multiline
            numberOfLines={2}
            className="bg-default-100 rounded-lg px-3 py-2 text-foreground"
            style={{ minHeight: 60, textAlignVertical: "top" }}
          />
        </View>

        <Button
          variant="primary"
          onPress={async () => {
            if (!feltGood.trim() || !feltHard.trim() || !carryForward.trim()) {
              toast.show({ variant: "warning", label: "Please fill in all fields" });
              return;
            }
            setIsSubmitting(true);
            try {
                const id = currentReview?._id ?? reviewId;
                if (!id) {
                  toast.show({ variant: "danger", label: "No active review found" });
                  return;
                }
                await submitReflection({
                  reviewId: id,
                idempotencyKey: getIdempotencyKey("review.reflection"),
                feltGood: feltGood.trim(),
                feltHard: feltHard.trim(),
                carryForward: carryForward.trim(),
                aiSuggested: aiSuggested.trim() || undefined,
              });
              setPhase("intentions");
            } catch (error) {
              toast.show({ variant: "danger", label: "Failed to save reflection" });
            } finally {
              setIsSubmitting(false);
            }
          }}
          isDisabled={isSubmitting}
        >
          Continue to Intentions
        </Button>
      </Surface>
    );
  }

  if (phase === "intentions" || currentReview?.phase === "intentions") {
    return (
      <Surface variant="secondary" className="p-4 rounded-xl">
        <Text className="text-foreground font-medium mb-4">Intentions for Next Week</Text>
        <Text className="text-muted text-sm mb-4">
          Set 1-3 loose intentions. Not commitments—just directions.
        </Text>
        
        <View className="mb-3">
          <TextInput
            placeholder="Intention 1..."
            placeholderTextColor="#9CA3AF"
            value={intention1}
            onChangeText={setIntention1}
            className="bg-default-100 rounded-lg px-3 py-2 text-foreground"
          />
        </View>

        <View className="mb-3">
          <TextInput
            placeholder="Intention 2 (optional)..."
            placeholderTextColor="#9CA3AF"
            value={intention2}
            onChangeText={setIntention2}
            className="bg-default-100 rounded-lg px-3 py-2 text-foreground"
          />
        </View>

        <View className="mb-4">
          <TextInput
            placeholder="Intention 3 (optional)..."
            placeholderTextColor="#9CA3AF"
            value={intention3}
            onChangeText={setIntention3}
            className="bg-default-100 rounded-lg px-3 py-2 text-foreground"
          />
        </View>

        <Button
          variant="primary"
          onPress={async () => {
            const intentions = [intention1, intention2, intention3]
              .filter(i => i.trim())
              .slice(0, 3);
            
            if (intentions.length === 0) {
              toast.show({ variant: "warning", label: "Please add at least one intention" });
              return;
            }
            
            setIsSubmitting(true);
            try {
              const id = currentReview?._id ?? reviewId;
              if (!id) {
                toast.show({ variant: "danger", label: "No active review found" });
                return;
              }
              await setIntentions({
                reviewId: id,
                idempotencyKey: getIdempotencyKey("review.intentions"),
                intentions,
              });
              await closeReview({
                reviewId: id,
                idempotencyKey: getIdempotencyKey("review.close"),
                summary: summary?.bullets.join("\n"),
                brightSpot: summary?.brightSpot,
                worthNoticing: summary?.worthNoticing,
              });
              setPhase("closed");
              toast.show({ variant: "success", label: "Review complete" });
            } catch (error) {
              toast.show({ variant: "danger", label: "Failed to save" });
            } finally {
              setIsSubmitting(false);
            }
          }}
          isDisabled={isSubmitting}
        >
          Complete Review
        </Button>
      </Surface>
    );
  }

  return null;
}
