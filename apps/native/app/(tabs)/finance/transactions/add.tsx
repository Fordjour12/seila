import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { api } from "@seila/backend/convex/_generated/api";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import { AddTransactionSheet } from "../../../../components/finance/FinanceComponents";
import { Container } from "@/components/container";

export default function AddTransactionRoute() {
  const router = useRouter();
  const { toast } = useToast();
  const envelopes = useQuery(api.queries.envelopeSummary.envelopeSummary);
  const logTransaction = useMutation(
    api.commands.transactions.logTransaction.logTransaction,
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleAddTransaction = async (
    amount: number,
    envelopeId?: string,
    note?: string,
  ) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await logTransaction({
        idempotencyKey: `finance.transaction:${Date.now()}`,
        amount,
        source: "manual",
        envelopeId: envelopeId as Id<"envelopes"> | undefined,
        note,
      });
      toast.show({ variant: "success", label: "Transaction logged" });
      router.back();
    } catch {
      toast.show({ variant: "danger", label: "Failed to log transaction" });
      throw new Error("Failed to log transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="px-4">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">
          Log Expense
        </Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Capture a transaction and optionally assign it to an envelope.
        </Text>
      </View>

      {envelopes === undefined ? (
        <View className="py-12 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading...</Text>
        </View>
      ) : (
        <AddTransactionSheet
          onAdd={handleAddTransaction}
          onClose={() => router.back()}
          envelopes={envelopes || []}
        />
      )}
    </Container>
  );
}
