import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { api } from "@seila/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { useToast } from "heroui-native";

import { AddEnvelopeSheet } from "../../../components/finance/FinanceComponents";
import { styles } from "../../../components/finance/routeShared";

export default function AddEnvelopeRoute() {
  const router = useRouter();
  const { toast } = useToast();
  const setEnvelope = useMutation(api.commands.setEnvelope.setEnvelope);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleAddEnvelope = async (name: string, softCeiling?: number, emoji?: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await setEnvelope({
        idempotencyKey: `finance.envelope:${Date.now()}`,
        name,
        softCeiling,
        emoji,
      });
      toast.show({ variant: "success", label: "Envelope added" });
      router.back();
    } catch {
      toast.show({ variant: "danger", label: "Failed to add envelope" });
      throw new Error("Failed to add envelope");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.title}>Add Envelope</Text>
        <Text style={styles.subtitle}>Create a budget envelope to track category spending.</Text>
      </View>
      <View style={styles.recurringCard}>
        <AddEnvelopeSheet onAdd={handleAddEnvelope} onClose={() => router.back()} />
      </View>
    </ScrollView>
  );
}
