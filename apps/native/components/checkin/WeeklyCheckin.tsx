import { useMutation } from "convex/react";
import { Button, useToast } from "heroui-native";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";

import { api } from "@seila/backend/convex/_generated/api";

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

type CheckinFlag = (typeof ALL_FLAGS)[number];

interface WeeklyCheckinProps {
  onComplete?: () => void;
}

export function WeeklyCheckin({ onComplete }: WeeklyCheckinProps) {
  const { toast } = useToast();
  const submitCheckin = useMutation(api.commands.checkins.submitCheckin.submitCheckin);

  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [energy, setEnergy] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [flags, setFlags] = useState<CheckinFlag[]>([]);
  const [feltGood, setFeltGood] = useState("");
  const [feltHard, setFeltHard] = useState("");
  const [carryForward, setCarryForward] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleFlag = (flag: CheckinFlag) => {
    setFlags((prev) => (prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]));
  };

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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitCheckin({
        idempotencyKey: `checkin-weekly:${Date.now()}`,
        type: "weekly",
        mood,
        energy,
        flags,
        weeklyAnswers: {
          feltGood: feltGood.trim(),
          feltHard: feltHard.trim(),
          carryForward: carryForward.trim(),
        },
      });
      toast.show({
        variant: "success",
        label: "Weekly check-in saved",
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
        <Text className="text-lg font-medium text-foreground mb-3">How was your week?</Text>
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
        <Text className="text-lg font-medium text-foreground mb-3">Energy level</Text>
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
        <Text className="text-lg font-medium text-foreground mb-3">Quick flags</Text>
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

      <Text className="text-xl font-medium text-foreground mt-4">Weekly Reflection</Text>

      <View>
        <Text className="text-sm text-muted-foreground mb-2">What felt good this week?</Text>
        <TextInput
          className="border border-border rounded-xl px-3 py-2.5 text-foreground min-h-[80] text-base"
          placeholder="Reflect on the positives..."
          placeholderTextColor="#9CA3AF"
          value={feltGood}
          onChangeText={setFeltGood}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View>
        <Text className="text-sm text-muted-foreground mb-2">What felt hard?</Text>
        <TextInput
          className="border border-border rounded-xl px-3 py-2.5 text-foreground min-h-[80] text-base"
          placeholder="What were the challenges?"
          placeholderTextColor="#9CA3AF"
          value={feltHard}
          onChangeText={setFeltHard}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View>
        <Text className="text-sm text-muted-foreground mb-2">What do you want to carry into next week?</Text>
        <TextInput
          className="border border-border rounded-xl px-3 py-2.5 text-foreground min-h-[80] text-base"
          placeholder="Your intentions for next week..."
          placeholderTextColor="#9CA3AF"
          value={carryForward}
          onChangeText={setCarryForward}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <Button
        variant="primary"
        size="lg"
        onPress={handleSubmit}
        isDisabled={isSubmitting}
      >
        {isSubmitting ? "Saving..." : "Save Weekly Check-in"}
      </Button>
    </View>
  );
}
