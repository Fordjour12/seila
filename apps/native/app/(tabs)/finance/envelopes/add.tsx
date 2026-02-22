import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { api } from "@seila/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { useToast } from "heroui-native";

import { AddEnvelopeSheet } from "../../../../components/finance/FinanceComponents";

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
      toast.show({ variant: "success", label: "Envelope created" });
      router.back();
    } catch {
      toast.show({ variant: "danger", label: "Failed to create envelope" });
      throw new Error("Failed to create envelope");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">New Envelope</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Create a bucket to track spending for a specific category.
        </Text>
      </View>

      <AddEnvelopeSheet onAdd={handleAddEnvelope} onClose={() => router.back()} />
    </ScrollView>
  );
}
