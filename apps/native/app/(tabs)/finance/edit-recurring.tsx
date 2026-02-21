import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { api } from "@seila/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import { recurringTransactionsRef, updateRecurringTransactionRef } from "../../../lib/finance-refs";
import { formatGhs } from "../../../lib/ghs";
import { Button } from "../../../components/ui";
import { AddEnvelopeSheet } from "../../../components/finance/FinanceComponents";
import { styles } from "../../../components/finance/routeShared";
import { Colors, Radius, Spacing, Typography } from "../../../constants/theme";

const DATE_OFFSETS = [
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "+7 days", days: 7 },
  { label: "+14 days", days: 14 },
  { label: "+30 days", days: 30 },
];

export default function EditRecurringRoute() {
  const router = useRouter();
  const { recurringId } = useLocalSearchParams<{ recurringId: string }>();
  const { toast } = useToast();

  const recurringTransactions = useQuery(recurringTransactionsRef, { limit: 50 });
  const envelopes = useQuery(api.queries.envelopeSummary.envelopeSummary);
  const updateRecurringTransaction = useMutation(updateRecurringTransactionRef);
  const setEnvelope = useMutation(api.commands.setEnvelope.setEnvelope);

  const existingRecurring = React.useMemo(
    () => recurringTransactions?.find((r) => r.recurringId === recurringId),
    [recurringTransactions, recurringId],
  );

  const transactions = useQuery(api.queries.transactionInbox.transactionInbox, {
    pendingOnly: false,
    limit: 30,
  });

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
  const [selectedDueDate, setSelectedDueDate] = React.useState<number>(Date.now());
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showEnvelopeSheet, setShowEnvelopeSheet] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (existingRecurring) {
      setSelectedAmount(existingRecurring.amount);
      setSelectedMerchant(existingRecurring.merchantHint || "");
      setMerchantInput(existingRecurring.merchantHint || "");
      setCadence(existingRecurring.cadence);
      setSelectedEnvelopeId(existingRecurring.envelopeId);
      setSelectedDueDate(existingRecurring.nextDueAt);
    }
  }, [existingRecurring]);

  React.useEffect(() => {
    if (!selectedMerchant && recentMerchants[0]) {
      setSelectedMerchant(recentMerchants[0]);
    }
  }, [recentMerchants, selectedMerchant]);

  const resolvedAmount = customAmount ? Math.round(parseFloat(customAmount) * 100) : selectedAmount;
  const resolvedMerchant = merchantInput.trim() || selectedMerchant || "General expense";
  const isLoading =
    transactions === undefined || envelopes === undefined || recurringTransactions === undefined;

  const handleUpdate = async () => {
    if (!existingRecurring) {
      toast.show({ variant: "danger", label: "Recurring not found" });
      return;
    }

    if (!Number.isInteger(resolvedAmount) || resolvedAmount <= 0) {
      toast.show({ variant: "warning", label: "Enter a valid amount" });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updateRecurringTransaction({
        idempotencyKey: `finance.recurring.update:${recurringId}:${Date.now()}`,
        recurringId,
        cadence,
        nextDueAt: selectedDueDate,
        envelopeId: selectedEnvelopeId as Id<"envelopes"> | undefined,
      });
      toast.show({ variant: "success", label: "Recurring updated" });
      router.back();
    } catch {
      toast.show({ variant: "danger", label: "Failed to update recurring" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateEnvelope = async (name: string, softCeiling?: number, emoji?: string) => {
    try {
      const result = await setEnvelope({
        idempotencyKey: `finance.envelope:${Date.now()}`,
        name,
        softCeiling,
        emoji,
      });
      if (result?.envelopeId) {
        setSelectedEnvelopeId(result.envelopeId);
        toast.show({ variant: "success", label: "Envelope created" });
      }
    } catch {
      toast.show({ variant: "danger", label: "Failed to create envelope" });
      throw new Error("Failed to create envelope");
    }
  };

  if (!existingRecurring && recurringTransactions !== undefined) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.title}>Not Found</Text>
          <Text style={styles.subtitle}>This recurring transaction could not be found.</Text>
        </View>
        <Button label="Go Back" onPress={() => router.back()} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.title}>Edit Recurring</Text>
        <Text style={styles.subtitle}>Update your recurring expense details.</Text>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <View style={styles.recurringCard}>
          <View style={styles.recurringForm}>
            <Text style={styles.recurringSectionTitle}>Amount Presets</Text>
            <View style={styles.chipRow}>
              {amountPresets.map((amountPreset) => (
                <Pressable
                  key={amountPreset}
                  style={[
                    styles.cadenceChip,
                    !customAmount && selectedAmount === amountPreset && styles.cadenceChipSelected,
                  ]}
                  onPress={() => {
                    setCustomAmount("");
                    setSelectedAmount(amountPreset);
                  }}
                >
                  <Text style={styles.cadenceChipText}>{formatGhs(amountPreset)}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.recurringSectionTitle}>Custom Amount (GHS)</Text>
            <TextInput
              style={localStyles.input}
              value={customAmount}
              onChangeText={setCustomAmount}
              keyboardType="decimal-pad"
              placeholder="Optional (e.g. 45.00)"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.recurringSectionTitle}>Merchant Presets</Text>
            <View style={styles.chipRow}>
              {(recentMerchants.length ? recentMerchants : ["General expense"]).map((merchant) => (
                <Pressable
                  key={merchant}
                  style={[
                    styles.cadenceChip,
                    !merchantInput.trim() &&
                      selectedMerchant === merchant &&
                      styles.cadenceChipSelected,
                  ]}
                  onPress={() => {
                    setMerchantInput("");
                    setSelectedMerchant(merchant);
                  }}
                >
                  <Text style={styles.cadenceChipText}>{merchant}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.recurringSectionTitle}>Custom Merchant</Text>
            <TextInput
              style={localStyles.input}
              value={merchantInput}
              onChangeText={setMerchantInput}
              placeholder="Optional (e.g. Netflix, Gym)"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.recurringSectionTitle}>Cadence</Text>
            <View style={styles.cadenceRow}>
              {(["weekly", "biweekly", "monthly"] as const).map((cadenceOption) => (
                <Pressable
                  key={cadenceOption}
                  style={[
                    styles.cadenceChip,
                    cadence === cadenceOption && styles.cadenceChipSelected,
                  ]}
                  onPress={() => setCadence(cadenceOption)}
                >
                  <Text style={styles.cadenceChipText}>{cadenceOption}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.recurringSectionTitle}>Envelope (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={localStyles.envelopeRow}>
                <Pressable
                  style={[
                    styles.pendingEnvelopeChip,
                    !selectedEnvelopeId && styles.pendingEnvelopeChipSelected,
                  ]}
                  onPress={() => setSelectedEnvelopeId(undefined)}
                >
                  <Text style={styles.pendingEnvelopeChipText}>Unassigned</Text>
                </Pressable>
                {(envelopes || []).map((envelope) => (
                  <Pressable
                    key={envelope.envelopeId}
                    style={[
                      styles.pendingEnvelopeChip,
                      selectedEnvelopeId === envelope.envelopeId &&
                        styles.pendingEnvelopeChipSelected,
                    ]}
                    onPress={() => setSelectedEnvelopeId(envelope.envelopeId)}
                  >
                    <Text style={styles.pendingEnvelopeChipText}>
                      {envelope.emoji ? `${envelope.emoji} ` : ""}
                      {envelope.name}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  style={[styles.pendingEnvelopeChip, styles.pendingEnvelopeChipSelected]}
                  onPress={() => setShowEnvelopeSheet(true)}
                >
                  <Text style={styles.pendingEnvelopeChipText}>+ Create New</Text>
                </Pressable>
              </View>
            </ScrollView>

            <Text style={styles.recurringSectionTitle}>Next Due Date</Text>
            <Text style={localStyles.currentDate}>
              Current: {format(selectedDueDate, "MMM d, yyyy")}
            </Text>
            <View style={styles.cadenceRow}>
              {DATE_OFFSETS.map((offset) => (
                <Pressable
                  key={offset.days}
                  style={[
                    styles.cadenceChip,
                    selectedDueDate === Date.now() + offset.days * 24 * 60 * 60 * 1000 &&
                      styles.cadenceChipSelected,
                  ]}
                  onPress={() => setSelectedDueDate(Date.now() + offset.days * 24 * 60 * 60 * 1000)}
                >
                  <Text style={styles.cadenceChipText}>{offset.label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={localStyles.customDateButton} onPress={() => setShowDatePicker(true)}>
              <Text style={localStyles.customDateText}>Pick Date...</Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={new Date(selectedDueDate)}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_event, date) => {
                  setShowDatePicker(Platform.OS === "ios");
                  if (date) {
                    setSelectedDueDate(date.getTime());
                  }
                }}
              />
            )}

            <Button
              label={isSubmitting ? "Saving..." : "Save Changes"}
              onPress={handleUpdate}
              disabled={isSubmitting}
            />
            <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
          </View>
        </View>
      )}
      {showEnvelopeSheet && (
        <AddEnvelopeSheet
          onAdd={async (name, softCeiling, emoji) => {
            await handleCreateEnvelope(name, softCeiling, emoji);
            setShowEnvelopeSheet(false);
          }}
          onClose={() => setShowEnvelopeSheet(false)}
        />
      )}
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  input: {
    ...Typography.bodySM,
    color: Colors.textPrimary,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  envelopeRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  currentDate: {
    ...Typography.bodySM,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  customDateButton: {
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  customDateText: {
    ...Typography.bodySM,
    color: Colors.textPrimary,
  },
});
