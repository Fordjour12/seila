import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { api } from "@seila/backend/convex/_generated/api";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import { AddTransactionSheet } from "../../../components/finance/FinanceComponents";
import { styles } from "../../../components/finance/routeShared";

export default function AddTransactionRoute() {
  const router = useRouter();
  const { toast } = useToast();
  const envelopes = useQuery(api.queries.envelopeSummary.envelopeSummary);
  const logTransaction = useMutation(api.commands.logTransaction.logTransaction);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleAddTransaction = async (amount: number, envelopeId?: string, note?: string) => {
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.title}>Log Expense</Text>
        <Text style={styles.subtitle}>
          Capture a transaction and optionally assign it to an envelope.
        </Text>
      </View>

      {envelopes === undefined ? (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <View style={styles.recurringCard}>
          <AddTransactionSheet
            onAdd={handleAddTransaction}
            onClose={() => router.back()}
            envelopes={envelopes || []}
          />
        </View>
      )}
    </ScrollView>
  );
}
