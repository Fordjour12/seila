import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import {
  accountSummaryRef,
  cashflowForecastRef,
  cashflowSummaryRef,
  contributeSavingsGoalRef,
  logIncomeRef,
  savingsGoalsRef,
  savingsSimulationRef,
  setSavingsGoalRef,
} from "../../../lib/finance-refs";
import { formatGhs } from "../../../lib/ghs";
import { AccountsList } from "../../../components/finance/FinanceComponents";
import { Button, SectionLabel } from "../../../components/ui";
import { styles } from "../../../components/finance/routeShared";

export default function FinanceAccountsScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const accountSummary = useQuery(accountSummaryRef, {});
  const cashflow = useQuery(cashflowSummaryRef, {});
  const cashflowForecast = useQuery(cashflowForecastRef, {});
  const goals = useQuery(savingsGoalsRef, {});
  const savingsSimulation = useQuery(savingsSimulationRef, {});

  const logIncome = useMutation(logIncomeRef);
  const setSavingsGoal = useMutation(setSavingsGoalRef);
  const contributeSavingsGoal = useMutation(contributeSavingsGoalRef);

  const incomePresets = React.useMemo(() => [5000, 10000, 25000, 50000], []);
  const goalPresets = React.useMemo(
    () => [
      { name: "Emergency Fund", targetAmount: 300000 },
      { name: "Travel Buffer", targetAmount: 120000 },
      { name: "Device Upgrade", targetAmount: 80000 },
    ],
    [],
  );

  const [isAddingGoal, setIsAddingGoal] = React.useState(false);
  const [isLoggingIncome, setIsLoggingIncome] = React.useState(false);

  const isLoading =
    accountSummary === undefined ||
    cashflow === undefined ||
    cashflowForecast === undefined ||
    goals === undefined ||
    savingsSimulation === undefined;

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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Accounts & Goals</Text>
      <Text style={styles.subtitle}>Track balances, runway, and savings progress.</Text>

      {isLoading ? (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <SectionLabel>Cashflow & Runway</SectionLabel>
            <View style={styles.monthlyCloseCard}>
              <Text style={styles.monthlyCloseMetric}>
                Income {formatGhs(cashflow?.monthIncome || 0)} · Expense{" "}
                {formatGhs(cashflow?.monthExpense || 0)}
              </Text>
              <Text style={styles.monthlyCloseWin}>
                Net {formatGhs(cashflow?.netCashflow || 0)} · Balance{" "}
                {formatGhs(cashflow?.totalBalance || 0)}
              </Text>
              <Text style={styles.monthlyCloseFocus}>
                Runway: {cashflow?.runwayDays === null ? "stable" : `${cashflow?.runwayDays} days`}
              </Text>
              <Text style={styles.monthlyCloseMetric}>
                Forecast 30d: {formatGhs(cashflowForecast?.forecast30Net || 0)} (in{" "}
                {formatGhs(cashflowForecast?.expectedIncome30 || 0)} / out{" "}
                {formatGhs(cashflowForecast?.expectedExpense30 || 0)})
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
            <Button
              label="Add Account"
              onPress={() => router.push("/(tabs)/finance/add-account")}
            />
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
                Micro-savings simulation: {formatGhs(savingsSimulation?.microSavingsMonthly || 0)} /
                month · {formatGhs(savingsSimulation?.allocationPerGoal || 0)} per goal
              </Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}
