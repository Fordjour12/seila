import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import { setSharedBudgetRef, sharedBudgetSummaryRef } from "../../../../lib/finance-refs";
import { formatGhs } from "../../../../lib/ghs";
import { Button, SectionLabel } from "../../../../components/ui";

export default function FinanceSharedBudgetsScreen() {
  const { toast } = useToast();
  const sharedBudgetOverview = useQuery(sharedBudgetSummaryRef, {});
  const setSharedBudget = useMutation(setSharedBudgetRef);

  const [editingBudgetId, setEditingBudgetId] = React.useState<Id<"sharedBudgets"> | undefined>();
  const [name, setName] = React.useState("");
  const [budgetAmount, setBudgetAmount] = React.useState("");
  const [spentAmount, setSpentAmount] = React.useState("");
  const [membersInput, setMembersInput] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isLoading = sharedBudgetOverview === undefined;

  const resetForm = () => {
    setEditingBudgetId(undefined);
    setName("");
    setBudgetAmount("");
    setSpentAmount("");
    setMembersInput("");
  };

  const parseMembers = () =>
    membersInput
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

  const handleSubmit = async () => {
    const budgetAmountCents = Math.round(parseFloat(budgetAmount) * 100);
    const spentAmountCents = spentAmount ? Math.round(parseFloat(spentAmount) * 100) : undefined;
    if (!name.trim() || !Number.isInteger(budgetAmountCents) || budgetAmountCents <= 0) {
      toast.show({ variant: "warning", label: "Enter valid shared budget details" });
      return;
    }
    if (spentAmountCents !== undefined && (!Number.isInteger(spentAmountCents) || spentAmountCents < 0)) {
      toast.show({ variant: "warning", label: "Enter a valid spent amount" });
      return;
    }
    const members = parseMembers();

    setIsSubmitting(true);
    try {
      await setSharedBudget({
        idempotencyKey: `finance.shared-budget:${editingBudgetId || "new"}:${Date.now()}`,
        sharedBudgetId: editingBudgetId,
        name: name.trim(),
        budgetAmount: budgetAmountCents,
        spentAmount: spentAmountCents,
        members,
      });
      toast.show({ variant: "success", label: editingBudgetId ? "Shared budget updated" : "Shared budget added" });
      resetForm();
    } catch {
      toast.show({ variant: "danger", label: "Failed to save shared budget" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Shared Budgets</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Track collaborative budgets with spending visibility per group.
        </Text>
      </View>

      {isLoading ? (
        <View className="py-12 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading...</Text>
        </View>
      ) : (
        <>
          <View className="gap-3">
            <SectionLabel>Overview</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-4 gap-1 shadow-sm">
              <Text className="text-sm text-muted-foreground">
                Combined budget {formatGhs(sharedBudgetOverview?.totalBudget || 0)}
              </Text>
              <Text className="text-xl font-medium text-foreground">
                Spent {formatGhs(sharedBudgetOverview?.totalSpent || 0)}
              </Text>
              <Text className="text-sm text-muted-foreground">
                Utilization {Math.round((sharedBudgetOverview?.utilization || 0) * 100)}%
              </Text>
            </View>
          </View>

          <View className="gap-3">
            <SectionLabel>{editingBudgetId ? "Edit Shared Budget" : "Add Shared Budget"}</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
              <TextInput
                className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                placeholder="Budget name"
                placeholderTextColor="#6b7280"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                placeholder="Budget amount (e.g. 5000)"
                placeholderTextColor="#6b7280"
                value={budgetAmount}
                onChangeText={setBudgetAmount}
                keyboardType="decimal-pad"
              />
              <TextInput
                className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                placeholder="Spent amount (optional)"
                placeholderTextColor="#6b7280"
                value={spentAmount}
                onChangeText={setSpentAmount}
                keyboardType="decimal-pad"
              />
              <TextInput
                className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                placeholder="Members (comma-separated)"
                placeholderTextColor="#6b7280"
                value={membersInput}
                onChangeText={setMembersInput}
              />
              <View className="flex-row gap-2">
                <Button
                  label={isSubmitting ? "Saving..." : editingBudgetId ? "Save Shared Budget" : "Add Shared Budget"}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                />
                {editingBudgetId ? (
                  <Button label="Cancel" variant="ghost" onPress={resetForm} />
                ) : null}
              </View>
            </View>
          </View>

          <View className="gap-3">
            <SectionLabel>Groups</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
              {(sharedBudgetOverview?.items || []).length === 0 ? (
                <Text className="text-sm text-muted-foreground">No shared budgets yet.</Text>
              ) : (
                (sharedBudgetOverview?.items || []).map((item) => (
                  <Pressable
                    key={item.sharedBudgetId}
                    className="border border-border rounded-xl p-3 gap-2 bg-background"
                    onPress={() => {
                      setEditingBudgetId(item.sharedBudgetId as Id<"sharedBudgets">);
                      setName(item.name);
                      setBudgetAmount((item.budgetAmount / 100).toString());
                      setSpentAmount((item.spentAmount / 100).toString());
                      setMembersInput(item.members.join(", "));
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-base font-medium text-foreground">{item.name}</Text>
                      <Text className="text-sm text-warning font-medium">
                        {Math.round((item.budgetAmount > 0 ? item.spentAmount / item.budgetAmount : 0) * 100)}%
                      </Text>
                    </View>
                    <Text className="text-sm text-foreground">
                      {formatGhs(item.spentAmount)} / {formatGhs(item.budgetAmount)}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      Members: {item.members.length ? item.members.join(", ") : "None"}
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
