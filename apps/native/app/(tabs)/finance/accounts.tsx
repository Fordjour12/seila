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
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Accounts & Goals</Text>
        <Text className="text-sm text-muted-foreground mt-1">Track balances, runway, and savings progress.</Text>
      </View>

      {isLoading ? (
        <View className="py-12 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading...</Text>
        </View>
      ) : (
        <>
          <View className="gap-3">
            <SectionLabel>Cashflow & Runway</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Monthly Close</Text>
                  <Text className="text-xl font-medium text-foreground">
                    Net {formatGhs(cashflow?.netCashflow || 0)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Balance</Text>
                  <Text className="text-xl font-medium text-foreground">
                    {formatGhs(cashflow?.totalBalance || 0)}
                  </Text>
                </View>
              </View>

              <View className="h-[1px] bg-border my-1" />

              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted-foreground">
                  In {formatGhs(cashflow?.monthIncome || 0)} · Out {formatGhs(cashflow?.monthExpense || 0)}
                </Text>
                <Text className="text-sm text-warning font-medium">
                  Runway: {cashflow?.runwayDays === null ? "Stable" : `${cashflow?.runwayDays} days`}
                </Text>
              </View>

              <View className="flex-row flex-wrap gap-2 mt-2">
                {incomePresets.map((preset) => (
                  <Pressable
                    key={preset}
                    className={`border border-border rounded-full px-3 py-1.5 bg-background ${isLoggingIncome ? "opacity-50" : "active:bg-muted"}`}
                    onPress={() => handleLogIncome(preset)}
                    disabled={isLoggingIncome}
                  >
                    <Text className="text-xs text-foreground font-medium">+{formatGhs(preset)}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View className="gap-3">
            <View className="flex-row justify-between items-center">
              <SectionLabel>Accounts</SectionLabel>
              <Pressable onPress={() => router.push("/(tabs)/finance/add-account")}>
                <Text className="text-sm text-warning font-medium">Add</Text>
              </Pressable>
            </View>
            <AccountsList accounts={accountSummary?.accounts || []} />
          </View>

          <View className="gap-3">
            <SectionLabel>Savings Goals</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
              {(goals || []).length === 0 ? (
                <View className="gap-3">
                  <Text className="text-sm text-muted-foreground">No active goals. Start saving with a preset.</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {goalPresets.map((preset) => (
                      <Pressable
                        key={preset.name}
                        className={`border border-border rounded-full px-3 py-1.5 bg-background ${isAddingGoal ? "opacity-50" : "active:bg-muted"}`}
                        onPress={() => handleQuickAddGoal(preset.name, preset.targetAmount)}
                        disabled={isAddingGoal}
                      >
                        <Text className="text-xs text-foreground font-medium">{preset.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : (
                <View className="gap-4">
                  {(goals || []).map((goal, index) => (
                    <View key={goal.goalId} className={`${index > 0 ? "border-t border-border pt-4" : ""} gap-3`}>
                      <View className="flex-row justify-between items-center">
                        <View>
                          <Text className="text-base text-foreground font-medium">{goal.name}</Text>
                          <Text className="text-xs text-muted-foreground mt-0.5">
                            {formatGhs(goal.currentAmount)} / {formatGhs(goal.targetAmount)}
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-sm font-medium text-warning">{Math.round((goal.progress || 0) * 100)}%</Text>
                        </View>
                      </View>
                      
                      <View className="h-1.5 bg-border rounded-full overflow-hidden">
                        <View 
                          className="h-full bg-warning rounded-full" 
                          style={{ width: `${Math.min(100, Math.max(0, (goal.progress || 0) * 100))}%` }} 
                        />
                      </View>

                      <View className="flex-row flex-wrap gap-2 mt-1">
                        {[1000, 5000, 10000].map((amount) => (
                          <Pressable
                            key={`${goal.goalId}:${amount}`}
                            className="bg-background border border-border rounded-full px-3 py-1.5 active:bg-muted"
                            onPress={() => handleContributeGoal(goal.goalId, amount)}
                          >
                            <Text className="text-xs text-foreground font-medium">+{formatGhs(amount)}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}
              
              <View className="mt-5 pt-4 border-t border-border">
                <Text className="text-xs text-muted-foreground leading-relaxed">
                  Micro-savings simulation: <Text className="text-foreground font-medium">{formatGhs(savingsSimulation?.microSavingsMonthly || 0)}</Text> / month · <Text className="text-foreground font-medium">{formatGhs(savingsSimulation?.allocationPerGoal || 0)}</Text> per goal
                </Text>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}
