import React from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { api } from "@seila/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";
import type { Id } from "@seila/backend/convex/_generated/dataModel";

import { setSavingsGoalRef } from "../../../../lib/finance-refs";
import { Button } from "../../../../components/ui";

const AMOUNT_PRESETS = [1000, 2500, 5000, 10000, 20000];

const DATE_PRESETS = [
  { label: "1 month", months: 1 },
  { label: "3 months", months: 3 },
  { label: "6 months", months: 6 },
  { label: "1 year", months: 12 },
];

export default function AddSavingsScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const envelopes = useQuery(api.queries.envelopeSummary.envelopeSummary);
  const setSavingsGoal = useMutation(setSavingsGoalRef);

  const [name, setName] = React.useState("");
  const [customAmount, setCustomAmount] = React.useState("");
  const [selectedAmount, setSelectedAmount] = React.useState<number>(AMOUNT_PRESETS[1]);
  const [selectedEnvelopeId, setSelectedEnvelopeId] = React.useState<string | undefined>();
  const [deadlineAt, setDeadlineAt] = React.useState<number | undefined>();
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const resolvedAmount = customAmount ? parseFloat(customAmount) : selectedAmount;

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.show({ variant: "warning", label: "Please enter a goal name" });
      return;
    }
    const amount = Math.round(resolvedAmount * 100);
    if (!amount || amount <= 0) {
      toast.show({ variant: "warning", label: "Please enter a valid amount" });
      return;
    }

    setIsSubmitting(true);
    try {
      await setSavingsGoal({
        idempotencyKey: `finance.goal:${Date.now()}`,
        name: name.trim(),
        targetAmount: amount,
        envelopeId: selectedEnvelopeId as Id<"envelopes"> | undefined,
        deadlineAt: deadlineAt,
      });
      toast.show({ variant: "success", label: "Savings goal created" });
      router.back();
    } catch {
      toast.show({ variant: "danger", label: "Failed to create goal" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDatePreset = (months: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    setDeadlineAt(date.getTime());
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View>
        <Text className="text-3xl font-serif text-foreground tracking-tight">New Goal</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Set a target to start saving toward
        </Text>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">What are you saving for?</Text>
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
          value={name}
          onChangeText={setName}
          placeholder="e.g., Emergency Fund, Vacation, New Phone"
          placeholderTextColor="#6b7280"
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">How much do you need?</Text>
        <View className="flex-row flex-wrap gap-2">
          {AMOUNT_PRESETS.map((preset) => (
            <Pressable
              key={preset}
              className={`px-4 py-2.5 rounded-xl border ${
                !customAmount && selectedAmount === preset
                  ? "bg-warning/10 border-warning/30"
                  : "bg-surface border-border"
              }`}
              onPress={() => {
                setSelectedAmount(preset);
                setCustomAmount("");
              }}
            >
              <Text
                className={`text-sm font-medium ${
                  !customAmount && selectedAmount === preset ? "text-warning" : "text-foreground"
                }`}
              >
                GHS {preset.toLocaleString()}
              </Text>
            </Pressable>
          ))}
        </View>
        <View className="mt-2">
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
            value={customAmount}
            onChangeText={setCustomAmount}
            placeholder="Or enter a custom amount"
            placeholderTextColor="#6b7280"
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">Envelope (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          <Pressable
            className={`px-4 py-2.5 rounded-xl border mr-2 ${
              !selectedEnvelopeId ? "bg-warning/10 border-warning/30" : "bg-surface border-border"
            }`}
            onPress={() => setSelectedEnvelopeId(undefined)}
          >
            <Text className={`text-sm font-medium ${!selectedEnvelopeId ? "text-warning" : "text-foreground"}`}>
              No envelope
            </Text>
          </Pressable>
          {(envelopes || []).map((envelope) => (
            <Pressable
              key={envelope.envelopeId}
              className={`px-4 py-2.5 rounded-xl border mr-2 ${
                selectedEnvelopeId === envelope.envelopeId
                  ? "bg-warning/10 border-warning/30"
                  : "bg-surface border-border"
              }`}
              onPress={() => setSelectedEnvelopeId(envelope.envelopeId)}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedEnvelopeId === envelope.envelopeId ? "text-warning" : "text-foreground"
                }`}
              >
                {envelope.emoji ? `${envelope.emoji} ` : ""}
                {envelope.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">Deadline (optional)</Text>
        <View className="flex-row flex-wrap gap-2">
          {DATE_PRESETS.map((preset) => (
            <Pressable
              key={preset.months}
              className={`px-4 py-2.5 rounded-xl border ${
                deadlineAt &&
                new Date(deadlineAt).getTime() > Date.now() &&
                Math.abs(
                  new Date(deadlineAt).getMonth() -
                    new Date(Date.now() + preset.months * 30 * 24 * 60 * 60 * 1000).getMonth()
                ) < 1
                  ? "bg-warning/10 border-warning/30"
                  : "bg-surface border-border"
              }`}
              onPress={() => handleDatePreset(preset.months)}
            >
              <Text
                className={`text-sm font-medium ${
                  deadlineAt &&
                  new Date(deadlineAt).getTime() > Date.now() &&
                  Math.abs(
                    new Date(deadlineAt).getMonth() -
                      new Date(Date.now() + preset.months * 30 * 24 * 60 * 60 * 1000).getMonth()
                  ) < 1
                    ? "text-warning"
                    : "text-foreground"
                }`}
              >
                {preset.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            className={`px-4 py-2.5 rounded-xl border ${
              deadlineAt ? "bg-warning/10 border-warning/30" : "bg-surface border-border"
            }`}
            onPress={() => setShowDatePicker(true)}
          >
            <Text className={`text-sm font-medium ${deadlineAt ? "text-warning" : "text-foreground"}`}>
              {deadlineAt ? new Date(deadlineAt).toLocaleDateString() : "Pick date"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="flex-row gap-3 pt-4">
        <Button
          label="Cancel"
          variant="ghost"
          onPress={() => router.back()}
          style={{ flex: 0 }}
        />
        <Button
          label={isSubmitting ? "Creating..." : "Create Goal"}
          variant="primary"
          onPress={handleCreate}
          disabled={isSubmitting}
          style={{ flex: 1 }}
        />
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={deadlineAt ? new Date(deadlineAt) : new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_event, date) => {
            setShowDatePicker(Platform.OS === "ios");
            if (date) {
              setDeadlineAt(date.getTime());
            }
          }}
        />
      )}
    </ScrollView>
  );
}
