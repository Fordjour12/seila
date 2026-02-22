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
} from "../../../../lib/finance-refs";
import { formatGhs } from "../../../../lib/ghs";
import { TransactionsList } from "../../../../components/finance/FinanceComponents";
import { Button, SectionLabel } from "../../../../components/ui";
import { normalizeMerchant } from "../../../../components/finance/routeShared";

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
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Transactions</Text>
        <Text className="text-sm text-muted-foreground mt-1">Handle imports, search, and apply bulk actions.</Text>
      </View>

      {isLoading ? (
        <View className="py-12 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading...</Text>
        </View>
      ) : (
        <>
          <View className="gap-3">
            <Button
              label="Log Transaction"
              onPress={() => router.push("/(tabs)/finance/transactions/add" as any)}
            />
          </View>

          {(pendingTransactions || []).length > 0 ? (
            <View className="gap-3">
              <View className="flex-row justify-between items-center">
                <SectionLabel>Pending Imports</SectionLabel>
                <Pressable onPress={handleApplySuggestedToAll}>
                  <Text className="text-sm text-warning font-medium">Apply Suggested</Text>
                </Pressable>
              </View>
              <View className="gap-3">
                {(pendingTransactions || []).map((transaction) => {
                  const isBusy = busyTransactionId === transaction._id;
                  const manualChoice = pendingEnvelopeByTransaction[transaction._id];
                  const selectedEnvelopeId = getEffectiveEnvelopeId(transaction);
                  const selectedEnvelope = (envelopes || []).find(
                    (envelope) => envelope.envelopeId === selectedEnvelopeId,
                  );
                  const isSuggested = manualChoice === undefined && Boolean(selectedEnvelopeId);

                  return (
                    <View key={transaction._id} className="bg-surface rounded-2xl border border-border p-4 gap-4 shadow-sm">
                      <View className="gap-1">
                        <Text className="text-base font-medium text-foreground">
                          {transaction.merchantHint || transaction.note || "Imported transaction"}
                        </Text>
                        <View className="flex-row items-center gap-2">
                          <Text className="text-base font-semibold text-danger">{formatGhs(transaction.amount)}</Text>
                          {isSuggested && selectedEnvelope ? (
                            <View className="bg-warning/10 border border-warning/20 rounded-full px-2 py-0.5">
                              <Text className="text-[10px] text-warning font-bold uppercase tracking-widest">
                                Suggested: {selectedEnvelope.name}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>

                      <View className="h-px bg-border" />

                      <View className="gap-2">
                        <Text className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Assign Envelope</Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          className="flex-row"
                        >
                          <View className="flex-row gap-2">
                            <Pressable
                              className={`rounded-full px-3 py-1.5 border ${manualChoice === null ? "bg-warning/10 border-warning/30" : "bg-background border-border"} ${isBusy ? "opacity-50" : ""}`}
                              onPress={() =>
                                setPendingEnvelopeByTransaction((current) => ({
                                  ...current,
                                  [transaction._id]: null,
                                }))
                              }
                              disabled={isBusy}
                            >
                              <Text className={`text-xs font-medium ${manualChoice === null ? "text-warning" : "text-foreground"}`}>Unassigned</Text>
                            </Pressable>
                            {(envelopes || []).map((envelope) => (
                              <Pressable
                                key={`${transaction._id}:${envelope.envelopeId}`}
                                className={`rounded-full px-3 py-1.5 border ${selectedEnvelopeId === envelope.envelopeId ? "bg-warning/10 border-warning/30" : "bg-background border-border"} ${isBusy ? "opacity-50" : ""}`}
                                onPress={() =>
                                  setPendingEnvelopeByTransaction((current) => ({
                                    ...current,
                                    [transaction._id]: envelope.envelopeId as Id<"envelopes">,
                                  }))
                                }
                                disabled={isBusy}
                              >
                                <Text className={`text-xs font-medium ${selectedEnvelopeId === envelope.envelopeId ? "text-warning" : "text-foreground"}`}>
                                  {envelope.emoji ? `${envelope.emoji} ` : ""}
                                  {envelope.name}
                                </Text>
                              </Pressable>
                            ))}
                          </View>
                        </ScrollView>
                      </View>

                      <View className="h-px bg-border" />

                      <View className="flex-row gap-2">
                        <Pressable
                          className={`flex-1 bg-background border border-border rounded-xl py-2.5 active:bg-muted ${isBusy ? "opacity-50" : ""}`}
                          onPress={() => handleVoidImport(transaction._id)}
                          disabled={isBusy}
                        >
                          <Text className="text-sm text-foreground text-center font-medium">Void</Text>
                        </Pressable>
                        <Pressable
                          className={`flex-2 bg-foreground rounded-xl py-2.5 active:opacity-90 ${isBusy ? "opacity-50" : ""}`}
                          onPress={() => handleConfirmImport(transaction)}
                          disabled={isBusy}
                        >
                          <Text className="text-sm text-background text-center font-bold">
                            {isBusy ? "Processing..." : "Confirm"}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View className="gap-3">
            <SectionLabel>Recent Transactions</SectionLabel>
            <TransactionsList transactions={(transactions || []).slice(0, 10)} />
          </View>

          <View className="gap-3">
            <SectionLabel>Search & Bulk Edit</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-4 gap-4 shadow-sm">
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-muted-foreground italic">
                  Showing {Math.min((transactionSearch || []).length, 20)} results
                </Text>
                {selectedTransactionIds.length > 0 && (
                  <Text className="text-xs text-warning font-bold uppercase tracking-widest">
                    {selectedTransactionIds.length} Selected
                  </Text>
                )}
              </View>

              <View className="gap-2">
                {(transactionSearch || []).slice(0, 20).map((transaction) => {
                  const selected = selectedTransactionIds.includes(transaction._id);
                  return (
                    <Pressable
                      key={`search:${transaction._id}`}
                      className={`flex-row justify-between items-center p-3 rounded-xl border ${selected ? "bg-warning/5 border-warning/30" : "bg-background border-border"}`}
                      onPress={() => toggleTransactionSelection(transaction._id)}
                    >
                      <View className="flex-1 mr-4">
                        <Text className="text-sm font-medium text-foreground">
                          {transaction.merchantHint || transaction.note || "Expense"}
                        </Text>
                        <Text className="text-xs text-muted-foreground mt-0.5">{formatGhs(transaction.amount)}</Text>
                      </View>
                      <View className="flex-row gap-2">
                        <Pressable
                          className="bg-surface p-2 rounded-lg border border-border"
                          onPress={() => handleAttachReceiptStub(transaction._id)}
                        >
                          <Text className="text-[10px] font-bold text-foreground uppercase tracking-widest">Receipt</Text>
                        </Pressable>
                        <Pressable
                          className="bg-surface p-2 rounded-lg border border-border"
                          onPress={() => handleTagTransaction(transaction._id, "review")}
                        >
                          <Text className="text-[10px] font-bold text-foreground uppercase tracking-widest">Tag</Text>
                        </Pressable>
                        <Pressable
                          className="bg-surface p-2 rounded-lg border border-border"
                          onPress={(event) => {
                            event.stopPropagation();
                            router.push(
                              `/(tabs)/finance/transactions/edit?transactionId=${transaction._id}` as any,
                            );
                          }}
                        >
                          <Text className="text-[10px] font-bold text-foreground uppercase tracking-widest">Edit</Text>
                        </Pressable>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {selectedTransactionIds.length > 0 ? (
                <View className="flex-row gap-2 pt-2">
                  <Pressable
                    className={`flex-1 bg-danger/10 border border-danger/20 rounded-xl py-2.5 active:bg-danger/20 ${isBulkApplying ? "opacity-50" : ""}`}
                    onPress={handleBulkVoid}
                    disabled={isBulkApplying}
                  >
                    <Text className="text-xs text-danger text-center font-bold uppercase tracking-widest">Void Selected</Text>
                  </Pressable>
                  <Pressable
                    className={`flex-1 bg-foreground rounded-xl py-2.5 active:opacity-90 ${isBulkApplying ? "opacity-50" : ""}`}
                    onPress={handleBulkAssignFirstEnvelope}
                    disabled={isBulkApplying}
                  >
                    <Text className="text-xs text-background text-center font-bold uppercase tracking-widest">Assign First</Text>
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
