import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { api } from "@seila/backend/convex/_generated/api";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import { merchantHintReviewRef, setMerchantEnvelopeHintRef } from "../../../../lib/finance-refs";

export default function FinanceMerchantHintsScreen() {
  const { toast } = useToast();
  const envelopes = useQuery(api.queries.envelopeSummary.envelopeSummary);
  const merchantHintReview = useQuery(merchantHintReviewRef, { limit: 30 });
  const setMerchantEnvelopeHint = useMutation(setMerchantEnvelopeHintRef);
  const [busyMerchantKey, setBusyMerchantKey] = React.useState<string | null>(null);

  const isLoading = envelopes === undefined || merchantHintReview === undefined;

  const handleSetMerchantHint = async (merchantKey: string, envelopeId: string) => {
    setBusyMerchantKey(merchantKey);
    try {
      await setMerchantEnvelopeHint({
        idempotencyKey: `finance.merchant-hint:${merchantKey}:${Date.now()}`,
        merchantHint: merchantKey,
        envelopeId: envelopeId as Id<"envelopes">,
      });
      toast.show({ variant: "success", label: "Merchant hint updated" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to update merchant hint" });
    } finally {
      setBusyMerchantKey(null);
    }
  };

  const confidenceLabel = (confidence: number) => {
    if (confidence > 0.8) return "High";
    if (confidence > 0.5) return "Medium";
    return "Low";
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Merchant Hints</Text>
        <Text className="text-sm text-muted-foreground mt-1">Review and correct merchant-to-envelope suggestions.</Text>
      </View>

      {isLoading ? (
        <View className="py-12 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading...</Text>
        </View>
      ) : (
        <View className="gap-6">
          <Text className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold ml-1">Merchant Hint Review</Text>

          <View className="gap-4">
            {(merchantHintReview || []).length === 0 ? (
              <View className="bg-surface rounded-2xl border border-border p-8 items-center justify-center">
                <Text className="text-sm text-muted-foreground">No merchant hints to review yet.</Text>
              </View>
            ) : (
              (merchantHintReview || []).map((hint) => (
                <View key={hint.merchantKey} className="bg-surface rounded-2xl border border-border p-5 gap-4 shadow-sm">
                  <View>
                    <Text className="text-lg font-medium text-foreground">{hint.merchantKey}</Text>
                    <Text className="text-xs text-muted-foreground mt-1">
                      Confidence <Text className={hint.confidence > 0.8 ? "text-success" : hint.confidence > 0.5 ? "text-warning" : "text-danger"}>{confidenceLabel(hint.confidence)}</Text> ({Math.round(hint.confidence * 100)}%) · samples {hint.sampleSize}
                    </Text>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="flex-row"
                  >
                    <View className="flex-row gap-2">
                      {(envelopes || []).map((envelope) => {
                        const selected = envelope.envelopeId === hint.envelopeId;
                        return (
                          <Pressable
                            key={`${hint.merchantKey}:${envelope.envelopeId}`}
                            className={`rounded-full px-4 py-2 border ${selected ? "bg-warning/10 border-warning/30" : "bg-background border-border"} ${busyMerchantKey === hint.merchantKey ? "opacity-50" : ""}`}
                            onPress={() =>
                              handleSetMerchantHint(hint.merchantKey, envelope.envelopeId)
                            }
                            disabled={busyMerchantKey === hint.merchantKey}
                          >
                            <Text className={`text-xs font-medium ${selected ? "text-warning" : "text-foreground"}`}>
                              {envelope.emoji ? `${envelope.emoji} ` : ""}
                              {envelope.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              ))
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
