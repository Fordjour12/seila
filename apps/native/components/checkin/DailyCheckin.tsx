import { useConvexAuth, useMutation } from "convex/react";
import { Button, useToast } from "heroui-native";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";

import { api } from "@seila/backend/convex/_generated/api";

const MOOD_EMOJIS: Record<number, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😊",
};

const MOOD_LABELS: Record<number, string> = {
  1: "Rough",
  2: "Not great",
  3: "Okay",
  4: "Good",
  5: "Great",
};

const ENERGY_LABELS: Record<number, string> = {
  1: "Exhausted",
  2: "Low",
  3: "Moderate",
  4: "Energized",
  5: "Full tilt",
};

const ALL_FLAGS = [
  "anxious",
  "grateful",
  "overwhelmed",
  "calm",
  "tired",
  "motivated",
  "stressed",
  "peaceful",
  "isolated",
  "connected",
  "uncertain",
  "focused",
] as const;

type CheckinFlags = (typeof ALL_FLAGS)[number][];

interface DailyCheckinProps {
  onComplete?: () => void;
}

export function DailyCheckin({ onComplete }: DailyCheckinProps) {
  const { isAuthenticated } = useConvexAuth();
  const { toast } = useToast();
  const submitCheckin = useMutation(api.commands.checkins.submitCheckin.submitCheckin);

  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [energy, setEnergy] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [flags, setFlags] = useState<CheckinFlags>([]);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleFlag = (flag: (typeof ALL_FLAGS)[number]) => {
    setFlags((prev) => (prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]));
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.show({
        variant: "warning",
        label: "Please sign in to save check-ins",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitCheckin({
        idempotencyKey: `checkin:${Date.now()}`,
        type: "daily",
        mood,
        energy,
        flags,
        note: note.trim() || undefined,
      });
      toast.show({
        variant: "success",
        label: "Check-in saved",
      });
      onComplete?.();
    } catch (error) {
      toast.show({
        variant: "danger",
        label: "Failed to save check-in",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="p-4 gap-6">
      <View>
        <Text className="text-lg font-medium text-foreground mb-3">How are you feeling?</Text>
        <View className="flex-row justify-between">
          {[1, 2, 3, 4, 5].map((value) => (
            <View key={value} className="items-center">
              <Button
                variant={mood === value ? "primary" : "secondary"}
                size="lg"
                onPress={() => setMood(value as 1 | 2 | 3 | 4 | 5)}
                className="w-14 h-14 rounded-full"
              >
                <Text className="text-2xl">{MOOD_EMOJIS[value]}</Text>
              </Button>
              <Text className="text-xs text-muted-foreground mt-1">{MOOD_LABELS[value]}</Text>
            </View>
          ))}
        </View>
      </View>

      <View>
        <Text className="text-lg font-medium text-foreground mb-3">
          Energy level: {ENERGY_LABELS[energy]}
        </Text>
        <View className="flex-row justify-between">
          {[1, 2, 3, 4, 5].map((value) => (
            <Button
              key={value}
              variant={energy === value ? "primary" : "secondary"}
              size="sm"
              onPress={() => setEnergy(value as 1 | 2 | 3 | 4 | 5)}
              className="w-12"
            >
              {value}
            </Button>
          ))}
        </View>
      </View>

      <View>
        <Text className="text-lg font-medium text-foreground mb-3">What&apos;s on your mind?</Text>
        <View className="flex-row flex-wrap gap-2">
          {ALL_FLAGS.map((flag) => (
            <Button
              key={flag}
              variant={flags.includes(flag) ? "primary" : "secondary"}
              size="sm"
              onPress={() => toggleFlag(flag)}
            >
              {flag}
            </Button>
          ))}
        </View>
      </View>

      <View>
        <Text className="text-sm text-muted-foreground mb-2">Note (optional)</Text>
        <TextInput
          className="border border-border rounded-xl px-3 py-2.5 text-foreground min-h-[90] text-base"
          placeholder="What's noteworthy about today?"
          placeholderTextColor="#9CA3AF"
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <Button
        variant="primary"
        size="lg"
        onPress={handleSubmit}
        isDisabled={!isAuthenticated || isSubmitting}
      >
        {isSubmitting ? "Saving..." : "Save Check-in"}
      </Button>
    </View>
  );
}
