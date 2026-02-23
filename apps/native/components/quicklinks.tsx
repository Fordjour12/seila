import { View, Text, Pressable } from "react-native"
import { SectionLabel } from "@/components/ui"
import { useRouter } from "expo-router"
import { useQuery } from "convex/react";

import { api } from "@seila/backend/convex/_generated/api";

export function QuickLinks() {

    const router = useRouter()
    const envelopes = useQuery(api.queries.envelopeSummary.envelopeSummary);
    const transactions = useQuery(api.queries.transactionInbox.transactionInbox, {
        pendingOnly: true,
        limit: 20,
    });
    const spendingTrend = useQuery(api.queries.spendingTrend.spendingTrend, {
        weeks: 6,
    });


    return (
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
                        label: "Recurring",
                        meta: "All recurring payments",
                        route: "/(tabs)/finance/recurring",
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
        </View>)
}
