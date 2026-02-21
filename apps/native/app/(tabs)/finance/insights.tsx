import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import {
  billRemindersRef,
  budgetDepthRef,
  currentWeeklyMoneyCheckinRef,
  debtStrategyRef,
  financeSecuritySettingsRef,
  investmentSummaryRef,
  monthlyCloseExportRef,
  monthlyCloseSummaryRef,
  multiCurrencySummaryRef,
  netWorthViewRef,
  setFinanceSecuritySettingsRef,
  setFxRateRef,
  sharedBudgetSummaryRef,
  spendingAnomaliesRef,
  startLowSpendResetRef,
  subscriptionsOverviewRef,
  taxEstimateRef,
  upsertWeeklyMoneyCheckinRef,
} from "../../../lib/finance-refs";
import { formatGhs } from "../../../lib/ghs";
import { Button, SectionLabel } from "../../../components/ui";
import { styles } from "../../../components/finance/routeShared";

export default function FinanceInsightsScreen() {
  const { toast } = useToast();
  const monthlyClose = useQuery(monthlyCloseSummaryRef, {});
  const budgetDepth = useQuery(budgetDepthRef, {});
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

  const startLowSpendReset = useMutation(startLowSpendResetRef);
  const upsertWeeklyMoneyCheckin = useMutation(upsertWeeklyMoneyCheckinRef);
  const setFxRate = useMutation(setFxRateRef);
  const setFinanceSecuritySettings = useMutation(setFinanceSecuritySettingsRef);

  const [isStartingReset, setIsStartingReset] = React.useState(false);
  const [isSavingWeeklyCheckin, setIsSavingWeeklyCheckin] = React.useState(false);

  const isLoading =
    monthlyClose === undefined ||
    budgetDepth === undefined ||
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
    sharedBudgetOverview === undefined;

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
        wins: [monthlyClose?.win || "Stayed consistent this week."],
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Insights</Text>
      <Text style={styles.subtitle}>
        Advanced analytics, anomaly controls, and finance diagnostics.
      </Text>

      {isLoading ? (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <SectionLabel>Budget Depth</SectionLabel>
            <View style={styles.recurringCard}>
              {(budgetDepth || []).slice(0, 8).map((row) => (
                <View key={`budget-depth:${row.envelopeId}`} style={styles.hintReviewRow}>
                  <Text style={styles.recurringTitle}>{row.name}</Text>
                  <Text style={styles.recurringMeta}>
                    Ceiling {formatGhs(row.ceiling)} · Spent {formatGhs(row.currentSpent)} ·
                    Rollover {formatGhs(row.rollover)} · Available {formatGhs(row.available)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <SectionLabel>Anomalies & Reset</SectionLabel>
            <View style={styles.recurringCard}>
              {(spendingAnomalies?.anomalies || []).length === 0 ? (
                <Text style={styles.recurringMeta}>No spending anomalies detected.</Text>
              ) : (
                (spendingAnomalies?.anomalies || []).map((anomaly) => (
                  <Text key={anomaly.type} style={styles.recurringMeta}>
                    {anomaly.headline}
                  </Text>
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
                  style={[
                    styles.cadenceChip,
                    securitySettings?.biometricLockEnabled && styles.cadenceChipSelected,
                  ]}
                  onPress={() => handleToggleSecurity("biometricLockEnabled")}
                >
                  <Text style={styles.cadenceChipText}>Biometric Lock</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.cadenceChip,
                    securitySettings?.offlineModeEnabled && styles.cadenceChipSelected,
                  ]}
                  onPress={() => handleToggleSecurity("offlineModeEnabled")}
                >
                  <Text style={styles.cadenceChipText}>Offline Mode</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.cadenceChip,
                    securitySettings?.conflictSafeSyncEnabled && styles.cadenceChipSelected,
                  ]}
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
                Subscriptions: {subscriptionsOverview?.count || 0} (
                {subscriptionsOverview?.dueSoonCount || 0} due soon) · Monthly{" "}
                {formatGhs(subscriptionsOverview?.monthlyEquivalent || 0)}
              </Text>
              <Text style={styles.recurringMeta}>
                Debt: {formatGhs(debtOverview?.totalBalance || 0)} · Next{" "}
                {debtOverview?.nextFocus?.name || "none"}
              </Text>
              <Text style={styles.recurringMeta}>
                Investments: {formatGhs(investmentOverview?.totalValue || 0)} · PnL{" "}
                {formatGhs(investmentOverview?.unrealizedPnl || 0)}
              </Text>
              <Text style={styles.recurringMeta}>
                Tax Est.: {formatGhs(taxOverview?.estimatedTax || 0)} on income{" "}
                {formatGhs(taxOverview?.ytdIncome || 0)}
              </Text>
              <Text style={styles.recurringMeta}>
                Shared Budget: {formatGhs(sharedBudgetOverview?.totalSpent || 0)} /{" "}
                {formatGhs(sharedBudgetOverview?.totalBudget || 0)}
              </Text>
              <Text style={styles.recurringMeta}>
                Bills due soon: {(billReminders?.dueSoon || []).length}
              </Text>
              <Text style={styles.recurringMeta}>
                Net worth: {formatGhs(netWorthView?.netWorth || 0)} (assets{" "}
                {formatGhs(netWorthView?.assets || 0)} / liabilities{" "}
                {formatGhs(netWorthView?.liabilities || 0)})
              </Text>
              <Text style={styles.recurringMeta}>
                Multi-currency ({multiCurrencySummary?.baseCurrency || "GHS"}):{" "}
                {formatGhs(multiCurrencySummary?.estimatedTotalInBase || 0)}
              </Text>
              <Button label="Set FX Preset (USD/GHS)" onPress={handleSetFxRatePreset} />
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}
