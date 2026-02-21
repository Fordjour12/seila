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
import { styles } from "../../../components/finance/routeShared";

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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Finance</Text>
      <Text style={styles.subtitle}>
        Hub for spending, accounts, recurring bills, and insights.
      </Text>

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
            <Button
              label="Add Envelope"
              onPress={() => router.push("/(tabs)/finance/add-envelope")}
            />
            <EnvelopesList envelopes={envelopes || []} />
          </View>

          <View style={styles.section}>
            <SectionLabel>Create</SectionLabel>
            <Pressable
              style={styles.navCard}
              onPress={() => router.push("/(tabs)/finance/add-transaction")}
            >
              <Text style={styles.navCardTitle}>Log Transaction</Text>
              <Text style={styles.navCardMeta}>Add a new manual expense entry</Text>
            </Pressable>
            <Pressable
              style={styles.navCard}
              onPress={() => router.push("/(tabs)/finance/add-envelope")}
            >
              <Text style={styles.navCardTitle}>Add Envelope</Text>
              <Text style={styles.navCardMeta}>Create a new category budget bucket</Text>
            </Pressable>
            <Pressable
              style={styles.navCard}
              onPress={() => router.push("/(tabs)/finance/add-recurring")}
            >
              <Text style={styles.navCardTitle}>Add Recurring</Text>
              <Text style={styles.navCardMeta}>Create a recurring payment schedule</Text>
            </Pressable>
            <Pressable
              style={styles.navCard}
              onPress={() => router.push("/(tabs)/finance/add-account")}
            >
              <Text style={styles.navCardTitle}>Add Account</Text>
              <Text style={styles.navCardMeta}>Create a balance-tracking account</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <SectionLabel>Quick Navigation</SectionLabel>
            <Pressable
              style={styles.navCard}
              onPress={() => router.push("/(tabs)/finance/transactions")}
            >
              <Text style={styles.navCardTitle}>Transactions</Text>
              <Text style={styles.navCardMeta}>Pending imports: {(transactions || []).length}</Text>
            </Pressable>
            <Pressable
              style={styles.navCard}
              onPress={() => router.push("/(tabs)/finance/recurring")}
            >
              <Text style={styles.navCardTitle}>Recurring</Text>
              <Text style={styles.navCardMeta}>
                Active schedules: {(recurringTransactions || []).length}
              </Text>
            </Pressable>
            <Pressable
              style={styles.navCard}
              onPress={() => router.push("/(tabs)/finance/accounts")}
            >
              <Text style={styles.navCardTitle}>Accounts</Text>
              <Text style={styles.navCardMeta}>
                Tracked accounts: {(accountSummary?.accounts || []).length}
              </Text>
            </Pressable>
            <Pressable
              style={styles.navCard}
              onPress={() => router.push("/(tabs)/finance/merchant-hints")}
            >
              <Text style={styles.navCardTitle}>Merchant Hints</Text>
              <Text style={styles.navCardMeta}>
                Review rows: {(merchantHintReview || []).length}
              </Text>
            </Pressable>
            <Pressable
              style={styles.navCard}
              onPress={() => router.push("/(tabs)/finance/insights")}
            >
              <Text style={styles.navCardTitle}>Insights</Text>
              <Text style={styles.navCardMeta}>Advanced metrics and anomaly controls</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <SectionLabel>Monthly Close</SectionLabel>
            <View style={styles.monthlyCloseCard}>
              <Text style={styles.monthlyCloseWin}>{monthlyClose?.win}</Text>
              <Text style={styles.monthlyCloseMetric}>
                Spent {formatGhs(monthlyClose?.totalSpent || 0)} / Budget{" "}
                {formatGhs(monthlyClose?.totalBudget || 0)}
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
