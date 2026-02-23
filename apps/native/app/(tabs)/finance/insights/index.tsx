import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
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
  netWorthViewRef,
  recurringTransactionsRef,
  setFinanceSecuritySettingsRef,
  sharedBudgetSummaryRef,
  spendingAnomaliesRef,
  startLowSpendResetRef,
  taxEstimateRef,
  upsertWeeklyMoneyCheckinRef,
} from "../../../../lib/finance-refs";
import { formatGhs } from "../../../../lib/ghs";
import { Button, SectionLabel } from "../../../../components/ui";

export default function FinanceInsightsScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const monthlyClose = useQuery(monthlyCloseSummaryRef, {});
  const budgetDepth = useQuery(budgetDepthRef, {});
  const spendingAnomalies = useQuery(spendingAnomaliesRef, {});
  const weeklyMoneyCheckin = useQuery(currentWeeklyMoneyCheckinRef, {});
  const securitySettings = useQuery(financeSecuritySettingsRef, {});
  const monthlyCloseExport = useQuery(monthlyCloseExportRef, {});
  const billReminders = useQuery(billRemindersRef, {});
  const netWorthView = useQuery(netWorthViewRef, {});
  const recurringTransactions = useQuery(recurringTransactionsRef, { limit: 100 });
  const debtOverview = useQuery(debtStrategyRef, { strategy: "avalanche" });
  const investmentOverview = useQuery(investmentSummaryRef, {});
  const taxOverview = useQuery(taxEstimateRef, {});
  const sharedBudgetOverview = useQuery(sharedBudgetSummaryRef, {});

  const startLowSpendReset = useMutation(startLowSpendResetRef);
  const upsertWeeklyMoneyCheckin = useMutation(upsertWeeklyMoneyCheckinRef);
  const setFinanceSecuritySettings = useMutation(setFinanceSecuritySettingsRef);

  const [isStartingReset, setIsStartingReset] = React.useState(false);
  const [isSavingWeeklyCheckin, setIsSavingWeeklyCheckin] = React.useState(false);

  const subscriptionCount = (recurringTransactions || []).filter((t) => t.kind === "subscription").length;
  const subscriptionMonthly = (recurringTransactions || [])
    .filter((t) => t.kind === "subscription")
    .reduce((sum, t) => {
      if (t.cadence === "weekly") return sum + t.amount * 4.345;
      if (t.cadence === "biweekly") return sum + t.amount * 2.1725;
      return sum + t.amount;
    }, 0);

  const isLoading =
    monthlyClose === undefined ||
    budgetDepth === undefined ||
    spendingAnomalies === undefined ||
    weeklyMoneyCheckin === undefined ||
    securitySettings === undefined ||
    monthlyCloseExport === undefined ||
    billReminders === undefined ||
    netWorthView === undefined ||
    recurringTransactions === undefined ||
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
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Insights</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Advanced analytics, anomaly controls, and diagnostics.
        </Text>
      </View>

      {isLoading ? (
        <View className="py-12 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading...</Text>
        </View>
      ) : (
        <>
          <View className="gap-3">
            <SectionLabel>Budget Depth</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-4 gap-4 shadow-sm">
              {(budgetDepth || []).slice(0, 8).map((row, idx) => (
                <View key={`budget-depth:${row.envelopeId}`} className={`gap-1 ${idx > 0 ? "pt-3 border-t border-border/50" : ""}`}>
                  <Text className="text-base font-medium text-foreground">{row.name}</Text>
                  <View className="flex-row flex-wrap gap-x-3 gap-y-1">
                    <Text className="text-xs text-muted-foreground">Budget: {formatGhs(row.ceiling)}</Text>
                    <Text className="text-xs text-muted-foreground">Spent: {formatGhs(row.currentSpent)}</Text>
                    <Text className="text-xs text-warning font-medium">Available: {formatGhs(row.available)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View className="gap-3">
            <SectionLabel>Anomalies & Reset</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-5 gap-4 shadow-sm">
              <View className="gap-2">
                {(spendingAnomalies?.anomalies || []).length === 0 ? (
                  <Text className="text-sm text-muted-foreground italic">No spending anomalies detected.</Text>
                ) : (
                  (spendingAnomalies?.anomalies || []).map((anomaly) => (
                    <View key={anomaly.type} className="bg-danger/5 border border-danger/20 rounded-xl p-3">
                      <Text className="text-sm text-danger font-medium">{anomaly.headline}</Text>
                    </View>
                  ))
                )}
              </View>
              <Button
                variant="primary"
                label={isStartingReset ? "Starting..." : "Start 2-Day Low Spend Reset"}
                onPress={handleStartLowSpendReset}
                disabled={isStartingReset}
              />
            </View>
          </View>

          <View className="gap-3">
            <SectionLabel>Weekly Money Check-in</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-5 gap-4 shadow-sm">
              {weeklyMoneyCheckin ? (
                <View className="bg-warning/10 border border-warning/20 rounded-xl p-3">
                  <Text className="text-xs text-warning leading-relaxed">
                    <Text className="font-bold">Latest Focus:</Text> {weeklyMoneyCheckin.focus}
                  </Text>
                </View>
              ) : (
                <Text className="text-sm text-muted-foreground">No weekly check-in saved yet.</Text>
              )}
              <Button
                variant="outline"
                label={isSavingWeeklyCheckin ? "Saving..." : "Save Weekly Check-in"}
                onPress={handleSaveWeeklyMoneyCheckin}
                disabled={isSavingWeeklyCheckin}
              />
            </View>
          </View>

          <View className="gap-3">
            <SectionLabel>Monthly Close Export</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-4 gap-2 shadow-sm">
              <Text className="text-sm text-foreground leading-relaxed">{monthlyCloseExport?.shareText}</Text>
              <View className="flex-row items-center gap-2 mt-1">
                <View className="bg-muted/10 rounded-full px-2 py-0.5 border border-border/50">
                  <Text className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    CSV rows: {Math.max((monthlyCloseExport?.csv || "").split("\n").length - 1, 0)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View className="gap-3">
            <SectionLabel>Security & Sync</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
              <View className="flex-row flex-wrap gap-2">
                {[
                  { key: "biometricLockEnabled", label: "Biometric Lock" },
                  { key: "offlineModeEnabled", label: "Offline Mode" },
                  { key: "conflictSafeSyncEnabled", label: "Conflict-safe Sync" },
                ].map((item) => (
                  <Pressable
                    key={item.key}
                    className={`rounded-full px-4 py-2 border ${securitySettings?.[item.key as keyof typeof securitySettings] ? "bg-warning/10 border-warning/30" : "bg-background border-border"}`}
                    onPress={() => handleToggleSecurity(item.key as any)}
                  >
                    <Text className={`text-xs font-medium ${securitySettings?.[item.key as keyof typeof securitySettings] ? "text-warning" : "text-foreground"}`}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View className="gap-3 pb-8">
            <SectionLabel>Advanced Overview</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-5 gap-4 shadow-sm">
              <View className="gap-3">
                {[
                  { label: "Subscriptions", value: `${subscriptionCount} active`, meta: formatGhs(subscriptionMonthly) + " / mo" },
                  { label: "Debt Strategy", value: debtOverview?.nextFocus?.name || "None", meta: formatGhs(debtOverview?.totalBalance || 0) + " total" },
                  { label: "Investments", value: formatGhs(investmentOverview?.totalValue || 0), meta: "PnL: " + formatGhs(investmentOverview?.unrealizedPnl || 0) },
                  { label: "Tax Estimate", value: formatGhs(taxOverview?.estimatedTax || 0), meta: "On income: " + formatGhs(taxOverview?.ytdIncome || 0) },
                  { label: "Net Worth", value: formatGhs(netWorthView?.netWorth || 0), meta: `A: ${formatGhs(netWorthView?.assets || 0)} / L: ${formatGhs(netWorthView?.liabilities || 0)}` },
                ].map((item, idx) => (
                  <View key={item.label} className={`flex-row justify-between items-center ${idx > 0 ? "pt-3 border-t border-border/10" : ""}`}>
                    <View>
                      <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{item.label}</Text>
                      <Text className="text-base font-medium text-foreground mt-0.5">{item.value}</Text>
                    </View>
                    <Text className="text-xs text-muted-foreground italic">{item.meta}</Text>
                  </View>
                ))}
              </View>
              <View className="h-px bg-border/50" />
              <View className="gap-2">
                <Button
                  variant="ghost"
                  label="Manage Recurring"
                  onPress={() => router.push("/(tabs)/finance/recurring" as any)}
                />
                <Button
                  variant="ghost"
                  label="Manage Debt"
                  onPress={() => router.push("/(tabs)/finance/planning/debt" as any)}
                />
                <Button
                  variant="ghost"
                  label="Manage Investments"
                  onPress={() => router.push("/(tabs)/finance/planning/investments" as any)}
                />
                <Button
                  variant="ghost"
                  label="Manage Shared Budgets"
                  onPress={() => router.push("/(tabs)/finance/planning/shared-budgets" as any)}
                />
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}
