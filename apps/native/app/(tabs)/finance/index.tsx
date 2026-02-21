import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "@seila/backend/convex/_generated/api";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import { Colors, Radius, Spacing, Typography } from "../../../constants/theme";
import {
  accountSummaryRef,
  attachReceiptRef,
  billRemindersRef,
  budgetDepthRef,
  bulkUpdateTransactionsRef,
  cashflowForecastRef,
  cashflowSummaryRef,
  cancelRecurringTransactionRef,
  contributeSavingsGoalRef,
  currentWeeklyMoneyCheckinRef,
  debtStrategyRef,
  financeSecuritySettingsRef,
  investmentSummaryRef,
  logIncomeRef,
  monthlyCloseExportRef,
  multiCurrencySummaryRef,
  merchantHintReviewRef,
  merchantEnvelopeHintsRef,
  monthlyCloseSummaryRef,
  netWorthViewRef,
  recurringTransactionsRef,
  savingsGoalsRef,
  savingsSimulationRef,
  setAccountRef,
  setFxRateRef,
  setMerchantEnvelopeHintRef,
  setFinanceSecuritySettingsRef,
  setSavingsGoalRef,
  setTransactionTagsRef,
  scheduleRecurringTransactionRef,
  sharedBudgetSummaryRef,
  spendingAnomaliesRef,
  startLowSpendResetRef,
  subscriptionsOverviewRef,
  taxEstimateRef,
  transactionSearchRef,
  upsertWeeklyMoneyCheckinRef,
  updateRecurringTransactionRef,
} from "../../../lib/finance-refs";
import { formatGhs } from "../../../lib/ghs";
import {
  AddAccountSheet,
  AccountsList,
  EnvelopesList,
  TransactionsList,
} from "../../../components/finance/FinanceComponents";
import { Button, SectionLabel } from "../../../components/ui";

function normalizeMerchant(value?: string) {
  return (value || "").trim().toLowerCase();
}

function formatDueDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function confidenceLabel(confidence: number) {
  if (confidence >= 0.75) return "high";
  if (confidence >= 0.45) return "medium";
  return "low";
}

