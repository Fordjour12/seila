import React from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { api } from "@seila/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { useToast } from "heroui-native";

import {
  cancelRecurringTransactionRef,
  recurringTransactionsRef,
  scheduleRecurringTransactionRef,
  updateRecurringTransactionRef,
} from "../../../../lib/finance-refs";
import { formatGhs } from "../../../../lib/ghs";
import { Button, SectionLabel } from "../../../../components/ui";

type SubscriptionCadence = "weekly" | "biweekly" | "monthly";

function cadenceMonthlyEquivalent(amount: number, cadence: SubscriptionCadence) {
  if (cadence === "weekly") return Math.round(amount * 4.345);
  if (cadence === "biweekly") return Math.round(amount * 2.1725);
  return amount;
}

export default function FinanceSubscriptionsScreen() {
  const { toast } = useToast();
  const recurring = useQuery(recurringTransactionsRef, { limit: 100 });
  const envelopes = useQuery(api.queries.envelopeSummary.envelopeSummary);
  const scheduleRecurringTransaction = useMutation(scheduleRecurringTransactionRef);
  const updateRecurringTransaction = useMutation(updateRecurringTransactionRef);
  const cancelRecurringTransaction = useMutation(cancelRecurringTransactionRef);

  const subscriptions = React.useMemo(
    () =>
      (recurring || [])
        .filter((item) => item.kind === "subscription")
        .sort((a, b) => a.nextDueAt - b.nextDueAt),
    [recurring],
  );

  const [editingRecurringId, setEditingRecurringId] = React.useState<string | undefined>();
  const [name, setName] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [cadence, setCadence] = React.useState<SubscriptionCadence>("monthly");
  const [category, setCategory] = React.useState("");
  const [nextDueAt, setNextDueAt] = React.useState(Date.now());
  const [selectedEnvelopeId, setSelectedEnvelopeId] = React.useState<Id<"envelopes"> | undefined>();
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isLoading = recurring === undefined || envelopes === undefined;

  const dueSoonCount = React.useMemo(() => {
    const now = Date.now();
    const soon = now + 14 * 24 * 60 * 60 * 1000;
    return subscriptions.filter((item) => item.nextDueAt <= soon).length;
  }, [subscriptions]);

  const monthlyEquivalent = React.useMemo(
    () =>
      subscriptions.reduce(
        (sum, item) =>
          sum + cadenceMonthlyEquivalent(item.amount, item.cadence as SubscriptionCadence),
        0,
      ),
    [subscriptions],
  );

  const resetForm = React.useCallback(() => {
    setEditingRecurringId(undefined);
    setName("");
    setAmount("");
    setCadence("monthly");
    setCategory("");
    setNextDueAt(Date.now());
    setSelectedEnvelopeId(undefined);
  }, []);

  React.useEffect(() => {
    if (editingRecurringId) return;
    if (selectedEnvelopeId) return;
    const defaultEnvelope = (envelopes || []).find(
      (item) => item.name.trim().toLowerCase() === "subscriptions",
    );
    if (defaultEnvelope) {
      setSelectedEnvelopeId(defaultEnvelope.envelopeId as Id<"envelopes">);
    }
  }, [editingRecurringId, selectedEnvelopeId, envelopes]);

  const handleSubmit = async () => {
    const amountCents = Math.round(parseFloat(amount) * 100);
    if (!name.trim() || !Number.isInteger(amountCents) || amountCents <= 0) {
      toast.show({ variant: "warning", label: "Enter valid subscription details" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRecurringId) {
        await updateRecurringTransaction({
          idempotencyKey: `finance.subscription.update:${editingRecurringId}:${Date.now()}`,
          recurringId: editingRecurringId,
          amount: amountCents,
          cadence,
          nextDueAt,
          kind: "subscription",
          category: category.trim() || undefined,
          ...(selectedEnvelopeId
            ? { envelopeId: selectedEnvelopeId }
            : { clearEnvelope: true }),
          merchantHint: name.trim(),
        });
        toast.show({ variant: "success", label: "Subscription updated" });
      } else {
        await scheduleRecurringTransaction({
          idempotencyKey: `finance.subscription.create:${Date.now()}`,
          amount: amountCents,
          cadence,
          nextDueAt,
          kind: "subscription",
          category: category.trim() || undefined,
          envelopeId: selectedEnvelopeId,
          merchantHint: name.trim(),
          note: "Subscription",
        });
        toast.show({ variant: "success", label: "Subscription added" });
      }
      resetForm();
    } catch {
      toast.show({ variant: "danger", label: "Failed to save subscription" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (recurringId: string, displayName: string) => {
    setIsSubmitting(true);
    try {
      await cancelRecurringTransaction({
        idempotencyKey: `finance.subscription.archive:${recurringId}:${Date.now()}`,
        recurringId,
      });
      toast.show({ variant: "success", label: `${displayName} archived` });
      if (editingRecurringId === recurringId) {
        resetForm();
      }
    } catch {
      toast.show({ variant: "danger", label: "Failed to archive subscription" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Subscriptions</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Subscriptions are now recurring schedules tagged as subscription.
        </Text>
      </View>

      {isLoading ? (
        <View className="py-12 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading...</Text>
        </View>
      ) : (
        <>
          <View className="gap-3">
            <SectionLabel>Overview</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-4 gap-1 shadow-sm">
              <Text className="text-sm text-muted-foreground">
                Active {subscriptions.length} · Due soon {dueSoonCount}
              </Text>
              <Text className="text-xl font-medium text-foreground">
                {formatGhs(monthlyEquivalent)} / month (equivalent)
              </Text>
            </View>
          </View>

          <View className="gap-3">
            <SectionLabel>{editingRecurringId ? "Edit Subscription" : "Add Subscription"}</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
              <TextInput
                className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                placeholder="Name"
                placeholderTextColor="#6b7280"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                placeholder="Amount (e.g. 12.99)"
                placeholderTextColor="#6b7280"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
              <TextInput
                className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                placeholder="Category (optional)"
                placeholderTextColor="#6b7280"
                value={category}
                onChangeText={setCategory}
              />
              <View className="flex-row gap-2">
                {(["monthly", "biweekly", "weekly"] as const).map((value) => (
                  <Pressable
                    key={value}
                    className={`rounded-full px-4 py-2 border ${cadence === value ? "bg-warning/10 border-warning/30" : "bg-background border-border"}`}
                    onPress={() => setCadence(value)}
                  >
                    <Text className={`text-xs font-medium ${cadence === value ? "text-warning" : "text-foreground"}`}>
                      {value}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                className="bg-background border border-border rounded-xl px-3 py-2"
                onPress={() => setShowDatePicker(true)}
              >
                <Text className="text-sm text-foreground">Next due: {format(nextDueAt, "MMM d, yyyy")}</Text>
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={new Date(nextDueAt)}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_event, date) => {
                    setShowDatePicker(Platform.OS === "ios");
                    if (date) setNextDueAt(date.getTime());
                  }}
                />
              )}
              <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                Envelope
              </Text>
              <View className="flex-row flex-wrap gap-2">
                <Pressable
                  className={`rounded-full px-3 py-2 border ${!selectedEnvelopeId ? "bg-warning/10 border-warning/30" : "bg-background border-border"}`}
                  onPress={() => setSelectedEnvelopeId(undefined)}
                >
                  <Text className={`text-xs font-medium ${!selectedEnvelopeId ? "text-warning" : "text-foreground"}`}>
                    Unassigned
                  </Text>
                </Pressable>
                {(envelopes || []).map((envelope) => (
                  <Pressable
                    key={envelope.envelopeId}
                    className={`rounded-full px-3 py-2 border ${selectedEnvelopeId === envelope.envelopeId ? "bg-warning/10 border-warning/30" : "bg-background border-border"}`}
                    onPress={() => setSelectedEnvelopeId(envelope.envelopeId as Id<"envelopes">)}
                  >
                    <Text className={`text-xs font-medium ${selectedEnvelopeId === envelope.envelopeId ? "text-warning" : "text-foreground"}`}>
                      {envelope.emoji ? `${envelope.emoji} ` : ""}
                      {envelope.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View className="flex-row gap-2">
                <Button
                  label={isSubmitting ? "Saving..." : editingRecurringId ? "Save Subscription" : "Add Subscription"}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                />
                {editingRecurringId ? (
                  <Button label="Cancel" variant="ghost" onPress={resetForm} />
                ) : null}
              </View>
            </View>
          </View>

          <View className="gap-3">
            <SectionLabel>Active Subscriptions</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
              {subscriptions.length === 0 ? (
                <Text className="text-sm text-muted-foreground">No active subscriptions.</Text>
              ) : (
                subscriptions.map((item) => (
                  <View key={item.recurringId} className="border border-border rounded-xl p-3 gap-2 bg-background">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-base font-medium text-foreground">
                        {item.merchantHint || item.note || "Subscription"}
                      </Text>
                      <Text className="text-sm font-medium text-danger">{formatGhs(item.amount)}</Text>
                    </View>
                    <Text className="text-xs text-muted-foreground">
                      {item.cadence} · due {format(item.nextDueAt, "MMM d, yyyy")}
                    </Text>
                    {item.category ? (
                      <Text className="text-xs text-muted-foreground">Category: {item.category}</Text>
                    ) : null}
                    <View className="flex-row gap-2">
                      <Pressable
                        className="bg-warning/10 border border-warning/20 rounded-lg px-3 py-2"
                        onPress={() => {
                          setEditingRecurringId(item.recurringId);
                          setName(item.merchantHint || item.note || "");
                          setAmount((item.amount / 100).toString());
                          setCadence(item.cadence as SubscriptionCadence);
                          setCategory(item.category || "");
                          setNextDueAt(item.nextDueAt);
                          setSelectedEnvelopeId(item.envelopeId as Id<"envelopes"> | undefined);
                        }}
                      >
                        <Text className="text-xs font-medium text-warning">Edit</Text>
                      </Pressable>
                      <Pressable
                        className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2"
                        onPress={() =>
                          handleArchive(item.recurringId, item.merchantHint || "Subscription")
                        }
                        disabled={isSubmitting}
                      >
                        <Text className="text-xs font-medium text-danger">Archive</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}
