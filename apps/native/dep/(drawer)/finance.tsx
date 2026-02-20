import { api } from "@seila/backend/convex/_generated/api";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Button, Surface } from "heroui-native";
import { useMemo, useState } from "react";
import { Alert, Modal, ScrollView, Text, TextInput, View } from "react-native";

import { Container } from "@/components/container";

type EnvelopeSummary = {
  envelopeId: Id<"envelopes">;
  name: string;
  emoji?: string;
  isPrivate: boolean;
  softCeiling?: number;
  spent: number;
  utilization: number;
};

type TrendPoint = {
  weekStart: number;
  total: number;
};

type InboxTransaction = {
  _id: Id<"transactions">;
  amount: number;
  merchantHint?: string;
  note?: string;
  occurredAt: number;
};

function centsToDollars(cents: number) {
  return (cents / 100).toFixed(2);
}

function key(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

export default function FinanceScreen() {
  const envelopeSummary = useQuery(api.queries.envelopeSummary.envelopeSummary) as
    | EnvelopeSummary[]
    | undefined;
  const spendingTrend = useQuery(api.queries.spendingTrend.spendingTrend, { weeks: 8 }) as
    | TrendPoint[]
    | undefined;
  const inbox = useQuery(api.queries.transactionInbox.transactionInbox) as
    | InboxTransaction[]
    | undefined;

  const setEnvelope = useMutation(api.commands.setEnvelope.setEnvelope);
  const logTransaction = useMutation(api.commands.logTransaction.logTransaction);
  const importTransaction = useMutation(api.commands.importTransaction.importTransaction);
  const confirmImported = useMutation(
    api.commands.confirmImportedTransaction.confirmImportedTransaction,
  );
  const voidTransaction = useMutation(api.commands.voidTransaction.voidTransaction);

  const [showEnvelopeSheet, setShowEnvelopeSheet] = useState(false);
  const [showLogSheet, setShowLogSheet] = useState(false);

  const [envelopeName, setEnvelopeName] = useState("");
  const [softCeiling, setSoftCeiling] = useState("");

  const [amountInput, setAmountInput] = useState("");
  const [merchantHint, setMerchantHint] = useState("");
  const [note, setNote] = useState("");
  const [selectedEnvelope, setSelectedEnvelope] = useState<Id<"envelopes"> | undefined>(
    undefined,
  );

  const totalSpent = useMemo(
    () => (envelopeSummary ?? []).reduce((sum, envelope) => sum + envelope.spent, 0),
    [envelopeSummary],
  );

  const onSaveEnvelope = async () => {
    const name = envelopeName.trim();
    if (!name) {
      Alert.alert("Envelope name required", "Enter a name to save this envelope.");
      return;
    }

    const parsedCeiling = softCeiling.trim()
      ? Math.round(Number(softCeiling) * 100)
      : undefined;

    if (
      softCeiling.trim() &&
      (typeof parsedCeiling !== "number" ||
        !Number.isFinite(parsedCeiling) ||
        parsedCeiling <= 0)
    ) {
      Alert.alert("Invalid ceiling", "Enter a valid positive amount.");
      return;
    }

    await setEnvelope({
      idempotencyKey: key("finance.envelope"),
      name,
      softCeiling: parsedCeiling,
      isPrivate: false,
    });

    setEnvelopeName("");
    setSoftCeiling("");
    setShowEnvelopeSheet(false);
  };

  const onLogTransaction = async () => {
    const cents = Math.round(Number(amountInput) * 100);

    if (!Number.isFinite(cents) || cents <= 0) {
      Alert.alert("Invalid amount", "Enter a valid positive amount.");
      return;
    }

    await logTransaction({
      idempotencyKey: key("finance.log"),
      amount: cents,
      envelopeId: selectedEnvelope,
      source: "manual",
      merchantHint: merchantHint.trim() || undefined,
      note: note.trim() || undefined,
    });

    setAmountInput("");
    setMerchantHint("");
    setNote("");
    setSelectedEnvelope(undefined);
    setShowLogSheet(false);
  };

  const onAddImportedSample = async () => {
    await importTransaction({
      idempotencyKey: key("finance.import"),
      amount: 1899,
      merchantHint: "Sample Import",
      note: "Imported transaction",
    });
  };

  return (
    <Container className="px-4 pb-6">
      <View className="py-6 mb-4">
        <Text className="text-3xl font-semibold text-foreground tracking-tight">Finance</Text>
        <Text className="text-muted text-sm mt-1">
          Awareness over judgment. Total this month: ${centsToDollars(totalSpent)}
        </Text>
      </View>

      <Surface variant="secondary" className="p-4 rounded-xl mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-foreground font-medium">Envelopes</Text>
          <View className="flex-row gap-2">
            <Button size="sm" variant="secondary" onPress={() => setShowEnvelopeSheet(true)}>
              Add Envelope
            </Button>
            <Button size="sm" variant="primary" onPress={() => setShowLogSheet(true)}>
              Log Spend
            </Button>
          </View>
        </View>

        {!envelopeSummary || envelopeSummary.length === 0 ? (
          <Text className="text-muted text-sm">No envelopes yet. Add one to organize spending.</Text>
        ) : (
          <View className="gap-3">
            {envelopeSummary.map((envelope) => {
              const progress = Math.max(0, Math.min(envelope.utilization, 1));
              const width = `${Math.round(progress * 100)}%` as `${number}%`;

              return (
                <View key={envelope.envelopeId} className="bg-default-100 rounded-lg p-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-foreground font-medium">
                      {envelope.emoji ? `${envelope.emoji} ` : ""}
                      {envelope.name}
                    </Text>
                    <Text className="text-muted text-xs">
                      ${centsToDollars(envelope.spent)}
                      {typeof envelope.softCeiling === "number"
                        ? ` / $${centsToDollars(envelope.softCeiling)}`
                        : ""}
                    </Text>
                  </View>
                  {typeof envelope.softCeiling === "number" ? (
                    <View className="mt-2 h-2 rounded-full bg-default-300 overflow-hidden">
                      <View style={{ width }} className="h-2 bg-foreground/50" />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </Surface>

      <Surface variant="secondary" className="p-4 rounded-xl mb-4">
        <Text className="text-foreground font-medium mb-2">Spending Trend (weekly)</Text>
        {!spendingTrend || spendingTrend.length === 0 ? (
          <Text className="text-muted text-sm">No spending trend yet.</Text>
        ) : (
          <View className="gap-2">
            {spendingTrend.map((point) => (
              <View key={point.weekStart} className="flex-row items-center justify-between">
                <Text className="text-muted text-xs">
                  Week of {new Date(point.weekStart).toLocaleDateString()}
                </Text>
                <Text className="text-foreground text-sm">${centsToDollars(point.total)}</Text>
              </View>
            ))}
          </View>
        )}
      </Surface>

      <Surface variant="secondary" className="p-4 rounded-xl mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-foreground font-medium">Transaction Inbox</Text>
          <Button size="sm" variant="secondary" onPress={() => void onAddImportedSample()}>
            Add Imported Sample
          </Button>
        </View>

        {!inbox || inbox.length === 0 ? (
          <Text className="text-muted text-sm">No imported transactions waiting for confirmation.</Text>
        ) : (
          <View className="gap-3">
            {inbox.map((transaction) => (
              <View key={transaction._id} className="bg-default-100 rounded-lg p-3">
                <Text className="text-foreground font-medium">
                  {transaction.merchantHint ?? "Imported transaction"}
                </Text>
                <Text className="text-muted text-xs mt-1">
                  ${centsToDollars(transaction.amount)} · {new Date(transaction.occurredAt).toLocaleString()}
                </Text>
                <View className="flex-row gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onPress={() => {
                      void confirmImported({
                        idempotencyKey: key("finance.confirm"),
                        transactionId: transaction._id,
                        envelopeId: selectedEnvelope,
                      });
                    }}
                  >
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onPress={() => {
                      void voidTransaction({
                        idempotencyKey: key("finance.void"),
                        transactionId: transaction._id,
                      });
                    }}
                  >
                    Void
                  </Button>
                </View>
              </View>
            ))}
          </View>
        )}
      </Surface>

      <Modal visible={showEnvelopeSheet} transparent animationType="slide" onRequestClose={() => setShowEnvelopeSheet(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-2xl bg-background p-4">
            <Text className="text-foreground font-semibold text-lg mb-3">Add Envelope</Text>
            <Text className="text-muted text-xs mb-1">Name</Text>
            <TextInput
              value={envelopeName}
              onChangeText={setEnvelopeName}
              placeholder="e.g. Eating out"
              placeholderTextColor="#9CA3AF"
              style={{ borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 10, padding: 10, marginBottom: 12, color: "#111827" }}
            />
            <Text className="text-muted text-xs mb-1">Soft ceiling (optional)</Text>
            <TextInput
              value={softCeiling}
              onChangeText={setSoftCeiling}
              keyboardType="decimal-pad"
              placeholder="e.g. 200"
              placeholderTextColor="#9CA3AF"
              style={{ borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 10, padding: 10, marginBottom: 12, color: "#111827" }}
            />
            <View className="flex-row gap-2">
              <Button className="flex-1" variant="secondary" onPress={() => setShowEnvelopeSheet(false)}>
                Cancel
              </Button>
              <Button className="flex-1" variant="primary" onPress={() => void onSaveEnvelope()}>
                Save
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showLogSheet} transparent animationType="slide" onRequestClose={() => setShowLogSheet(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <ScrollView className="max-h-[80%]">
            <View className="rounded-t-2xl bg-background p-4">
              <Text className="text-foreground font-semibold text-lg mb-3">Log Transaction</Text>
              <Text className="text-muted text-xs mb-1">Amount</Text>
              <TextInput
                value={amountInput}
                onChangeText={setAmountInput}
                keyboardType="decimal-pad"
                placeholder="e.g. 18.99"
                placeholderTextColor="#9CA3AF"
                style={{ borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 10, padding: 10, marginBottom: 12, color: "#111827" }}
              />

              <Text className="text-muted text-xs mb-1">Envelope</Text>
              <View className="flex-row flex-wrap gap-2 mb-3">
                {(envelopeSummary ?? []).map((envelope) => (
                  <Button
                    key={envelope.envelopeId}
                    size="sm"
                    variant={selectedEnvelope === envelope.envelopeId ? "primary" : "secondary"}
                    onPress={() => setSelectedEnvelope(envelope.envelopeId)}
                  >
                    {envelope.name}
                  </Button>
                ))}
              </View>

              <Text className="text-muted text-xs mb-1">Merchant hint (optional)</Text>
              <TextInput
                value={merchantHint}
                onChangeText={setMerchantHint}
                placeholder="e.g. Coffee shop"
                placeholderTextColor="#9CA3AF"
                style={{ borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 10, padding: 10, marginBottom: 12, color: "#111827" }}
              />

              <Text className="text-muted text-xs mb-1">Note (optional)</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Optional context"
                placeholderTextColor="#9CA3AF"
                style={{ borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 10, padding: 10, marginBottom: 12, color: "#111827" }}
              />

              <View className="flex-row gap-2 pb-6">
                <Button className="flex-1" variant="secondary" onPress={() => setShowLogSheet(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" variant="primary" onPress={() => void onLogTransaction()}>
                  Save
                </Button>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </Container>
  );
}
