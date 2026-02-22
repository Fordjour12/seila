import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { api } from "@seila/backend/convex/_generated/api";
import { useQuery } from "convex/react";

import {
  accountSummaryRef,
  merchantHintReviewRef,
  monthlyCloseSummaryRef,
  recurringTransactionsRef,
} from "@/lib/finance-refs";
import { formatGhs } from "@/lib/ghs";
import { EnvelopesList } from "@/components/finance/FinanceComponents";
import { Button, SectionLabel } from "@/components/ui";

export default function FinanceScreen() {
  const router = useRouter();
  const envelopes = useQuery(api.queries.envelopeSummary.envelopeSummary);
  const transactions = useQuery(api.queries.transactionInbox.transactionInbox, {
    pendingOnly: true,
    limit: 20,
  });
  const spendingTrend = useQuery(api.queries.spendingTrend.spendingTrend, {
    weeks: 6,
  });
  const monthlyClose = useQuery(monthlyCloseSummaryRef, {});
  const recurringTransactions = useQuery(recurringTransactionsRef, {
    limit: 8,
  });
  const merchantHintReview = useQuery(merchantHintReviewRef, { limit: 8 });
  const accountSummary = useQuery(accountSummaryRef, {});

  const isLoading =
    envelopes === undefined ||
    spendingTrend === undefined ||
    monthlyClose === undefined ||
    transactions === undefined ||
    recurringTransactions === undefined ||
    merchantHintReview === undefined ||
    accountSummary === undefined;

  const monthlySpent = (envelopes || []).reduce(
    (sum, envelope) => sum + envelope.spent,
    0,
  );
  const monthlyBudget = (envelopes || []).reduce(
    (sum, envelope) => sum + (envelope.softCeiling || 0),
    0,
  );
  const overspentCount = (envelopes || []).filter(
    (envelope) =>
      typeof envelope.softCeiling === "number" &&
      envelope.softCeiling > 0 &&
      envelope.utilization > 1,
  ).length;
  const trendMax = Math.max(
    ...(spendingTrend || []).map((point) => point.total),
    1,
  );

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-6 pb-24 gap-6"
    >
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">
          Finance
        </Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Hub for spending, accounts, recurring bills, and insights.
        </Text>
      </View>

      {isLoading ? (
        <View className="py-12 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading...</Text>
        </View>
      ) : (
        <>
          <View>
            <View className="gap-3">
              <SectionLabel>Monthly Snapshot</SectionLabel>
              <View className="flex-row gap-2">
                <View className="flex-1 bg-surface rounded-2xl border border-border p-4 gap-1 shadow-sm">
                  <Text className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    Spent
                  </Text>
                  <Text className="text-xl font-medium text-foreground">
                    {formatGhs(monthlySpent)}
                  </Text>
                </View>
                <View className="flex-1 bg-surface rounded-2xl border border-border p-4 gap-1 shadow-sm">
                  <Text className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    Over
                  </Text>
                  <Text className="text-xl font-medium text-foreground">
                    {overspentCount}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-1 bg-surface rounded-2xl border border-border p-4 mt-4 gap-1 shadow-sm">
              <Text className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                Budget
              </Text>
              <Text className="text-xl font-medium text-foreground">
                {formatGhs(monthlyBudget)}
              </Text>
            </View>
          </View>

          <View className="bg-surface rounded-2xl border border-border p-4 gap-4 shadow-sm mt-1">
            <Text className="text-sm font-medium text-foreground">
              6-Week Spend Trend
            </Text>
            <View className="h-24 flex-row items-end gap-2">
              {(spendingTrend || []).map((point) => (
                <View
                  key={point.weekStart}
                  className="flex-1 h-full justify-end bg-background rounded-lg overflow-hidden border border-border/50"
                >
                  <View
                    className="w-full bg-warning rounded-lg"
                    style={[
                      {
                        height: `${Math.max((point.total / trendMax) * 100, 8)}%`,
                      },
                    ]}
                  />
                </View>
              ))}
            </View>
          </View>

          <View className="gap-3">
            <View className="flex-row justify-between items-center">
              <SectionLabel>Budget Envelopes</SectionLabel>
              <Pressable
                onPress={() => router.push("/(tabs)/finance/envelopes/add" as any)}
              >
                <Text className="text-sm text-warning font-medium">Add</Text>
              </Pressable>
            </View>
            <EnvelopesList
              envelopes={envelopes || []}
              onEnvelopePress={(envelopeId) =>
                router.push(`/(tabs)/finance/envelopes/edit?id=${envelopeId}` as any)
              }
            />
          </View>

          <View className="gap-3">
            <SectionLabel>Actions</SectionLabel>
            <View className="flex-row flex-wrap gap-2">
              <Pressable
                className="bg-surface rounded-2xl border border-border p-4 flex-1 min-w-[140] gap-1 shadow-sm active:bg-muted/10"
                onPress={() => router.push("/(tabs)/finance/transactions/add" as any)}
              >
                <Text className="text-base font-medium text-foreground">
                  Log Transaction
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Manual expense entry
                </Text>
              </Pressable>
              <Pressable
                className="bg-surface rounded-2xl border border-border p-4 flex-1 min-w-[140] gap-1 shadow-sm active:bg-muted/10"
                onPress={() => router.push("/(tabs)/finance/recurring/add" as any)}
              >
                <Text className="text-base font-medium text-foreground">
                  Add Recurring
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Payment schedule
                </Text>
              </Pressable>
            </View>
          </View>

          <View className="gap-3">
            <SectionLabel>Quick Navigation</SectionLabel>
            <View className="gap-3">
              {[
                {
                  label: "Transactions",
                  meta: `Pending imports: ${(transactions || []).length}`,
                  route: "/(tabs)/finance/transactions",
                },
                {
                  label: "Recurring",
                  meta: `Active schedules: ${(recurringTransactions || []).length}`,
                  route: "/(tabs)/finance/recurring",
                },
                {
                  label: "Accounts",
                  meta: `Tracked accounts: ${(accountSummary?.accounts || []).length}`,
                  route: "/(tabs)/finance/accounts",
                },
                {
                  label: "Merchant Hints",
                  meta: `Review rows: ${(merchantHintReview || []).length}`,
                  route: "/(tabs)/finance/merchant-hints",
                },
                {
                  label: "Insights",
                  meta: "Advanced metrics and anomalies",
                  route: "/(tabs)/finance/insights",
                },
                {
                  label: "Debt",
                  meta: "Prioritize payoff strategy",
                  route: "/(tabs)/finance/planning/debt",
                },
                {
                  label: "Investments",
                  meta: "Track portfolio value",
                  route: "/(tabs)/finance/planning/investments",
                },
                {
                  label: "Subscriptions",
                  meta: "Manage recurring services",
                  route: "/(tabs)/finance/planning/subscriptions",
                },
                {
                  label: "Shared Budgets",
                  meta: "Collaborative envelopes",
                  route: "/(tabs)/finance/planning/shared-budgets",
                },
              ].map((nav) => (
                <Pressable
                  key={nav.route}
                  className="bg-surface rounded-2xl border border-border p-4 flex-row justify-between items-center shadow-sm active:bg-muted/10"
                  onPress={() => router.push(nav.route as any)}
                >
                  <View>
                    <Text className="text-base font-medium text-foreground">
                      {nav.label}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">
                      {nav.meta}
                    </Text>
                  </View>
                  <Text className="text-muted-foreground opacity-50">→</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="gap-3 pb-8">
            <SectionLabel>Monthly Close</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-5 gap-3 shadow-sm">
              <Text className="text-lg font-medium text-foreground">
                {monthlyClose?.win}
              </Text>
              <View className="h-px bg-border" />
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted-foreground">
                  Spent {formatGhs(monthlyClose?.totalSpent || 0)} / Budget{" "}
                  {formatGhs(monthlyClose?.totalBudget || 0)}
                </Text>
              </View>
              {(monthlyClose?.overspendAreas || []).length > 0 ? (
                <Text className="text-sm font-medium text-danger">
                  Overspend: {(monthlyClose?.overspendAreas || []).join(", ")}
                </Text>
              ) : null}
              <View className="bg-warning/10 border border-warning/20 rounded-xl p-3">
                <Text className="text-xs text-warning leading-relaxed">
                  <Text className="font-bold">Focus:</Text>{" "}
                  {monthlyClose?.focus}
                </Text>
              </View>
              <Button
                variant="ghost"
                label="View Full Insights"
                onPress={() => router.push("/(tabs)/finance/insights")}
              />
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}
