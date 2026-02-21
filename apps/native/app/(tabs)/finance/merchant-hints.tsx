import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { api } from "@seila/backend/convex/_generated/api";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import { merchantHintReviewRef, setMerchantEnvelopeHintRef } from "../../../lib/finance-refs";
import { SectionLabel } from "../../../components/ui";
import { confidenceLabel, styles } from "../../../components/finance/routeShared";

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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Merchant Hints</Text>
      <Text style={styles.subtitle}>Review and correct merchant-to-envelope suggestions.</Text>

      {isLoading ? (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <View style={styles.section}>
          <SectionLabel>Merchant Hint Review</SectionLabel>
          <View style={styles.recurringCard}>
            {(merchantHintReview || []).length === 0 ? (
              <Text style={styles.recurringMeta}>No merchant hints to review yet.</Text>
            ) : (
              (merchantHintReview || []).map((hint) => (
                <View key={hint.merchantKey} style={styles.hintReviewRow}>
                  <View style={styles.recurringTopRow}>
                    <View style={styles.recurringInfo}>
                      <Text style={styles.recurringTitle}>{hint.merchantKey}</Text>
                      <Text style={styles.recurringMeta}>
                        Confidence {confidenceLabel(hint.confidence)} (
                        {Math.round(hint.confidence * 100)}%) · samples {hint.sampleSize}
                      </Text>
                    </View>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.pendingEnvelopePicker}
                  >
                    {(envelopes || []).map((envelope) => {
                      const selected = envelope.envelopeId === hint.envelopeId;
                      return (
                        <Pressable
                          key={`${hint.merchantKey}:${envelope.envelopeId}`}
                          style={[
                            styles.pendingEnvelopeChip,
                            selected && styles.pendingEnvelopeChipSelected,
                            busyMerchantKey === hint.merchantKey && styles.pendingDisabled,
                          ]}
                          onPress={() =>
                            handleSetMerchantHint(hint.merchantKey, envelope.envelopeId)
                          }
                          disabled={busyMerchantKey === hint.merchantKey}
                        >
                          <Text style={styles.pendingEnvelopeChipText}>
                            {envelope.emoji ? `${envelope.emoji} ` : ""}
                            {envelope.name}
                          </Text>
                        </Pressable>
                      );
                    })}
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