export default function FinanceScreen() {
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
  const spendingTrend = useQuery(api.queries.spendingTrend.spendingTrend, { weeks: 6 });
  const cashflow = useQuery(cashflowSummaryRef, {});
  const cashflowForecast = useQuery(cashflowForecastRef, {});
  const budgetDepth = useQuery(budgetDepthRef, {});
  const accountSummary = useQuery(accountSummaryRef, {});
  const goals = useQuery(savingsGoalsRef, {});
  const savingsSimulation = useQuery(savingsSimulationRef, {});
  const transactionSearch = useQuery(transactionSearchRef, {
    includeVoided: false,
    limit: 50,
  });
  const spendingAnomalies = useQuery(spendingAnomaliesRef, {});
  const weeklyMoneyCheckin = useQuery(currentWeeklyMoneyCheckinRef, {});
  const securitySettings = useQuery(financeSecuritySettingsRef, {});
  const monthlyCloseExport = useQuery(monthlyCloseExportRef, {});
  const billReminders = useQuery(billRemindersRef, {});
  const netWorthView = useQuery(netWorthViewRef, {});
  const multiCurrencySummary = useQuery(multiCurrencySummaryRef, {});
  const subscriptionsOverview = useQuery(subscriptionsOverviewRef, {});
  const debtOverview = useQuery(debtStrategyRef, { strategy: "avalanche" });
  const investmentOverview = useQuery(investmentSummaryRef, {});
  const taxOverview = useQuery(taxEstimateRef, {});
  const sharedBudgetOverview = useQuery(sharedBudgetSummaryRef, {});
  const monthlyClose = useQuery(monthlyCloseSummaryRef, {});
  const recurringTransactions = useQuery(recurringTransactionsRef, { limit: 8 });
  const merchantHintReview = useQuery(merchantHintReviewRef, { limit: 8 });
  const pendingMerchantHints = useQuery(merchantEnvelopeHintsRef, {
    merchantHints: (pendingTransactions || [])
      .map((transaction) => normalizeMerchant(transaction.merchantHint || transaction.note))
      .filter(Boolean),
  });
  const logTransaction = useMutation(api.commands.logTransaction.logTransaction);
  const logIncome = useMutation(logIncomeRef);
  const setAccount = useMutation(setAccountRef);
  const setSavingsGoal = useMutation(setSavingsGoalRef);
  const contributeSavingsGoal = useMutation(contributeSavingsGoalRef);
  const bulkUpdateTransactions = useMutation(bulkUpdateTransactionsRef);
  const attachReceipt = useMutation(attachReceiptRef);
  const startLowSpendReset = useMutation(startLowSpendResetRef);
  const upsertWeeklyMoneyCheckin = useMutation(upsertWeeklyMoneyCheckinRef);
  const setFxRate = useMutation(setFxRateRef);
  const setTransactionTags = useMutation(setTransactionTagsRef);
  const setFinanceSecuritySettings = useMutation(setFinanceSecuritySettingsRef);
  const setEnvelope = useMutation(api.commands.setEnvelope.setEnvelope);
  const confirmImportedTransaction = useMutation(
    api.commands.confirmImportedTransaction.confirmImportedTransaction,
  );
  const voidTransaction = useMutation(api.commands.voidTransaction.voidTransaction);
  const scheduleRecurringTransaction = useMutation(scheduleRecurringTransactionRef);
  const updateRecurringTransaction = useMutation(updateRecurringTransactionRef);
  const cancelRecurringTransaction = useMutation(cancelRecurringTransactionRef);
  const setMerchantEnvelopeHint = useMutation(setMerchantEnvelopeHintRef);
  const [busyTransactionId, setBusyTransactionId] = React.useState<Id<"transactions"> | null>(null);
  const [selectedTransactionIds, setSelectedTransactionIds] = React.useState<Id<"transactions">[]>([]);
  const [busyRecurringId, setBusyRecurringId] = React.useState<string | null>(null);
  const [busyMerchantKey, setBusyMerchantKey] = React.useState<string | null>(null);
  const [isBulkApplying, setIsBulkApplying] = React.useState(false);
  const [isStartingReset, setIsStartingReset] = React.useState(false);
  const [isSavingWeeklyCheckin, setIsSavingWeeklyCheckin] = React.useState(false);
  const [isAddingGoal, setIsAddingGoal] = React.useState(false);
  const [isLoggingIncome, setIsLoggingIncome] = React.useState(false);
  const [pendingEnvelopeByTransaction, setPendingEnvelopeByTransaction] = React.useState<
    Record<string, Id<"envelopes"> | null | undefined>
  >({});
  const recentMerchants = React.useMemo(
    () =>
      Array.from(
        new Set(
          (transactions || [])
            .map((transaction) => (transaction.merchantHint || transaction.note || "").trim())
            .filter(Boolean),
        ),
      ).slice(0, 4),
    [transactions],
  );
  const amountPresets = React.useMemo(() => [1000, 2500, 5000, 10000], []);
  const incomePresets = React.useMemo(() => [5000, 10000, 25000, 50000], []);
  const goalPresets = React.useMemo(
    () => [
      { name: "Emergency Fund", targetAmount: 300000 },
      { name: "Travel Buffer", targetAmount: 120000 },
      { name: "Device Upgrade", targetAmount: 80000 },
    ],
    [],
  );
  const [selectedRecurringAmount, setSelectedRecurringAmount] = React.useState<number>(amountPresets[1] || 2500);
  const [selectedRecurringMerchant, setSelectedRecurringMerchant] = React.useState<string>(
    recentMerchants[0] || "General expense",
  );
  const [recurringCadence, setRecurringCadence] = React.useState<"weekly" | "biweekly" | "monthly">("monthly");
  const [isSchedulingRecurring, setIsSchedulingRecurring] = React.useState(false);
  const [selectedRecurringEnvelopeById, setSelectedRecurringEnvelopeById] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!recentMerchants.length) return;
    if (!selectedRecurringMerchant || !recentMerchants.includes(selectedRecurringMerchant)) {
      setSelectedRecurringMerchant(recentMerchants[0] || "General expense");
    }
  }, [recentMerchants, selectedRecurringMerchant]);

  const handleAddTransaction = async (amount: number, envelopeId?: string, note?: string) => {
    await logTransaction({
      idempotencyKey: `tx_${Date.now()}`,
      amount,
      source: "manual",
      envelopeId: envelopeId as Id<"envelopes"> | undefined,
      note,
    });
  };

  const handleAddEnvelope = async (name: string, softCeiling?: number, emoji?: string) => {
    await setEnvelope({
      idempotencyKey: `env_${Date.now()}`,
      name,
      softCeiling,
      emoji,
    });
  };

  const handleAddAccount = async (name: string, type: string, balance?: number, institution?: string) => {
    await setAccount({
      idempotencyKey: `acc_${Date.now()}`,
      name,
      type: type as "checking" | "savings" | "cash" | "credit" | "other",
      balance,
      institution,
    });
  };

  const isLoading =
    envelopes === undefined ||
    transactions === undefined ||
    pendingTransactions === undefined ||
    cashflow === undefined ||
    cashflowForecast === undefined ||
    budgetDepth === undefined ||
    accountSummary === undefined ||
    goals === undefined ||
    savingsSimulation === undefined ||
    transactionSearch === undefined ||
    spendingAnomalies === undefined ||
    weeklyMoneyCheckin === undefined ||
    securitySettings === undefined ||
    monthlyCloseExport === undefined ||
    billReminders === undefined ||
    netWorthView === undefined ||
    multiCurrencySummary === undefined ||
    subscriptionsOverview === undefined ||
    debtOverview === undefined ||
    investmentOverview === undefined ||
    taxOverview === undefined ||
    sharedBudgetOverview === undefined ||
    pendingMerchantHints === undefined ||
    spendingTrend === undefined ||
    monthlyClose === undefined ||
    recurringTransactions === undefined ||
    merchantHintReview === undefined;
  const monthlySpent = (envelopes || []).reduce((sum, envelope) => sum + envelope.spent, 0);
  const monthlyBudget = (envelopes || []).reduce((sum, envelope) => sum + (envelope.softCeiling || 0), 0);
  const overspentCount = (envelopes || []).filter(
    (envelope) => typeof envelope.softCeiling === "number" && envelope.softCeiling > 0 && envelope.utilization > 1,
  ).length;
  const trendMax = Math.max(...(spendingTrend || []).map((point) => point.total), 1);
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
        const suggestedEnvelopeId = merchantKey ? suggestedEnvelopeByMerchant.get(merchantKey) : undefined;
        const currentChoice = current[transaction._id];

        if (currentChoice === undefined && suggestedEnvelopeId) {
          next[transaction._id] = suggestedEnvelopeId;
        }
      }
      return next;
    });
    toast.show({ variant: "success", label: "Applied suggested envelopes" });
  };

  const handleScheduleRecurring = async () => {
    if (!Number.isInteger(selectedRecurringAmount) || selectedRecurringAmount <= 0) {
      toast.show({ variant: "warning", label: "Pick a valid amount" });
      return;
    }

    setIsSchedulingRecurring(true);
    try {
      await scheduleRecurringTransaction({
        idempotencyKey: `finance.recurring:${Date.now()}`,
        amount: selectedRecurringAmount,
        cadence: recurringCadence,
        nextDueAt: Date.now() + 24 * 60 * 60 * 1000,
        merchantHint: selectedRecurringMerchant || undefined,
      });
      setRecurringCadence("monthly");
      toast.show({ variant: "success", label: "Recurring transaction scheduled" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to schedule recurring transaction" });
    } finally {
      setIsSchedulingRecurring(false);
    }
  };

  const handleDelayRecurring = async (recurringId: string, currentDueAt: number) => {
    setBusyRecurringId(recurringId);
    try {
      await updateRecurringTransaction({
        idempotencyKey: `finance.recurring.delay:${recurringId}:${Date.now()}`,
        recurringId,
        nextDueAt: currentDueAt + 7 * 24 * 60 * 60 * 1000,
      });
      toast.show({ variant: "success", label: "Recurring due date moved by 7 days" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to update recurring schedule" });
    } finally {
      setBusyRecurringId(null);
    }
  };

  const handleCancelRecurring = async (recurringId: string) => {
    setBusyRecurringId(recurringId);
    try {
      await cancelRecurringTransaction({
        idempotencyKey: `finance.recurring.cancel:${recurringId}:${Date.now()}`,
        recurringId,
      });
      toast.show({ variant: "success", label: "Recurring schedule canceled" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to cancel recurring schedule" });
    } finally {
      setBusyRecurringId(null);
    }
  };

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

  const handleLogIncome = async (amount: number) => {
    setIsLoggingIncome(true);
    try {
      await logIncome({
        idempotencyKey: `finance.income:${Date.now()}`,
        amount,
        source: "manual",
      });
      toast.show({ variant: "success", label: "Income logged" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to log income" });
    } finally {
      setIsLoggingIncome(false);
    }
  };

  const handleQuickAddGoal = async (name: string, targetAmount: number) => {
    setIsAddingGoal(true);
    try {
      await setSavingsGoal({
        idempotencyKey: `finance.goal:${name}:${Date.now()}`,
        name,
        targetAmount,
      });
      toast.show({ variant: "success", label: "Savings goal added" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to add savings goal" });
    } finally {
      setIsAddingGoal(false);
    }
  };

  const handleContributeGoal = async (goalId: string, amount: number) => {
    try {
      await contributeSavingsGoal({
        idempotencyKey: `finance.goal.contribution:${goalId}:${Date.now()}`,
        goalId: goalId as Id<"savingsGoals">,
        amount,
      });
      toast.show({ variant: "success", label: "Goal contribution added" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to contribute to goal" });
    }
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

  const handleStartLowSpendReset = async () => {
    setIsStartingReset(true);
    try {
      await startLowSpendReset({
        idempotencyKey: `finance.reset:${Date.now()}`,
        durationDays: 2,
        reason: "spending anomaly detected",
      });
      toast.show({ variant: "success", label: "Low spend reset started (2 days)" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to start low spend reset" });
    } finally {
      setIsStartingReset(false);
    }
  };

  const handleSaveWeeklyMoneyCheckin = async () => {
    setIsSavingWeeklyCheckin(true);
    try {
      const now = Date.now();
      const date = new Date(now);
      const day = (date.getUTCDay() + 6) % 7;
      date.setUTCHours(0, 0, 0, 0);
      const weekStart = date.getTime() - day * 24 * 60 * 60 * 1000;

      await upsertWeeklyMoneyCheckin({
        idempotencyKey: `finance.weekly-checkin:${weekStart}:${Date.now()}`,
        weekStart,
        wins: [(monthlyClose?.win || "Stayed consistent this week.")],
        overspendAreas: monthlyClose?.overspendAreas || [],
        correction: monthlyClose?.focus || "Keep spending guardrails visible.",
        focus: "Protect runway and keep envelopes current.",
      });
      toast.show({ variant: "success", label: "Weekly money check-in saved" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to save weekly check-in" });
    } finally {
      setIsSavingWeeklyCheckin(false);
    }
  };

  const handleSetFxRatePreset = async () => {
    try {
      await setFxRate({
        idempotencyKey: `finance.fx:${Date.now()}`,
        baseCurrency: "USD",
        quoteCurrency: "GHS",
        rateScaled: 15000000,
      });
      toast.show({ variant: "success", label: "FX rate preset saved (USD/GHS)" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to save FX rate" });
    }
  };

  const handleToggleSecurity = async (
    key: "biometricLockEnabled" | "offlineModeEnabled" | "conflictSafeSyncEnabled",
  ) => {
    if (!securitySettings) return;
    try {
      await setFinanceSecuritySettings({
        idempotencyKey: `finance.security:${key}:${Date.now()}`,
        biometricLockEnabled:
          key === "biometricLockEnabled"
            ? !securitySettings.biometricLockEnabled
            : securitySettings.biometricLockEnabled,
        offlineModeEnabled:
          key === "offlineModeEnabled"
            ? !securitySettings.offlineModeEnabled
            : securitySettings.offlineModeEnabled,
        conflictSafeSyncEnabled:
          key === "conflictSafeSyncEnabled"
            ? !securitySettings.conflictSafeSyncEnabled
            : securitySettings.conflictSafeSyncEnabled,
      });
      toast.show({ variant: "success", label: "Security settings updated" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to update security settings" });
    }
  };

  const handleRecurringCadenceCycle = async (recurringId: string, cadence: "weekly" | "biweekly" | "monthly") => {
    const nextCadence: "weekly" | "biweekly" | "monthly" =
      cadence === "weekly" ? "biweekly" : cadence === "biweekly" ? "monthly" : "weekly";
    try {
      await updateRecurringTransaction({
        idempotencyKey: `finance.recurring.cadence:${recurringId}:${Date.now()}`,
        recurringId,
        cadence: nextCadence,
      });
      toast.show({ variant: "success", label: `Recurring cadence set to ${nextCadence}` });
    } catch {
      toast.show({ variant: "danger", label: "Failed to update recurring cadence" });
    }
  };

  const handleRecurringEnvelopeAssign = async (recurringId: string) => {
    const firstEnvelope = (envelopes || [])[0];
    if (!firstEnvelope) return;
    try {
      await updateRecurringTransaction({
        idempotencyKey: `finance.recurring.envelope:${recurringId}:${Date.now()}`,
        recurringId,
        envelopeId: firstEnvelope.envelopeId as Id<"envelopes">,
      });
      setSelectedRecurringEnvelopeById((current) => ({
        ...current,
        [recurringId]: firstEnvelope.envelopeId,
      }));
      toast.show({ variant: "success", label: "Recurring envelope assigned" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to assign recurring envelope" });
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Finance</Text>
      <Text style={styles.subtitle}>Track your spending and stay on budget.</Text>

      {isLoading ? (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <SectionLabel>Monthly Snapshot</SectionLabel>
            <View style={styles.snapshotGrid}>
              <View style={styles.snapshotCard}>
                <Text style={styles.snapshotLabel}>Spent</Text>
                <Text style={styles.snapshotValue}>{formatGhs(monthlySpent)}</Text>
              </View>
              <View style={styles.snapshotCard}>
                <Text style={styles.snapshotLabel}>Budget</Text>
                <Text style={styles.snapshotValue}>{formatGhs(monthlyBudget)}</Text>
              </View>
              <View style={styles.snapshotCard}>
                <Text style={styles.snapshotLabel}>Over Budget</Text>
                <Text style={styles.snapshotValue}>{overspentCount}</Text>
              </View>
            </View>
            <View style={styles.trendCard}>
              <Text style={styles.trendTitle}>6-Week Spend Trend</Text>
              <View style={styles.trendBars}>
                {(spendingTrend || []).map((point) => (
                  <View key={point.weekStart} style={styles.trendBarWrap}>
                    <View
                      style={[
                        styles.trendBar,
                        { height: `${Math.max((point.total / trendMax) * 100, 8)}%` },
                      ]}
                    />
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <SectionLabel>Budget Envelopes</SectionLabel>
            <EnvelopesList envelopes={envelopes || []} />
          </View>

          <View style={styles.section}>
            <SectionLabel>Budget Depth</SectionLabel>
            <View style={styles.recurringCard}>
              {(budgetDepth || []).slice(0, 6).map((row) => (
                <View key={`budget-depth:${row.envelopeId}`} style={styles.hintReviewRow}>
                  <Text style={styles.recurringTitle}>{row.name}</Text>
                  <Text style={styles.recurringMeta}>
                    Ceiling {formatGhs(row.ceiling)} · Spent {formatGhs(row.currentSpent)} · Rollover {formatGhs(row.rollover)} · Available {formatGhs(row.available)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <SectionLabel>Cashflow & Runway</SectionLabel>
            <View style={styles.monthlyCloseCard}>
              <Text style={styles.monthlyCloseMetric}>
                Income {formatGhs(cashflow?.monthIncome || 0)} · Expense {formatGhs(cashflow?.monthExpense || 0)}
              </Text>
              <Text style={styles.monthlyCloseWin}>
                Net {formatGhs(cashflow?.netCashflow || 0)} · Balance {formatGhs(cashflow?.totalBalance || 0)}
              </Text>
              <Text style={styles.monthlyCloseFocus}>
                Runway: {cashflow?.runwayDays === null ? "stable" : `${cashflow?.runwayDays} days`}
              </Text>
              <Text style={styles.monthlyCloseMetric}>
                Forecast 30d: {formatGhs(cashflowForecast?.forecast30Net || 0)} (in {formatGhs(cashflowForecast?.expectedIncome30 || 0)} / out {formatGhs(cashflowForecast?.expectedExpense30 || 0)})
              </Text>
              <View style={styles.chipRow}>
                {incomePresets.map((preset) => (
                  <Pressable
                    key={preset}
                    style={[styles.cadenceChip, isLoggingIncome && styles.pendingDisabled]}
                    onPress={() => handleLogIncome(preset)}
                    disabled={isLoggingIncome}
                  >
                    <Text style={styles.cadenceChipText}>+{formatGhs(preset)}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <SectionLabel>Accounts</SectionLabel>
            <AccountsList accounts={accountSummary?.accounts || []} />
          </View>

          <View style={styles.section}>
            <SectionLabel>Savings Goals</SectionLabel>
            <View style={styles.recurringCard}>
              {(goals || []).length === 0 ? (
                <View style={styles.chipRow}>
                  {goalPresets.map((preset) => (
                    <Pressable
                      key={preset.name}
                      style={[styles.cadenceChip, isAddingGoal && styles.pendingDisabled]}
                      onPress={() => handleQuickAddGoal(preset.name, preset.targetAmount)}
                      disabled={isAddingGoal}
                    >
                      <Text style={styles.cadenceChipText}>{preset.name}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                (goals || []).map((goal) => (
                  <View key={goal.goalId} style={styles.hintReviewRow}>
                    <Text style={styles.recurringTitle}>{goal.name}</Text>
                    <Text style={styles.recurringMeta}>
                      {formatGhs(goal.currentAmount)} / {formatGhs(goal.targetAmount)} ·{" "}
                      {Math.round(goal.progress * 100)}%
                    </Text>
                    <View style={styles.chipRow}>
                      {[1000, 5000, 10000].map((amount) => (
                        <Pressable
                          key={`${goal.goalId}:${amount}`}
                          style={styles.cadenceChip}
                          onPress={() => handleContributeGoal(goal.goalId, amount)}
                        >
                          <Text style={styles.cadenceChipText}>+{formatGhs(amount)}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ))
              )}
              <Text style={styles.recurringMeta}>
                Micro-savings simulation: {formatGhs(savingsSimulation?.microSavingsMonthly || 0)} / month · {formatGhs(savingsSimulation?.allocationPerGoal || 0)} per goal
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <SectionLabel>Monthly Close</SectionLabel>
            <View style={styles.monthlyCloseCard}>
              <Text style={styles.monthlyCloseWin}>{monthlyClose?.win}</Text>
              <Text style={styles.monthlyCloseMetric}>
                Spent {formatGhs(monthlyClose?.totalSpent || 0)} / Budget {formatGhs(monthlyClose?.totalBudget || 0)}
              </Text>
              {(monthlyClose?.overspendAreas || []).length > 0 ? (
                <Text style={styles.monthlyCloseOverspend}>
                  Overspend: {(monthlyClose?.overspendAreas || []).join(", ")}
                </Text>
              ) : (
                <Text style={styles.monthlyCloseOnTrack}>No overspend areas this month.</Text>
              )}
              <Text style={styles.monthlyCloseFocus}>Focus: {monthlyClose?.focus}</Text>
            </View>
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
                              Suggested: {selectedEnvelope.emoji ? `${selectedEnvelope.emoji} ` : ""}
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
                          style={[styles.pendingActionButton, styles.pendingVoidButton, isBusy && styles.pendingDisabled]}
                          onPress={() => handleVoidImport(transaction._id)}
                          disabled={isBusy}
                        >
                          <Text style={styles.pendingVoidText}>Void</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.pendingActionButton, styles.pendingConfirmButton, isBusy && styles.pendingDisabled]}
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
                  <Text style={styles.cadenceChipText}>Showing {Math.min((transactionSearch || []).length, 20)} results</Text>
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
                    style={[styles.pendingActionButton, styles.pendingVoidButton, isBulkApplying && styles.pendingDisabled]}
                    onPress={handleBulkVoid}
                    disabled={isBulkApplying}
                  >
                    <Text style={styles.pendingVoidText}>Void Selected</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.pendingActionButton, styles.pendingConfirmButton, isBulkApplying && styles.pendingDisabled]}
                    onPress={handleBulkAssignFirstEnvelope}
                    disabled={isBulkApplying}
                  >
                    <Text style={styles.pendingConfirmText}>Assign First Envelope</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.section}>
            <SectionLabel>Recurring</SectionLabel>
            <View style={styles.recurringCard}>
              <View style={styles.recurringForm}>
                <Text style={styles.recurringSectionTitle}>Amount</Text>
                <View style={styles.chipRow}>
                  {amountPresets.map((amountPreset) => (
                    <Pressable
                      key={amountPreset}
                      style={[
                        styles.cadenceChip,
                        selectedRecurringAmount === amountPreset && styles.cadenceChipSelected,
                      ]}
                      onPress={() => setSelectedRecurringAmount(amountPreset)}
                    >
                      <Text style={styles.cadenceChipText}>{formatGhs(amountPreset)}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.recurringSectionTitle}>Merchant</Text>
                <View style={styles.chipRow}>
                  {(recentMerchants.length ? recentMerchants : ["General expense"]).map((merchant) => (
                    <Pressable
                      key={merchant}
                      style={[
                        styles.cadenceChip,
                        selectedRecurringMerchant === merchant && styles.cadenceChipSelected,
                      ]}
                      onPress={() => setSelectedRecurringMerchant(merchant)}
                    >
                      <Text style={styles.cadenceChipText}>{merchant}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.recurringSectionTitle}>Cadence</Text>
                <View style={styles.cadenceRow}>
                  {(["weekly", "biweekly", "monthly"] as const).map((cadence) => (
                    <Pressable
                      key={cadence}
                      style={[
                        styles.cadenceChip,
                        recurringCadence === cadence && styles.cadenceChipSelected,
                      ]}
                      onPress={() => setRecurringCadence(cadence)}
                    >
                      <Text style={styles.cadenceChipText}>{cadence}</Text>
                    </Pressable>
                  ))}
                </View>
                <Button
                  label={isSchedulingRecurring ? "Scheduling..." : "Schedule Recurring"}
                  onPress={handleScheduleRecurring}
                  disabled={isSchedulingRecurring}
                />
              </View>
              {(recurringTransactions || []).length > 0 ? (
                <View style={styles.recurringList}>
                  {(recurringTransactions || []).map((item) => (
                    <View key={item.recurringId} style={styles.recurringRow}>
                      <View style={styles.recurringTopRow}>
                        <View style={styles.recurringInfo}>
                          <Text style={styles.recurringTitle}>
                            {item.merchantHint || item.note || "Recurring expense"}
                          </Text>
                          <Text style={styles.recurringMeta}>
                            {formatGhs(item.amount)} · {item.cadence} · due {formatDueDate(item.nextDueAt)}
                          </Text>
                          {selectedRecurringEnvelopeById[item.recurringId] ? (
                            <Text style={styles.recurringMeta}>Envelope assigned</Text>
                          ) : null}
                        </View>
                        <View style={styles.recurringActions}>
                          <Pressable
                            style={[styles.pendingActionButton, styles.pendingVoidButton, busyRecurringId === item.recurringId && styles.pendingDisabled]}
                            onPress={() => handleDelayRecurring(item.recurringId, item.nextDueAt)}
                            disabled={busyRecurringId === item.recurringId}
                          >
                            <Text style={styles.pendingVoidText}>+7d</Text>
                          </Pressable>
                          <Pressable
                            style={[styles.pendingActionButton, styles.pendingVoidButton, busyRecurringId === item.recurringId && styles.pendingDisabled]}
                            onPress={() => handleRecurringCadenceCycle(item.recurringId, item.cadence)}
                            disabled={busyRecurringId === item.recurringId}
                          >
                            <Text style={styles.pendingVoidText}>Cadence</Text>
                          </Pressable>
                          <Pressable
                            style={[styles.pendingActionButton, styles.pendingVoidButton, busyRecurringId === item.recurringId && styles.pendingDisabled]}
                            onPress={() => handleRecurringEnvelopeAssign(item.recurringId)}
                            disabled={busyRecurringId === item.recurringId}
                          >
                            <Text style={styles.pendingVoidText}>Envelope</Text>
                          </Pressable>
                          <Pressable
                            style={[styles.pendingActionButton, styles.pendingConfirmButton, busyRecurringId === item.recurringId && styles.pendingDisabled]}
                            onPress={() => handleCancelRecurring(item.recurringId)}
                            disabled={busyRecurringId === item.recurringId}
                          >
                            <Text style={styles.pendingConfirmText}>Cancel</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </View>

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
                          Confidence {confidenceLabel(hint.confidence)} ({Math.round(hint.confidence * 100)}%) ·
                          {` `}samples {hint.sampleSize}
                        </Text>
                      </View>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pendingEnvelopePicker}>
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
                            onPress={() => handleSetMerchantHint(hint.merchantKey, envelope.envelopeId)}
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

          <View style={styles.section}>
            <SectionLabel>Anomalies & Reset</SectionLabel>
            <View style={styles.recurringCard}>
              {(spendingAnomalies?.anomalies || []).length === 0 ? (
                <Text style={styles.recurringMeta}>No spending anomalies detected.</Text>
              ) : (
                (spendingAnomalies?.anomalies || []).map((anomaly) => (
                  <Text key={anomaly.type} style={styles.recurringMeta}>{anomaly.headline}</Text>
                ))
              )}
              <Button
                label={isStartingReset ? "Starting..." : "Start 2-Day Low Spend Reset"}
                onPress={handleStartLowSpendReset}
                disabled={isStartingReset}
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionLabel>Weekly Money Check-in</SectionLabel>
            <View style={styles.recurringCard}>
              {weeklyMoneyCheckin ? (
                <Text style={styles.recurringMeta}>Focus: {weeklyMoneyCheckin.focus}</Text>
              ) : (
                <Text style={styles.recurringMeta}>No weekly money check-in saved yet.</Text>
              )}
              <Button
                label={isSavingWeeklyCheckin ? "Saving..." : "Save Weekly Check-in"}
                onPress={handleSaveWeeklyMoneyCheckin}
                disabled={isSavingWeeklyCheckin}
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionLabel>Monthly Close Export</SectionLabel>
            <View style={styles.recurringCard}>
              <Text style={styles.recurringMeta}>{monthlyCloseExport?.shareText}</Text>
              <Text style={styles.recurringMeta}>
                CSV rows: {Math.max((monthlyCloseExport?.csv || "").split("\n").length - 1, 0)}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <SectionLabel>Security & Sync</SectionLabel>
            <View style={styles.recurringCard}>
              <View style={styles.chipRow}>
                <Pressable
                  style={[styles.cadenceChip, securitySettings?.biometricLockEnabled && styles.cadenceChipSelected]}
                  onPress={() => handleToggleSecurity("biometricLockEnabled")}
                >
                  <Text style={styles.cadenceChipText}>Biometric Lock</Text>
                </Pressable>
                <Pressable
                  style={[styles.cadenceChip, securitySettings?.offlineModeEnabled && styles.cadenceChipSelected]}
                  onPress={() => handleToggleSecurity("offlineModeEnabled")}
                >
                  <Text style={styles.cadenceChipText}>Offline Mode</Text>
                </Pressable>
                <Pressable
                  style={[styles.cadenceChip, securitySettings?.conflictSafeSyncEnabled && styles.cadenceChipSelected]}
                  onPress={() => handleToggleSecurity("conflictSafeSyncEnabled")}
                >
                  <Text style={styles.cadenceChipText}>Conflict-safe Sync</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <SectionLabel>Advanced Overview</SectionLabel>
            <View style={styles.recurringCard}>
              <Text style={styles.recurringMeta}>
                Subscriptions: {subscriptionsOverview?.count || 0} ({subscriptionsOverview?.dueSoonCount || 0} due soon) · Monthly {formatGhs(subscriptionsOverview?.monthlyEquivalent || 0)}
              </Text>
              <Text style={styles.recurringMeta}>
                Debt: {formatGhs(debtOverview?.totalBalance || 0)} · Next {debtOverview?.nextFocus?.name || "none"}
              </Text>
              <Text style={styles.recurringMeta}>
                Investments: {formatGhs(investmentOverview?.totalValue || 0)} · PnL {formatGhs(investmentOverview?.unrealizedPnl || 0)}
              </Text>
              <Text style={styles.recurringMeta}>
                Tax Est.: {formatGhs(taxOverview?.estimatedTax || 0)} on income {formatGhs(taxOverview?.ytdIncome || 0)}
              </Text>
              <Text style={styles.recurringMeta}>
                Shared Budget: {formatGhs(sharedBudgetOverview?.totalSpent || 0)} / {formatGhs(sharedBudgetOverview?.totalBudget || 0)}
              </Text>
              <Text style={styles.recurringMeta}>
                Bills due soon: {(billReminders?.dueSoon || []).length}
              </Text>
              <Text style={styles.recurringMeta}>
                Net worth: {formatGhs(netWorthView?.netWorth || 0)} (assets {formatGhs(netWorthView?.assets || 0)} / liabilities {formatGhs(netWorthView?.liabilities || 0)})
              </Text>
              <Text style={styles.recurringMeta}>
                Multi-currency ({multiCurrencySummary?.baseCurrency || "GHS"}): {formatGhs(multiCurrencySummary?.estimatedTotalInBase || 0)}
              </Text>
              <Button label="Set FX Preset (USD/GHS)" onPress={handleSetFxRatePreset} />
            </View>
          </View>
        </>
      )}

      <View style={styles.section}>
        <AddAccountSheet
          onAddTransaction={handleAddTransaction}
          onAddEnvelope={handleAddEnvelope}
          onAddAccount={handleAddAccount}
          envelopes={envelopes || []}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: Spacing.xxl,
    gap: Spacing.lg,
  },
  title: {
    ...Typography.displaySM,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.bodySM,
    color: Colors.textSecondary,
  },
  section: {
    gap: Spacing.sm,
  },
  snapshotGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  snapshotCard: {
    flex: 1,
    backgroundColor: Colors.bgFloat,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  snapshotLabel: {
    ...Typography.bodyXS,
    color: Colors.textMuted,
    textTransform: "uppercase",
  },
  snapshotValue: {
    ...Typography.labelLG,
    color: Colors.textPrimary,
  },
  trendCard: {
    backgroundColor: Colors.bgFloat,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  trendTitle: {
    ...Typography.labelMD,
    color: Colors.textPrimary,
  },
  trendBars: {
    height: 100,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  trendBarWrap: {
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
    backgroundColor: Colors.bg,
    borderRadius: 6,
    overflow: "hidden",
  },
  trendBar: {
    width: "100%",
    backgroundColor: Colors.amber,
    borderRadius: 6,
  },
  monthlyCloseCard: {
    backgroundColor: Colors.bgFloat,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  monthlyCloseWin: {
    ...Typography.labelMD,
    color: Colors.textPrimary,
  },
  monthlyCloseMetric: {
    ...Typography.bodySM,
    color: Colors.textSecondary,
  },
  monthlyCloseOverspend: {
    ...Typography.bodySM,
    color: Colors.danger,
  },
  monthlyCloseOnTrack: {
    ...Typography.bodySM,
    color: Colors.textSecondary,
  },
  monthlyCloseFocus: {
    ...Typography.bodySM,
    color: Colors.amber,
  },
  pendingCard: {
    backgroundColor: Colors.bgFloat,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  pendingHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  applySuggestedButton: {
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    backgroundColor: Colors.amberGlow,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  applySuggestedText: {
    ...Typography.bodyXS,
    color: Colors.amber,
  },
  pendingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
    paddingBottom: Spacing.sm,
  },
  pendingInfo: {
    flex: 1,
    gap: 2,
  },
  pendingMerchant: {
    ...Typography.bodySM,
    color: Colors.textPrimary,
  },
  pendingAmount: {
    ...Typography.bodyXS,
    color: Colors.textMuted,
  },
  pendingMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  pendingSuggestedText: {
    ...Typography.bodyXS,
    color: Colors.amber,
  },
  pendingEnvelopePicker: {
    marginTop: Spacing.xs,
  },
  pendingEnvelopeChip: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    marginRight: Spacing.xs,
  },
  pendingEnvelopeChipSelected: {
    backgroundColor: Colors.amberGlow,
    borderColor: Colors.amberBorder,
  },
  pendingEnvelopeChipText: {
    ...Typography.bodyXS,
    color: Colors.textPrimary,
  },
  pendingActions: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  pendingActionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
  },
  pendingVoidButton: {
    borderColor: Colors.borderSoft,
    backgroundColor: Colors.bg,
  },
  pendingConfirmButton: {
    borderColor: Colors.amberBorder,
    backgroundColor: Colors.amberGlow,
  },
  pendingVoidText: {
    ...Typography.bodyXS,
    color: Colors.textSecondary,
  },
  pendingConfirmText: {
    ...Typography.bodyXS,
    color: Colors.amber,
  },
  pendingDisabled: {
    opacity: 0.5,
  },
  recurringCard: {
    backgroundColor: Colors.bgFloat,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  recurringForm: {
    gap: Spacing.sm,
  },
  recurringSectionTitle: {
    ...Typography.bodyXS,
    color: Colors.textMuted,
    textTransform: "uppercase",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  cadenceRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  cadenceChip: {
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    backgroundColor: Colors.bg,
  },
  cadenceChipSelected: {
    borderColor: Colors.amberBorder,
    backgroundColor: Colors.amberGlow,
  },
  cadenceChipText: {
    ...Typography.bodyXS,
    color: Colors.textPrimary,
    textTransform: "capitalize",
  },
  recurringList: {
    gap: Spacing.xs,
  },
  recurringRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderSoft,
    paddingTop: Spacing.sm,
  },
  recurringTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
  },
  recurringInfo: {
    flex: 1,
    gap: 2,
  },
  recurringActions: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  recurringTitle: {
    ...Typography.bodySM,
    color: Colors.textPrimary,
  },
  recurringMeta: {
    ...Typography.bodyXS,
    color: Colors.textMuted,
  },
  searchRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderSoft,
    paddingTop: Spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
  },
  hintReviewRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderSoft,
    paddingTop: Spacing.sm,
    gap: Spacing.xs,
  },
  loading: {
    padding: Spacing.xxl,
    alignItems: "center",
  },
  loadingText: {
    ...Typography.bodyMD,
    color: Colors.textMuted,
  },
});
