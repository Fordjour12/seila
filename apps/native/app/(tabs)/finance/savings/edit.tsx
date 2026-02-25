import React from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { api } from "@seila/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";
import type { Id } from "@seila/backend/convex/_generated/dataModel";

import { savingsGoalsRef, setSavingsGoalRef, contributeSavingsGoalRef } from "../../../../lib/finance-refs";
import { formatGhs } from "../../../../lib/ghs";
import { Button } from "../../../../components/ui";

const AMOUNT_PRESETS = [100, 500, 1000, 2500, 5000];

export default function EditSavingsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toast } = useToast();

  const goals = useQuery(savingsGoalsRef, {});
  const goal = goals?.find((g) => g.goalId === id);
  const envelopes = useQuery(api.queries.envelopeSummary.envelopeSummary);

  const setSavingsGoal = useMutation(setSavingsGoalRef);
  const contributeSavingsGoal = useMutation(contributeSavingsGoalRef);

  const [name, setName] = React.useState(goal?.name || "");
  const [targetAmount, setTargetAmount] = React.useState(
    goal?.targetAmount ? (goal.targetAmount / 100).toString() : ""
  );
  const [selectedEnvelopeId, setSelectedEnvelopeId] = React.useState<string | undefined>(goal?.envelopeId);
  const [deadlineAt, setDeadlineAt] = React.useState<number | undefined>(goal?.deadlineAt);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [contributionAmount, setContributionAmount] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTargetAmount(goal.targetAmount ? (goal.targetAmount / 100).toString() : "");
      setSelectedEnvelopeId(goal.envelopeId);
      setDeadlineAt(goal.deadlineAt);
    }
  }, [goal]);

  const handleUpdate = async () => {
    if (!name.trim()) {
      toast.show({ variant: "warning", label: "Please enter a goal name" });
      return;
    }
    const amount = Math.round(parseFloat(targetAmount) * 100);
    if (!amount || amount <= 0) {
      toast.show({ variant: "warning", label: "Please enter a valid amount" });
      return;
    }

    setIsSubmitting(true);
    try {
      await setSavingsGoal({
        idempotencyKey: `finance.goal.update:${Date.now()}`,
        goalId: id as Id<"savingsGoals">,
        name: name.trim(),
        targetAmount: amount,
        envelopeId: selectedEnvelopeId as Id<"envelopes"> | undefined,
        deadlineAt: deadlineAt,
      });
      toast.show({ variant: "success", label: "Goal updated" });
      router.back();
    } catch {
      toast.show({ variant: "danger", label: "Failed to update goal" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContribute = async () => {
    const amount = Math.round(parseFloat(contributionAmount) * 100);
    if (!amount || amount <= 0) {
      toast.show({ variant: "warning", label: "Please enter a valid amount" });
      return;
    }

    try {
      await contributeSavingsGoal({
        idempotencyKey: `finance.goal.contribution:${id}:${Date.now()}`,
        goalId: id as Id<"savingsGoals">,
        amount,
      });
      toast.show({ variant: "success", label: "Contribution added" });
      setContributionAmount("");
    } catch {
      toast.show({ variant: "danger", label: "Failed to add contribution" });
    }
  };

  if (!goal) {
    return (
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
        <View className="py-12 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading...</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View>
        <Text className="text-3xl font-serif text-foreground tracking-tight">Edit Goal</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Update your savings goal
        </Text>
      </View>

      <View className="bg-surface rounded-2xl border border-border p-5 gap-3">
        <View className="flex-row justify-between items-center">
          <Text className="text-base font-medium text-foreground">Progress</Text>
          <Text className="text-xl font-medium text-warning">
            {Math.round((goal.progress || 0) * 100)}%
          </Text>
        </View>
        <View className="h-2 bg-background rounded-full overflow-hidden">
          <View
            className="h-full bg-warning rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, (goal.progress || 0) * 100))}%` }}
          />
        </View>
        <View className="flex-row justify-between">
          <Text className="text-sm text-muted-foreground">
            {formatGhs(goal.currentAmount)} saved
          </Text>
          <Text className="text-sm text-muted-foreground">
            Goal: {formatGhs(goal.targetAmount)}
          </Text>
        </View>
      </View>

      <View className="bg-surface rounded-2xl border border-border p-5 gap-3">
        <Text className="text-sm font-medium text-foreground">Add Money</Text>
        <View className="flex-row flex-wrap gap-2">
          {AMOUNT_PRESETS.map((preset) => (
            <Pressable
              key={preset}
              className="px-4 py-2.5 rounded-xl border bg-background border-border"
              onPress={() => setContributionAmount(preset.toString())}
            >
              <Text className="text-sm font-medium text-foreground">GHS {preset}</Text>
            </Pressable>
          ))}
        </View>
        <View className="flex-row gap-2">
          <TextInput
            className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-base text-foreground"
            value={contributionAmount}
            onChangeText={setContributionAmount}
            placeholder="Custom amount"
            placeholderTextColor="#6b7280"
            keyboardType="decimal-pad"
          />
          <Pressable
            className="bg-warning rounded-xl px-6 py-3"
            onPress={handleContribute}
          >
            <Text className="text-sm font-medium text-background">Add</Text>
          </Pressable>
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">Goal Name</Text>
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
          value={name}
          onChangeText={setName}
          placeholder="e.g., Emergency Fund"
          placeholderTextColor="#6b7280"
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">Target Amount</Text>
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
          value={targetAmount}
          onChangeText={setTargetAmount}
          placeholder="e.g., 10000"
          placeholderTextColor="#6b7280"
          keyboardType="decimal-pad"
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">Envelope</Text>
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
        <Text className="text-sm font-medium text-foreground">Deadline</Text>
        <Pressable
          className="bg-surface border border-border rounded-xl px-4 py-3"
          onPress={() => setShowDatePicker(true)}
        >
          <Text className={`text-base ${deadlineAt ? "text-foreground" : "text-muted-foreground"}`}>
            {deadlineAt ? new Date(deadlineAt).toLocaleDateString() : "No deadline set"}
          </Text>
        </Pressable>
        {deadlineAt && (
          <Pressable className="pt-2" onPress={() => setDeadlineAt(undefined)}>
            <Text className="text-sm text-danger">Clear deadline</Text>
          </Pressable>
        )}
      </View>

      <View className="flex-row gap-3 pt-4">
        <Button
          label="Cancel"
          variant="ghost"
          onPress={() => router.back()}
          style={{ flex: 0 }}
        />
        <Button
          label={isSubmitting ? "Saving..." : "Save Changes"}
          variant="primary"
          onPress={handleUpdate}
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
