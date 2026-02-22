import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import { investmentSummaryRef, setInvestmentRef } from "../../../../lib/finance-refs";
import { formatGhs } from "../../../../lib/ghs";
import { Button, SectionLabel } from "../../../../components/ui";

type InvestmentType = "stock" | "fund" | "crypto" | "cash" | "other";

export default function FinanceInvestmentsScreen() {
  const { toast } = useToast();
  const investmentOverview = useQuery(investmentSummaryRef, {});
  const setInvestment = useMutation(setInvestmentRef);

  const [editingInvestmentId, setEditingInvestmentId] = React.useState<Id<"investments"> | undefined>();
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<InvestmentType>("stock");
  const [currentValue, setCurrentValue] = React.useState("");
  const [costBasis, setCostBasis] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isLoading = investmentOverview === undefined;

  const resetForm = () => {
    setEditingInvestmentId(undefined);
    setName("");
    setType("stock");
    setCurrentValue("");
    setCostBasis("");
  };

  const handleSubmit = async () => {
    const currentValueCents = Math.round(parseFloat(currentValue) * 100);
    const costBasisCents = Math.round(parseFloat(costBasis) * 100);
    if (!name.trim() || !Number.isInteger(currentValueCents) || currentValueCents < 0) {
      toast.show({ variant: "warning", label: "Enter valid investment details" });
      return;
    }
    if (!Number.isInteger(costBasisCents) || costBasisCents < 0) {
      toast.show({ variant: "warning", label: "Enter a valid cost basis" });
      return;
    }

    setIsSubmitting(true);
    try {
      await setInvestment({
        idempotencyKey: `finance.investment:${editingInvestmentId || "new"}:${Date.now()}`,
        investmentId: editingInvestmentId,
        name: name.trim(),
        type,
        currentValue: currentValueCents,
        costBasis: costBasisCents,
      });
      toast.show({ variant: "success", label: editingInvestmentId ? "Investment updated" : "Investment added" });
      resetForm();
    } catch {
      toast.show({ variant: "danger", label: "Failed to save investment" });
    } finally {
      setIsSubmitting(false);
    }
  };

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
            </View>
          </View>

          <View className="gap-3">
            <SectionLabel>{editingInvestmentId ? "Edit Investment" : "Add Investment"}</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
              <TextInput
                className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                placeholder="Name"
                placeholderTextColor="#6b7280"
                value={name}
                onChangeText={setName}
              />
              <View className="flex-row flex-wrap gap-2">
                {(["stock", "fund", "crypto", "cash", "other"] as const).map((value) => (
                  <Pressable
                    key={value}
                    className={`rounded-full px-3 py-2 border ${type === value ? "bg-warning/10 border-warning/30" : "bg-background border-border"}`}
                    onPress={() => setType(value)}
                  >
                    <Text className={`text-xs font-medium ${type === value ? "text-warning" : "text-foreground"}`}>
                      {value}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                placeholder="Current value (e.g. 18000)"
                placeholderTextColor="#6b7280"
                value={currentValue}
                onChangeText={setCurrentValue}
                keyboardType="decimal-pad"
              />
              <TextInput
                className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                placeholder="Cost basis (e.g. 15000)"
                placeholderTextColor="#6b7280"
                value={costBasis}
                onChangeText={setCostBasis}
                keyboardType="decimal-pad"
              />
              <View className="flex-row gap-2">
                <Button
                  label={isSubmitting ? "Saving..." : editingInvestmentId ? "Save Investment" : "Add Investment"}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                />
                {editingInvestmentId ? (
                  <Button label="Cancel" variant="ghost" onPress={resetForm} />
                ) : null}
              </View>
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
                    onPress={() => {
                      setEditingInvestmentId(item.investmentId as Id<"investments">);
                      setName(item.name);
                      setType(item.type);
                      setCurrentValue((item.currentValue / 100).toString());
                      setCostBasis((item.costBasis / 100).toString());
                    }}
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
