import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { api } from "@seila/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import { AddEnvelopeSheet } from "../../../components/finance/FinanceComponents";

export default function EditEnvelopeRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toast } = useToast();
  const setEnvelope = useMutation(api.commands.setEnvelope.setEnvelope);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const envelopes = useQuery(api.queries.envelopeSummary.envelopeSummary);
  const envelope = envelopes?.find((e) => e.envelopeId === id);

  const handleEditEnvelope = async (name: string, softCeiling?: number, emoji?: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await setEnvelope({
        idempotencyKey: `finance.envelope:${Date.now()}`,
        envelopeId: id as Id<"envelopes">,
        name,
        softCeiling,
        emoji,
      });
      toast.show({ variant: "success", label: "Envelope updated" });
      router.back();
    } catch {
      toast.show({ variant: "danger", label: "Failed to update envelope" });
      throw new Error("Failed to update envelope");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!envelope) {
    return (
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
        <View className="mb-2">
          <Text className="text-3xl font-serif text-foreground tracking-tight">Edit Envelope</Text>
          <Text className="text-sm text-muted-foreground mt-1">Loading...</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Edit Envelope</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Update your budget envelope details.
        </Text>
      </View>

      <AddEnvelopeSheet
        onAdd={handleEditEnvelope}
        onClose={() => router.back()}
        initialEnvelope={{
          envelopeId: id,
          name: envelope.name,
          softCeiling: envelope.softCeiling,
          emoji: envelope.emoji,
        }}
      />
    </ScrollView>
  );
}
