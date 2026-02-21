import React from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { api } from "@seila/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import { scheduleRecurringTransactionRef } from "../../../lib/finance-refs";
import { formatGhs } from "../../../lib/ghs";
import { Button } from "../../../components/ui";

const DATE_OFFSETS = [
  { label: "Tomorrow", days: 1 },
  { label: "+7 days", days: 7 },
  { label: "+14 days", days: 14 },
  { label: "+30 days", days: 30 },
];

export default function AddRecurringRoute() {
  const router = useRouter();
  const { toast } = useToast();
  const transactions = useQuery(api.queries.transactionInbox.transactionInbox, {
    pendingOnly: false,
    limit: 30,
  });
  const envelopes = useQuery(api.queries.envelopeSummary.envelopeSummary);
  const scheduleRecurringTransaction = useMutation(scheduleRecurringTransactionRef);

  const amountPresets = React.useMemo(() => [1000, 2500, 5000, 10000], []);
  const recentMerchants = React.useMemo(
    () =>
      Array.from(
        new Set(
          (transactions || [])
            .map((transaction) => (transaction.merchantHint || transaction.note || "").trim())
            .filter(Boolean),
        ),
      ).slice(0, 8),
    [transactions],
  );

  const [selectedAmount, setSelectedAmount] = React.useState<number>(amountPresets[1] || 2500);
  const [customAmount, setCustomAmount] = React.useState("");
  const [selectedMerchant, setSelectedMerchant] = React.useState("");
  const [merchantInput, setMerchantInput] = React.useState("");
  const [cadence, setCadence] = React.useState<"weekly" | "biweekly" | "monthly">("monthly");
  const [selectedEnvelopeId, setSelectedEnvelopeId] = React.useState<string | undefined>();
  const [nextDueAt, setNextDueAt] = React.useState<number>(Date.now() + 24 * 60 * 60 * 1000);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!selectedMerchant && recentMerchants[0]) {
      setSelectedMerchant(recentMerchants[0]);
    }
  }, [recentMerchants, selectedMerchant]);

  const resolvedAmount = customAmount ? Math.round(parseFloat(customAmount) * 100) : selectedAmount;
  const resolvedMerchant = merchantInput.trim() || selectedMerchant || "General expense";
  const isLoading = transactions === undefined || envelopes === undefined;

  const handleCreate = async () => {
    if (!Number.isInteger(resolvedAmount) || resolvedAmount <= 0) {
      toast.show({ variant: "warning", label: "Enter a valid amount" });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await scheduleRecurringTransaction({
        idempotencyKey: `finance.recurring:${Date.now()}`,
        amount: resolvedAmount,
        cadence,
        nextDueAt,
        merchantHint: resolvedMerchant,
        envelopeId: selectedEnvelopeId as Id<"envelopes"> | undefined,
      });
      toast.show({ variant: "success", label: "Recurring transaction scheduled" });
      router.back();
    } catch {
      toast.show({ variant: "danger", label: "Failed to schedule recurring transaction" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="gap-3">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Add Recurring</Text>
        <Text className="text-base text-muted-foreground">
          Create a recurring expense you can manage from the recurring screen.
        </Text>
      </View>

      {isLoading ? (
        <View className="py-12 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading...</Text>
        </View>
      ) : (
        <View className="bg-surface rounded-2xl border border-border p-5 gap-6">
          <View className="gap-4">
            <Text className="text-sm font-medium text-foreground">Amount Presets</Text>
            <View className="flex-row flex-wrap gap-2">
              {amountPresets.map((amountPreset) => (
                <Pressable
                  key={amountPreset}
                  className={`px-3 py-2 rounded-lg border ${
                    !customAmount && selectedAmount === amountPreset
                      ? "bg-warning/10 border-warning/20"
                      : "bg-background border-border"
                  }`}
                  onPress={() => {
                    setCustomAmount("");
                    setSelectedAmount(amountPreset);
                  }}
                >
                  <Text
                    className={`text-sm font-medium ${
                      !customAmount && selectedAmount === amountPreset
                        ? "text-warning"
                        : "text-foreground"
                    }`}
                  >
                    {formatGhs(amountPreset)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Custom Amount (GHS)</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              value={customAmount}
              onChangeText={setCustomAmount}
              keyboardType="decimal-pad"
              placeholder="Optional (e.g. 45.00)"
              placeholderTextColor="#6b7280"
            />
          </View>

          <View className="gap-4">
            <Text className="text-sm font-medium text-foreground">Merchant Presets</Text>
            <View className="flex-row flex-wrap gap-2">
              {(recentMerchants.length ? recentMerchants : ["General expense"]).map((merchant) => (
                <Pressable
                  key={merchant}
                  className={`px-3 py-2 rounded-lg border ${
                    !merchantInput.trim() && selectedMerchant === merchant
                      ? "bg-warning/10 border-warning/20"
                      : "bg-background border-border"
                  }`}
                  onPress={() => {
                    setMerchantInput("");
                    setSelectedMerchant(merchant);
                  }}
                >
                  <Text
                    className={`text-sm font-medium ${
                      !merchantInput.trim() && selectedMerchant === merchant
                        ? "text-warning"
                        : "text-foreground"
                    }`}
                  >
                    {merchant}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Custom Merchant</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              value={merchantInput}
              onChangeText={setMerchantInput}
              placeholder="Optional (e.g. Netflix, Gym)"
              placeholderTextColor="#6b7280"
            />
          </View>

          <View className="gap-4">
            <Text className="text-sm font-medium text-foreground">Cadence</Text>
            <View className="flex-row flex-wrap gap-2">
              {(["weekly", "biweekly", "monthly"] as const).map((cadenceOption) => (
                <Pressable
                  key={cadenceOption}
                  className={`px-3 py-2 rounded-lg border ${
                    cadence === cadenceOption
                      ? "bg-warning/10 border-warning/20"
                      : "bg-background border-border"
                  }`}
                  onPress={() => setCadence(cadenceOption)}
                >
                  <Text
                    className={`text-sm font-medium ${
                      cadence === cadenceOption ? "text-warning" : "text-foreground"
                    }`}
                  >
                    {cadenceOption}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="gap-4">
            <Text className="text-sm font-medium text-foreground">Envelope (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-1">
                <Pressable
                  className={`px-3 py-2 rounded-lg border ${
                    !selectedEnvelopeId ? "bg-warning/10 border-warning/20" : "bg-background border-border"
                  }`}
                  onPress={() => setSelectedEnvelopeId(undefined)}
                >
                  <Text
                    className={`text-sm font-medium ${
                      !selectedEnvelopeId ? "text-warning" : "text-foreground"
                    }`}
                  >
                    Unassigned
                  </Text>
                </Pressable>
                {(envelopes || []).map((envelope) => (
                  <Pressable
                    key={envelope.envelopeId}
                    className={`px-3 py-2 rounded-lg border ${
                      selectedEnvelopeId === envelope.envelopeId
                        ? "bg-warning/10 border-warning/20"
                        : "bg-background border-border"
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
              </View>
            </ScrollView>
          </View>

          <View className="gap-4">
            <Text className="text-sm font-medium text-foreground">Start Date</Text>
            <View className="flex-row flex-wrap gap-2">
              {DATE_OFFSETS.map((offset) => (
                <Pressable
                  key={offset.days}
                  className={`px-3 py-2 rounded-lg border ${
                    nextDueAt === Date.now() + offset.days * 24 * 60 * 60 * 1000
                      ? "bg-warning/10 border-warning/20"
                      : "bg-background border-border"
                  }`}
                  onPress={() => setNextDueAt(Date.now() + offset.days * 24 * 60 * 60 * 1000)}
                >
                  <Text
                    className={`text-sm font-medium ${
                      nextDueAt === Date.now() + offset.days * 24 * 60 * 60 * 1000
                        ? "text-warning"
                        : "text-foreground"
                    }`}
                  >
                    {offset.label}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                className="px-3 py-2 rounded-lg border bg-warning/10 border-warning/20"
                onPress={() => setShowDatePicker(true)}
              >
                <Text className="text-sm font-medium text-warning">Pick Date</Text>
              </Pressable>
            </View>
          </View>

          <View className="gap-3 pt-2">
            <Button
              label={isSubmitting ? "Scheduling..." : "Schedule Recurring"}
              variant="primary"
              onPress={handleCreate}
              disabled={isSubmitting}
            />
            <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
          </View>
        </View>
      )}
      {showDatePicker && (
        <DateTimePicker
          value={new Date(nextDueAt)}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_event, date) => {
            setShowDatePicker(Platform.OS === "ios");
            if (date) {
              setNextDueAt(date.getTime());
            }
          }}
        />
      )}
    </ScrollView>
  );
}
