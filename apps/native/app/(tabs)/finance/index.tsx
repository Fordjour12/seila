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
} from "../../../lib/finance-refs";
import { formatGhs } from "../../../lib/ghs";
import { EnvelopesList } from "../../../components/finance/FinanceComponents";
import { Button, SectionLabel } from "../../../components/ui";

export default function FinanceScreen() {
  const router = useRouter();
  const envelopes = useQuery(api.queries.envelopeSummary.envelopeSummary);
  const transactions = useQuery(api.queries.transactionInbox.transactionInbox, {
    pendingOnly: true,
    limit: 20,
  });
  const spendingTrend = useQuery(api.queries.spendingTrend.spendingTrend, { weeks: 6 });
  const monthlyClose = useQuery(monthlyCloseSummaryRef, {});
  const recurringTransactions = useQuery(recurringTransactionsRef, { limit: 8 });
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

  const monthlySpent = (envelopes || []).reduce((sum, envelope) => sum + envelope.spent, 0);
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
  const trendMax = Math.max(...(spendingTrend || []).map((point) => point.total), 1);

  return (
    <ScrollView className="flex-1 bg-zinc-950" contentContainerStyle={{ padding: 24, gap: 24 }}>
      <Text className="text-3xl font-bold text-zinc-100">Finance</Text>
      <Text className="text-sm text-zinc-400">
        Hub for spending, accounts, recurring bills, and insights.
      </Text>

      {isLoading ? (
        <View className="p-8 items-center">
          <Text className="text-base text-zinc-500">Loading...</Text>
        </View>
      ) : (
        <>
          <View className="gap-6">
            <SectionLabel>Monthly Snapshot</SectionLabel>
            <View className="flex-row gap-3">
              <View className="flex-1 bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 gap-1">
                <Text className="text-xs text-zinc-500 uppercase font-medium tracking-wider">Spent</Text>
                <Text className="text-xl font-semibold text-zinc-100">{formatGhs(monthlySpent)}</Text>
              </View>
              <View className="flex-1 bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 gap-1">
                <Text className="text-xs text-zinc-500 uppercase font-medium tracking-wider">Budget</Text>
                <Text className="text-xl font-semibold text-zinc-100">{formatGhs(monthlyBudget)}</Text>
              </View>
              <View className="flex-1 bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 gap-1">
                <Text className="text-xs text-zinc-500 uppercase font-medium tracking-wider">Over</Text>
                <Text className="text-xl font-semibold text-zinc-100">{overspentCount}</Text>
              </View>
            </View>
            <View className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5 gap-4">
              <Text className="text-base font-semibold text-zinc-100">6-Week Spend Trend</Text>
              <View className="h-24 flex-row items-end gap-2">
                {(spendingTrend || []).map((point) => (
                  <View key={point.weekStart} className="flex-1 h-full justify-end bg-zinc-950 rounded-lg overflow-hidden">
                    <View
                      className="w-full bg-amber-500 rounded-lg"
                      style={[{ height: `${Math.max((point.total / trendMax) * 100, 8)}%` }]}
                    />
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View className="gap-4">
            <SectionLabel>Budget Envelopes</SectionLabel>
            <Button
              label="Add Envelope"
              onPress={() => router.push("/(tabs)/finance/add-envelope")}
            />
            <EnvelopesList envelopes={envelopes || []} />
          </View>

          <View className="gap-4 mt-6">
            <SectionLabel>Create</SectionLabel>
            <Pressable
              className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 gap-1 active:bg-zinc-800/80"
              onPress={() => router.push("/(tabs)/finance/add-transaction")}
            >
              <Text className="text-base font-semibold text-zinc-100">Log Transaction</Text>
              <Text className="text-sm text-zinc-400">Add a new manual expense entry</Text>
            </Pressable>
            <Pressable
              className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 gap-1 active:bg-zinc-800/80"
              onPress={() => router.push("/(tabs)/finance/add-envelope")}
            >
              <Text className="text-base font-semibold text-zinc-100">Add Envelope</Text>
              <Text className="text-sm text-zinc-400">Create a new category budget bucket</Text>
            </Pressable>
            <Pressable
              className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 gap-1 active:bg-zinc-800/80"
              onPress={() => router.push("/(tabs)/finance/add-recurring")}
            >
              <Text className="text-base font-semibold text-zinc-100">Add Recurring</Text>
              <Text className="text-sm text-zinc-400">Create a recurring payment schedule</Text>
            </Pressable>
            <Pressable
              className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 gap-1 active:bg-zinc-800/80"
              onPress={() => router.push("/(tabs)/finance/add-account")}
            >
              <Text className="text-base font-semibold text-zinc-100">Add Account</Text>
              <Text className="text-sm text-zinc-400">Create a balance-tracking account</Text>
            </Pressable>
          </View>

          <View className="gap-4 mt-6">
            <SectionLabel>Quick Navigation</SectionLabel>
            <Pressable
              className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 gap-1 active:bg-zinc-800/80"
              onPress={() => router.push("/(tabs)/finance/transactions")}
            >
              <Text className="text-base font-semibold text-zinc-100">Transactions</Text>
              <Text className="text-sm text-zinc-400">Pending imports: {(transactions || []).length}</Text>
            </Pressable>
            <Pressable
              className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 gap-1 active:bg-zinc-800/80"
              onPress={() => router.push("/(tabs)/finance/recurring")}
            >
              <Text className="text-base font-semibold text-zinc-100">Recurring</Text>
              <Text className="text-sm text-zinc-400">
                Active schedules: {(recurringTransactions || []).length}
              </Text>
            </Pressable>
            <Pressable
              className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 gap-1 active:bg-zinc-800/80"
              onPress={() => router.push("/(tabs)/finance/accounts")}
            >
              <Text className="text-base font-semibold text-zinc-100">Accounts</Text>
              <Text className="text-sm text-zinc-400">
                Tracked accounts: {(accountSummary?.accounts || []).length}
              </Text>
            </Pressable>
            <Pressable
              className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 gap-1 active:bg-zinc-800/80"
              onPress={() => router.push("/(tabs)/finance/merchant-hints")}
            >
              <Text className="text-base font-semibold text-zinc-100">Merchant Hints</Text>
              <Text className="text-sm text-zinc-400">
                Review rows: {(merchantHintReview || []).length}
              </Text>
            </Pressable>
            <Pressable
              className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 gap-1 active:bg-zinc-800/80"
              onPress={() => router.push("/(tabs)/finance/insights")}
            >
              <Text className="text-base font-semibold text-zinc-100">Insights</Text>
              <Text className="text-sm text-zinc-400">Advanced metrics and anomaly controls</Text>
            </Pressable>
          </View>

          <View className="gap-4 mt-6">
            <SectionLabel>Monthly Close</SectionLabel>
            <View className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5 gap-2">
              <Text className="text-lg font-semibold text-zinc-100">{monthlyClose?.win}</Text>
              <Text className="text-sm text-zinc-400">
                Spent {formatGhs(monthlyClose?.totalSpent || 0)} / Budget{" "}
                {formatGhs(monthlyClose?.totalBudget || 0)}
              </Text>
              {(monthlyClose?.overspendAreas || []).length > 0 ? (
                <Text className="text-sm font-medium text-red-400 mt-1">
                  Overspend: {(monthlyClose?.overspendAreas || []).join(", ")}
                </Text>
              ) : (
                <Text className="text-sm text-zinc-500 mt-1">No overspend areas this month.</Text>
              )}
              <Text className="text-sm font-medium text-amber-500 mt-1">Focus: {monthlyClose?.focus}</Text>
            </View>
            <Button
              label="Open Full Insights"
              onPress={() => router.push("/(tabs)/finance/insights")}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}
