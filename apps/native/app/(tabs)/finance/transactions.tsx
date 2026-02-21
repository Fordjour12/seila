import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { api } from "@seila/backend/convex/_generated/api";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import {
  attachReceiptRef,
  bulkUpdateTransactionsRef,
  merchantEnvelopeHintsRef,
  setTransactionTagsRef,
  transactionSearchRef,
} from "../../../lib/finance-refs";
import { formatGhs } from "../../../lib/ghs";
import { TransactionsList } from "../../../components/finance/FinanceComponents";
import { Button, SectionLabel } from "../../../components/ui";
import { normalizeMerchant, styles } from "../../../components/finance/routeShared";

export default function FinanceTransactionsScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const envelopes = useQuery(api.queries.envelopeSummary.envelopeSummary);
  const transactions = useQuery(api.queries.transactionInbox.transactionInbox, {
    pendingOnly: false,
    limit: 30,
  });
  const pendingTransactions = useQuery(api.queries.transactionInbox.transactionInbox, {
    pendingOnly: true,
    limit: 20,
  });
  const transactionSearch = useQuery(transactionSearchRef, {
    includeVoided: false,
    limit: 50,
  });
  const pendingMerchantHints = useQuery(merchantEnvelopeHintsRef, {
    merchantHints: (pendingTransactions || [])
      .map((transaction) => normalizeMerchant(transaction.merchantHint || transaction.note))
      .filter(Boolean),
  });

  const confirmImportedTransaction = useMutation(
    api.commands.confirmImportedTransaction.confirmImportedTransaction,
  );
  const voidTransaction = useMutation(api.commands.voidTransaction.voidTransaction);
  const bulkUpdateTransactions = useMutation(bulkUpdateTransactionsRef);
  const attachReceipt = useMutation(attachReceiptRef);
  const setTransactionTags = useMutation(setTransactionTagsRef);

  const [busyTransactionId, setBusyTransactionId] = React.useState<Id<"transactions"> | null>(null);
  const [selectedTransactionIds, setSelectedTransactionIds] = React.useState<Id<"transactions">[]>(
    [],
  );
  const [isBulkApplying, setIsBulkApplying] = React.useState(false);
  const [pendingEnvelopeByTransaction, setPendingEnvelopeByTransaction] = React.useState<
    Record<string, Id<"envelopes"> | null | undefined>
  >({});

  const isLoading =
    envelopes === undefined ||
    transactions === undefined ||
    pendingTransactions === undefined ||
    transactionSearch === undefined ||
    pendingMerchantHints === undefined;

  const fallbackSuggestionsFromRecent = React.useMemo(() => {
    const suggestions = new Map<string, Id<"envelopes">>();
    for (const transaction of transactions || []) {
      const merchantKey = normalizeMerchant(transaction.merchantHint || transaction.note);
      if (!merchantKey || !transaction.envelopeId || suggestions.has(merchantKey)) {
        continue;
      }
      suggestions.set(merchantKey, transaction.envelopeId);
    }
    return suggestions;
  }, [transactions]);

  const suggestedEnvelopeByMerchant = React.useMemo(() => {
    const suggestions = new Map<string, Id<"envelopes">>();

    for (const hint of pendingMerchantHints || []) {
      suggestions.set(hint.merchantKey, hint.envelopeId as Id<"envelopes">);
    }

    for (const [merchantKey, envelopeId] of fallbackSuggestionsFromRecent.entries()) {
      if (!suggestions.has(merchantKey)) {
        suggestions.set(merchantKey, envelopeId);
      }
    }

    return suggestions;
  }, [pendingMerchantHints, fallbackSuggestionsFromRecent]);

  const getEffectiveEnvelopeId = (transaction: {
    _id: Id<"transactions">;
    merchantHint?: string;
    note?: string;
  }) => {
    const manualChoice = pendingEnvelopeByTransaction[transaction._id];
    if (manualChoice !== undefined) {
      return manualChoice ?? undefined;
    }

    const merchantKey = normalizeMerchant(transaction.merchantHint || transaction.note);
    return merchantKey ? suggestedEnvelopeByMerchant.get(merchantKey) : undefined;
  };

  const handleConfirmImport = async (transaction: {
    _id: Id<"transactions">;
    merchantHint?: string;
    note?: string;
  }) => {
    const selectedEnvelopeId = getEffectiveEnvelopeId(transaction);
    const transactionId = transaction._id;
    setBusyTransactionId(transactionId);
    try {
      await confirmImportedTransaction({
        idempotencyKey: `finance.confirm:${transactionId}:${Date.now()}`,
        transactionId,
        envelopeId: selectedEnvelopeId,
      });
      toast.show({ variant: "success", label: "Transaction confirmed" });
      setPendingEnvelopeByTransaction((current) => {
        const next = { ...current };
        delete next[transactionId];
        return next;
      });
    } catch {
      toast.show({ variant: "danger", label: "Failed to confirm transaction" });
    } finally {
      setBusyTransactionId(null);
    }
  };

  const handleVoidImport = async (transactionId: Id<"transactions">) => {
    setBusyTransactionId(transactionId);
    try {
      await voidTransaction({
        idempotencyKey: `finance.void:${transactionId}:${Date.now()}`,
        transactionId,
      });
      toast.show({ variant: "success", label: "Transaction voided" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to void transaction" });
    } finally {
      setBusyTransactionId(null);
    }
  };

  const handleApplySuggestedToAll = () => {
    setPendingEnvelopeByTransaction((current) => {
      const next = { ...current };
      for (const transaction of pendingTransactions || []) {
        const merchantKey = normalizeMerchant(transaction.merchantHint || transaction.note);
        const suggestedEnvelopeId = merchantKey
          ? suggestedEnvelopeByMerchant.get(merchantKey)
          : undefined;
        const currentChoice = current[transaction._id];

        if (currentChoice === undefined && suggestedEnvelopeId) {
          next[transaction._id] = suggestedEnvelopeId;
        }
      }
      return next;
    });
    toast.show({ variant: "success", label: "Applied suggested envelopes" });
  };

  const toggleTransactionSelection = (transactionId: Id<"transactions">) => {
    setSelectedTransactionIds((current) =>
      current.includes(transactionId)
        ? current.filter((id) => id !== transactionId)
        : [...current, transactionId],
    );
  };

  const handleBulkVoid = async () => {
    if (!selectedTransactionIds.length) return;
    setIsBulkApplying(true);
    try {
      const result = await bulkUpdateTransactions({
        idempotencyKey: `finance.bulk.void:${Date.now()}`,
        action: "void",
        transactionIds: selectedTransactionIds,
      });
      toast.show({ variant: "success", label: `Voided ${result.updated} transactions` });
      setSelectedTransactionIds([]);
    } catch {
      toast.show({ variant: "danger", label: "Failed bulk void" });
    } finally {
      setIsBulkApplying(false);
    }
  };

  const handleBulkAssignFirstEnvelope = async () => {
    if (!selectedTransactionIds.length || !(envelopes || [])[0]) return;
    setIsBulkApplying(true);
    try {
      const firstEnvelope = (envelopes || [])[0];
      const result = await bulkUpdateTransactions({
        idempotencyKey: `finance.bulk.assign:${Date.now()}`,
        action: "assign_envelope",
        envelopeId: firstEnvelope.envelopeId as Id<"envelopes">,
        transactionIds: selectedTransactionIds,
      });
      toast.show({ variant: "success", label: `Assigned ${result.updated} transactions` });
      setSelectedTransactionIds([]);
    } catch {
      toast.show({ variant: "danger", label: "Failed bulk assign" });
    } finally {
      setIsBulkApplying(false);
    }
  };

  const handleTagTransaction = async (transactionId: Id<"transactions">, tag: string) => {
    try {
      await setTransactionTags({
        idempotencyKey: `finance.tags:${transactionId}:${Date.now()}`,
        transactionId,
        tags: [tag],
      });
      toast.show({ variant: "success", label: `Tagged as ${tag}` });
    } catch {
      toast.show({ variant: "danger", label: "Failed to set tag" });
    }
  };

  const handleAttachReceiptStub = async (transactionId: Id<"transactions">) => {
    try {
      await attachReceipt({
        idempotencyKey: `finance.receipt.stub:${transactionId}:${Date.now()}`,
        transactionId,
        storageId: `manual-receipt:${Date.now()}`,
        fileName: "manual-receipt",
      });
      toast.show({ variant: "success", label: "Receipt marker attached" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to attach receipt marker" });
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Transactions</Text>
      <Text style={styles.subtitle}>Handle imports, search, and apply bulk actions.</Text>

      {isLoading ? (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <Button
              label="Log Transaction"
              onPress={() => router.push("/(tabs)/finance/add-transaction")}
            />
          </View>
          {(pendingTransactions || []).length > 0 ? (
            <View style={styles.section}>
              <View style={styles.pendingHeaderRow}>
                <SectionLabel>Pending Imports</SectionLabel>
                <Pressable style={styles.applySuggestedButton} onPress={handleApplySuggestedToAll}>
                  <Text style={styles.applySuggestedText}>Apply Suggested</Text>
                </Pressable>
              </View>
              <View style={styles.pendingCard}>
                {(pendingTransactions || []).map((transaction) => {
                  const isBusy = busyTransactionId === transaction._id;
                  const manualChoice = pendingEnvelopeByTransaction[transaction._id];
                  const selectedEnvelopeId = getEffectiveEnvelopeId(transaction);
                  const selectedEnvelope = (envelopes || []).find(
                    (envelope) => envelope.envelopeId === selectedEnvelopeId,
                  );
                  const isSuggested = manualChoice === undefined && Boolean(selectedEnvelopeId);

                  return (
                    <View key={transaction._id} style={styles.pendingRow}>
                      <View style={styles.pendingInfo}>
                        <Text style={styles.pendingMerchant}>
                          {transaction.merchantHint || transaction.note || "Imported transaction"}
                        </Text>
                        <View style={styles.pendingMetaRow}>
                          <Text style={styles.pendingAmount}>{formatGhs(transaction.amount)}</Text>
                          {isSuggested && selectedEnvelope ? (
                            <Text style={styles.pendingSuggestedText}>
                              Suggested:{" "}
                              {selectedEnvelope.emoji ? `${selectedEnvelope.emoji} ` : ""}
                              {selectedEnvelope.name}
                            </Text>
                          ) : null}
                        </View>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.pendingEnvelopePicker}
                        >
                          <Pressable
                            style={[
                              styles.pendingEnvelopeChip,
                              manualChoice === null && styles.pendingEnvelopeChipSelected,
                            ]}
                            onPress={() =>
                              setPendingEnvelopeByTransaction((current) => ({
                                ...current,
                                [transaction._id]: null,
                              }))
                            }
                          >
                            <Text style={styles.pendingEnvelopeChipText}>Unassigned</Text>
                          </Pressable>
                          {(envelopes || []).map((envelope) => (
                            <Pressable
                              key={`${transaction._id}:${envelope.envelopeId}`}
                              style={[
                                styles.pendingEnvelopeChip,
                                selectedEnvelopeId === envelope.envelopeId &&
                                  styles.pendingEnvelopeChipSelected,
                              ]}
                              onPress={() =>
                                setPendingEnvelopeByTransaction((current) => ({
                                  ...current,
                                  [transaction._id]: envelope.envelopeId as Id<"envelopes">,
                                }))
                              }
                            >
                              <Text style={styles.pendingEnvelopeChipText}>
                                {envelope.emoji ? `${envelope.emoji} ` : ""}
                                {envelope.name}
                              </Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                      </View>
                      <View style={styles.pendingActions}>
                        <Pressable
                          style={[
                            styles.pendingActionButton,
                            styles.pendingVoidButton,
                            isBusy && styles.pendingDisabled,
                          ]}
                          onPress={() => handleVoidImport(transaction._id)}
                          disabled={isBusy}
                        >
                          <Text style={styles.pendingVoidText}>Void</Text>
                        </Pressable>
                        <Pressable
                          style={[
                            styles.pendingActionButton,
                            styles.pendingConfirmButton,
                            isBusy && styles.pendingDisabled,
                          ]}
                          onPress={() => handleConfirmImport(transaction)}
                          disabled={isBusy}
                        >
                          <Text style={styles.pendingConfirmText}>
                            {isBusy ? "..." : "Confirm"}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionLabel>Recent Transactions</SectionLabel>
            <TransactionsList transactions={(transactions || []).slice(0, 10)} />
          </View>

          <View style={styles.section}>
            <SectionLabel>Search & Bulk Edit</SectionLabel>
            <View style={styles.recurringCard}>
              <View style={styles.chipRow}>
                <Pressable style={styles.cadenceChip}>
                  <Text style={styles.cadenceChipText}>
                    Showing {Math.min((transactionSearch || []).length, 20)} results
                  </Text>
                </Pressable>
              </View>
              {(transactionSearch || []).slice(0, 20).map((transaction) => {
                const selected = selectedTransactionIds.includes(transaction._id);
                return (
                  <Pressable
                    key={`search:${transaction._id}`}
                    style={[styles.searchRow, selected && styles.pendingEnvelopeChipSelected]}
                    onPress={() => toggleTransactionSelection(transaction._id)}
                  >
                    <View style={styles.recurringInfo}>
                      <Text style={styles.recurringTitle}>
                        {transaction.merchantHint || transaction.note || "Expense"}
                      </Text>
                      <Text style={styles.recurringMeta}>{formatGhs(transaction.amount)}</Text>
                    </View>
                    <Pressable
                      style={styles.pendingActionButton}
                      onPress={() => handleAttachReceiptStub(transaction._id)}
                    >
                      <Text style={styles.pendingVoidText}>Receipt</Text>
                    </Pressable>
                    <Pressable
                      style={styles.pendingActionButton}
                      onPress={() => handleTagTransaction(transaction._id, "review")}
                    >
                      <Text style={styles.pendingVoidText}>Tag</Text>
                    </Pressable>
                  </Pressable>
                );
              })}
              {selectedTransactionIds.length > 0 ? (
                <View style={styles.recurringActions}>
                  <Pressable
                    style={[
                      styles.pendingActionButton,
                      styles.pendingVoidButton,
                      isBulkApplying && styles.pendingDisabled,
                    ]}
                    onPress={handleBulkVoid}
                    disabled={isBulkApplying}
                  >
                    <Text style={styles.pendingVoidText}>Void Selected</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.pendingActionButton,
                      styles.pendingConfirmButton,
                      isBulkApplying && styles.pendingDisabled,
                    ]}
                    onPress={handleBulkAssignFirstEnvelope}
                    disabled={isBulkApplying}
                  >
                    <Text style={styles.pendingConfirmText}>Assign First Envelope</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}
