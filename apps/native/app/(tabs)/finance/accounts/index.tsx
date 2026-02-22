import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import {
  accountSummaryRef,
  cashflowForecastRef,
  cashflowSummaryRef,
  contributeSavingsGoalRef,
  hideAccountRef,
  logIncomeRef,
  savingsGoalsRef,
  setSavingsGoalRef,
} from "../../../../lib/finance-refs";
import { formatGhs } from "../../../../lib/ghs";
import { AccountsList } from "../../../../components/finance/FinanceComponents";
import { Button, SectionLabel } from "../../../../components/ui";

export default function FinanceAccountsScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const accountSummary = useQuery(accountSummaryRef, {});
  const cashflow = useQuery(cashflowSummaryRef, {});
  const cashflowForecast = useQuery(cashflowForecastRef, {});
  const goals = useQuery(savingsGoalsRef, {});

  const logIncome = useMutation(logIncomeRef);
  const setSavingsGoal = useMutation(setSavingsGoalRef);
  const contributeSavingsGoal = useMutation(contributeSavingsGoalRef);
  const hideAccount = useMutation(hideAccountRef);

  const incomePresets = React.useMemo(() => [5000, 10000, 25000, 50000], []);

  const [isLoggingIncome, setIsLoggingIncome] = React.useState(false);
  const [isArchivingAccountId, setIsArchivingAccountId] = React.useState<string | null>(null);
  const [showIncomeInput, setShowIncomeInput] = React.useState(false);
  const [customIncomeAmount, setCustomIncomeAmount] = React.useState("");

  const isLoading =
    accountSummary === undefined ||
    cashflow === undefined ||
    cashflowForecast === undefined ||
    goals === undefined;

  const handleLogIncome = async (amount: number) => {
    setIsLoggingIncome(true);
    try {
      await logIncome({
        idempotencyKey: `finance.income:${Date.now()}`,
        amount,
        source: "manual",
      });
      toast.show({ variant: "success", label: "Income logged" });
      setShowIncomeInput(false);
      setCustomIncomeAmount("");
    } catch {
      toast.show({ variant: "danger", label: "Failed to log income" });
    } finally {
      setIsLoggingIncome(false);
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

  const handleArchiveAccount = async (accountId: string, accountName: string) => {
    setIsArchivingAccountId(accountId);
    try {
      await hideAccount({
        accountId: accountId as Id<"accounts">,
        hidden: true,
      });
      toast.show({ variant: "success", label: `${accountName} archived` });
    } catch {
      toast.show({ variant: "danger", label: "Failed to archive account" });
    } finally {
      setIsArchivingAccountId(null);
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

              <View className="h-px bg-border my-1" />

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
                <Pressable
                  className={`border border-border rounded-full px-3 py-1.5 bg-background ${showIncomeInput ? "bg-warning/10 border-warning/20" : ""}`}
                  onPress={() => setShowIncomeInput(!showIncomeInput)}
                >
                  <Text className={`text-xs font-medium ${showIncomeInput ? "text-warning" : "text-foreground"}`}>Custom</Text>
                </Pressable>
              </View>

              {showIncomeInput && (
                <View className="flex-row gap-2 mt-2">
                  <TextInput
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                    placeholder="Enter amount"
                    placeholderTextColor="#6b7280"
                    value={customIncomeAmount}
                    onChangeText={setCustomIncomeAmount}
                    keyboardType="decimal-pad"
                  />
                  <Pressable
                    className="bg-warning rounded-lg px-4 py-2"
                    onPress={() => {
                      const amount = Math.round(parseFloat(customIncomeAmount) * 100);
                      if (amount > 0) {
                        handleLogIncome(amount);
                      }
                    }}
                    disabled={isLoggingIncome || !customIncomeAmount}
                  >
                    <Text className="text-sm font-medium text-background">Add</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>

          <View className="gap-3">
            <View className="flex-row justify-between items-center">
              <SectionLabel>Accounts</SectionLabel>
              <Pressable onPress={() => router.push("/(tabs)/finance/accounts/add" as any)}>
                <Text className="text-sm text-warning font-medium">Add</Text>
              </Pressable>
            </View>
            <AccountsList accounts={accountSummary?.accounts || []} />
            {(accountSummary?.accounts || []).length > 0 ? (
              <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
                <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                  Archive Accounts
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {(accountSummary?.accounts || []).map((account) => (
                    <Pressable
                      key={`archive:${account.accountId}`}
                      className={`rounded-full px-3 py-2 border border-danger/20 bg-danger/10 ${isArchivingAccountId === account.accountId ? "opacity-50" : ""}`}
                      onPress={() => handleArchiveAccount(account.accountId, account.name)}
                      disabled={isArchivingAccountId === account.accountId}
                    >
                      <Text className="text-xs font-medium text-danger">
                        Archive {account.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          <View className="gap-3">
            <View className="flex-row justify-between items-center">
              <SectionLabel>Savings Goals</SectionLabel>
              <Pressable onPress={() => router.push("/(tabs)/finance/savings")}>
                <Text className="text-sm text-warning font-medium">Manage</Text>
              </Pressable>
            </View>
            <View className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
              {(goals || []).length === 0 ? (
                <Text className="text-sm text-muted-foreground">
                  No savings goals. Tap "Manage" to create one.
                </Text>
              ) : (
                <View className="gap-4">
                  {(goals || []).slice(0, 3).map((goal, index) => (
                    <View key={goal.goalId} className={`${index > 0 ? "border-t border-border pt-4" : ""} gap-2`}>
                      <View className="flex-row justify-between items-center">
                        <Text className="text-base font-medium text-foreground">{goal.name}</Text>
                        <Text className="text-sm font-medium text-warning">{Math.round((goal.progress || 0) * 100)}%</Text>
                      </View>
                      <View className="h-1.5 bg-background rounded-full overflow-hidden">
                        <View
                          className="h-full bg-warning rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, (goal.progress || 0) * 100))}%` }}
                        />
                      </View>
                      <View className="flex-row flex-wrap gap-2">
                        {[1000, 5000].map((amount) => (
                          <Pressable
                            key={`${goal.goalId}:${amount}`}
                            className="bg-background border border-border rounded-full px-3 py-1 active:bg-muted"
                            onPress={() => handleContributeGoal(goal.goalId, amount)}
                          >
                            <Text className="text-xs text-foreground font-medium">+{formatGhs(amount)}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ))}
                  {(goals || []).length > 3 && (
                    <Pressable onPress={() => router.push("/(tabs)/finance/savings")}>
                      <Text className="text-sm text-warning text-center">View all {(goals || []).length} goals</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          </View>

          <View className="gap-3">
            <SectionLabel>Quick Navigation</SectionLabel>
            <View className="gap-3">
              {[
                {
                  label: "Transactions",
                  meta: "View all transactions",
                  route: "/(tabs)/finance/transactions",
                },
                {
                  label: "Recurring",
                  meta: "Payment schedules",
                  route: "/(tabs)/finance/recurring",
                },
                {
                  label: "Merchant Hints",
                  meta: "Review suggestions",
                  route: "/(tabs)/finance/merchant-hints",
                },
                {
                  label: "Insights",
                  meta: "Financial analytics",
                  route: "/(tabs)/finance/insights",
                },
                {
                  label: "Debt",
                  meta: "Payoff strategy",
                  route: "/(tabs)/finance/planning/debt",
                },
                {
                  label: "Investments",
                  meta: "Portfolio tracking",
                  route: "/(tabs)/finance/planning/investments",
                },
                {
                  label: "Subscriptions",
                  meta: "Recurring services",
                  route: "/(tabs)/finance/planning/subscriptions",
                },
                {
                  label: "Shared Budgets",
                  meta: "Group budget views",
                  route: "/(tabs)/finance/planning/shared-budgets",
                },
              ].map((nav) => (
                <Pressable
                  key={nav.route}
                  className="bg-surface rounded-2xl border border-border p-4 flex-row justify-between items-center active:bg-muted/10"
                  onPress={() => router.push(nav.route as any)}
                >
                  <View>
                    <Text className="text-base font-medium text-foreground">{nav.label}</Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">{nav.meta}</Text>
                  </View>
                  <Text className="text-muted-foreground opacity-50">→</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}
