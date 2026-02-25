import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "@seila/backend/convex/_generated/api";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import { transactionByIdRef, updateTransactionRef } from "../../../../lib/finance-refs";
import { Button, SectionLabel } from "../../../../components/ui";

export default function EditTransactionRoute() {
  const router = useRouter();
  const { toast } = useToast();
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>();

  const transaction = useQuery(
    transactionByIdRef,
    transactionId ? { transactionId: transactionId as Id<"transactions"> } : "skip",
  );
  const envelopes = useQuery(api.queries.envelopeSummary.envelopeSummary);
  const updateTransaction = useMutation(updateTransactionRef);

  const [amount, setAmount] = React.useState("");
  const [merchantHint, setMerchantHint] = React.useState("");
  const [note, setNote] = React.useState("");
  const [selectedEnvelopeId, setSelectedEnvelopeId] = React.useState<Id<"envelopes"> | undefined>();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!transaction) return;
    setAmount((transaction.amount / 100).toString());
    setMerchantHint(transaction.merchantHint || "");
    setNote(transaction.note || "");
    setSelectedEnvelopeId(transaction.envelopeId as Id<"envelopes"> | undefined);
  }, [transaction]);

  const isLoading = transaction === undefined || envelopes === undefined;

  const handleSave = async () => {
    if (!transactionId || !transaction) return;
    const amountCents = Math.round(parseFloat(amount) * 100);
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      toast.show({ variant: "warning", label: "Enter a valid amount" });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTransaction({
        idempotencyKey: `finance.transaction.update:${transactionId}:${Date.now()}`,
        transactionId: transactionId as Id<"transactions">,
        amount: amountCents,
        ...(selectedEnvelopeId ? { envelopeId: selectedEnvelopeId } : { clearEnvelope: true }),
        merchantHint,
        note,
      });
      toast.show({ variant: "success", label: "Transaction updated" });
      router.back();
    } catch {
      toast.show({ variant: "danger", label: "Failed to update transaction" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!transactionId) {
    return (
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
        <Text className="text-base text-danger">Transaction id is missing.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Edit Transaction</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Update amount, merchant details, and envelope assignment.
        </Text>
      </View>

      {isLoading ? (
        <View className="py-12 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading...</Text>
        </View>
      ) : (
        <>
          <View className="gap-3">
            <SectionLabel>Details</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
              <TextInput
                className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                placeholder="Amount (e.g. 45.50)"
                placeholderTextColor="#6b7280"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
              <TextInput
                className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                placeholder="Merchant (optional)"
                placeholderTextColor="#6b7280"
                value={merchantHint}
                onChangeText={setMerchantHint}
              />
              <TextInput
                className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                placeholder="Note (optional)"
                placeholderTextColor="#6b7280"
                value={note}
                onChangeText={setNote}
                multiline
              />
            </View>
          </View>

          <View className="gap-3">
            <SectionLabel>Envelope</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-4 gap-2 shadow-sm">
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
            </View>
          </View>

          <View className="gap-2">
            <Button
              label={isSubmitting ? "Saving..." : "Save Changes"}
              onPress={handleSave}
              disabled={isSubmitting}
            />
            <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
          </View>
        </>
      )}
    </ScrollView>
  );
}
