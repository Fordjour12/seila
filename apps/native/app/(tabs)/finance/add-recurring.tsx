import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { api } from "@seila/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import { scheduleRecurringTransactionRef } from "../../../lib/finance-refs";
import { formatGhs } from "../../../lib/ghs";
import { Button } from "../../../components/ui";
import { styles } from "../../../components/finance/routeShared";
import { Colors, Radius, Spacing, Typography } from "../../../constants/theme";

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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.title}>Add Recurring</Text>
        <Text style={styles.subtitle}>
          Create a recurring expense you can manage from the recurring screen.
        </Text>
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
              </View>
            </ScrollView>

            <Text style={styles.recurringSectionTitle}>Start Date</Text>
            <View style={styles.cadenceRow}>
              {DATE_OFFSETS.map((offset) => (
                <Pressable
                  key={offset.days}
                  style={[
                    styles.cadenceChip,
                    nextDueAt === Date.now() + offset.days * 24 * 60 * 60 * 1000 &&
                      styles.cadenceChipSelected,
                  ]}
                  onPress={() => setNextDueAt(Date.now() + offset.days * 24 * 60 * 60 * 1000)}
                >
                  <Text style={styles.cadenceChipText}>{offset.label}</Text>
                </Pressable>
              ))}
              <Pressable
                style={[styles.cadenceChip, styles.cadenceChipSelected]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.cadenceChipText}>Pick Date</Text>
              </Pressable>
            </View>

            <Button
              label={isSubmitting ? "Scheduling..." : "Schedule Recurring"}
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
});
