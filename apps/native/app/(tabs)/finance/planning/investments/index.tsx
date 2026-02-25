import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";

import { investmentSummaryRef } from "../../../../../lib/finance-refs";
import { formatGhs } from "../../../../../lib/ghs";
import { Button, SectionLabel } from "../../../../../components/ui";

export default function FinanceInvestmentsIndexScreen() {
  const router = useRouter();
  const investmentOverview = useQuery(investmentSummaryRef, {});

  const isLoading = investmentOverview === undefined;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Investments</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Track holdings, value, and unrealized gain or loss.
        </Text>
      </View>

      {isLoading ? (
        <View className="py-12 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading...</Text>
        </View>
      ) : (
        <>
          <View className="gap-3">
            <SectionLabel>Portfolio Snapshot</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-4 gap-1 shadow-sm">
              <Text className="text-sm text-muted-foreground">Total value</Text>
              <Text className="text-xl font-medium text-foreground">
                {formatGhs(investmentOverview?.totalValue || 0)}
              </Text>
              <Text className="text-sm text-muted-foreground">
                Cost basis {formatGhs(investmentOverview?.totalCostBasis || 0)}
              </Text>
              <Text className={`text-sm font-medium ${(investmentOverview?.unrealizedPnl || 0) >= 0 ? "text-success" : "text-danger"}`}>
                Unrealized PnL {formatGhs(investmentOverview?.unrealizedPnl || 0)}
              </Text>
              <Button
                label="Add Investment"
                onPress={() => router.push("/(tabs)/finance/planning/investments/add" as any)}
              />
            </View>
          </View>

          <View className="gap-3">
            <SectionLabel>Holdings</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
              {(investmentOverview?.items || []).length === 0 ? (
                <Text className="text-sm text-muted-foreground">No investments yet.</Text>
              ) : (
                (investmentOverview?.items || []).map((item) => (
                  <Pressable
                    key={item.investmentId}
                    className="border border-border rounded-xl p-3 gap-2 bg-background"
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/finance/planning/investments/edit",
                        params: { id: item.investmentId },
                      } as any)
                    }
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-base font-medium text-foreground">{item.name}</Text>
                      <Text className="text-xs text-muted-foreground uppercase">{item.type}</Text>
                    </View>
                    <Text className="text-sm text-foreground">
                      Value {formatGhs(item.currentValue)} · Cost {formatGhs(item.costBasis)}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}
