import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import { api } from "@seila/backend/convex/_generated/api";
import { sharedBudgetSummaryRef, setSharedBudgetRef } from "../../../../lib/finance-refs";
import { formatGhs } from "../../../../lib/ghs";
import { EnvelopesList } from "../../../../components/finance/FinanceComponents";
import { Button, SectionLabel } from "../../../../components/ui";

interface ActionSheetOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

function ActionSheet({
  visible,
  onClose,
  title,
  options,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: ActionSheetOption[];
}) {
  if (!visible) return null;

  return (
    <View className="absolute inset-0 bg-black/50 justify-end z-50">
      <Pressable className="flex-1" onPress={onClose} />
      <View className="bg-surface rounded-t-3xl border-t border-border p-4 gap-2 pb-8">
        <Text className="text-lg font-medium text-foreground text-center pb-4">{title}</Text>
        {options.map((option, index) => (
          <Pressable
            key={index}
            className={`p-4 rounded-xl ${
              option.destructive ? "bg-danger/10" : "bg-background"
            }`}
            onPress={() => {
              option.onPress();
              onClose();
            }}
          >
            <Text
              className={`text-center font-medium ${
                option.destructive ? "text-danger" : "text-warning"
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
        <Pressable className="p-4 rounded-xl bg-background mt-2" onPress={onClose}>
          <Text className="text-center font-medium text-muted-foreground">Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function BudgetScreen() {
  const router = useRouter();
  const { toast } = useToast();

  const envelopes = useQuery(api.queries.envelopeSummary.envelopeSummary);
  const sharedBudgetOverview = useQuery(sharedBudgetSummaryRef, {});
  const setSharedBudget = useMutation(setSharedBudgetRef);
  const deleteEnvelope = useMutation(api.commands.accounts.setEnvelope.deleteEnvelope);
  const deleteSharedBudget = useMutation(
    api.commands.accounts.setSharedBudget.deleteSharedBudget,
  );

  const [showSharedForm, setShowSharedForm] = React.useState(false);
  const [editingBudgetId, setEditingBudgetId] = React.useState<Id<"sharedBudgets"> | undefined>();
  const [name, setName] = React.useState("");
  const [budgetAmount, setBudgetAmount] = React.useState("");
  const [spentAmount, setSpentAmount] = React.useState("");
  const [membersInput, setMembersInput] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [longPressTarget, setLongPressTarget] = React.useState<{
    type: "envelope" | "shared";
    id: string;
    name: string;
  } | null>(null);

  const isLoading = envelopes === undefined || sharedBudgetOverview === undefined;

  const totalBudget = (envelopes || []).reduce(
    (sum, env) => sum + (env.softCeiling || 0),
    0,
  );
  const totalSpent = (envelopes || []).reduce((sum, env) => sum + env.spent, 0);
  const sharedTotalBudget = sharedBudgetOverview?.totalBudget || 0;
  const sharedTotalSpent = sharedBudgetOverview?.totalSpent || 0;
  const combinedBudget = totalBudget + sharedTotalBudget;
  const combinedSpent = totalSpent + sharedTotalSpent;

  const resetSharedForm = () => {
    setShowSharedForm(false);
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

  const handleSharedSubmit = async () => {
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
      resetSharedForm();
    } catch {
      toast.show({ variant: "danger", label: "Failed to save shared budget" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const editSharedBudget = (item: {
    sharedBudgetId: string;
    name: string;
    budgetAmount: number;
    spentAmount: number;
    members: string[];
  }) => {
    setEditingBudgetId(item.sharedBudgetId as Id<"sharedBudgets">);
    setName(item.name);
    setBudgetAmount((item.budgetAmount / 100).toString());
    setSpentAmount((item.spentAmount / 100).toString());
    setMembersInput(item.members.join(", "));
    setShowSharedForm(true);
  };

  const handleDeleteEnvelope = async () => {
    if (!longPressTarget || longPressTarget.type !== "envelope") return;
    try {
      await deleteEnvelope({
        envelopeId: longPressTarget.id as Id<"envelopes">,
      });
      toast.show({ variant: "success", label: "Envelope deleted" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to delete envelope" });
    }
  };

  const handleDeleteSharedBudget = async () => {
    if (!longPressTarget || longPressTarget.type !== "shared") return;
    try {
      await deleteSharedBudget({
        sharedBudgetId: longPressTarget.id as Id<"sharedBudgets">,
      });
      toast.show({ variant: "success", label: "Shared budget deleted" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to delete shared budget" });
    }
  };

  const getActionSheetOptions = (): ActionSheetOption[] => {
    if (!longPressTarget) return [];

    if (longPressTarget.type === "envelope") {
      return [
        {
          label: "Edit Envelope",
          onPress: () => router.push(`/(tabs)/finance/budget/edit?id=${longPressTarget.id}`),
        },
        {
          label: "Delete Envelope",
          onPress: handleDeleteEnvelope,
          destructive: true,
        },
      ];
    }

    return [
      {
        label: "Edit Shared Budget",
        onPress: () => {
          const item = sharedBudgetOverview?.items.find(
            (i) => i.sharedBudgetId === longPressTarget.id,
          );
          if (item) editSharedBudget(item);
        },
      },
      {
        label: "Delete Shared Budget",
        onPress: handleDeleteSharedBudget,
        destructive: true,
      },
    ];
  };

  if (isLoading) {
    return (
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24">
        <View className="mb-2">
          <Text className="text-3xl font-serif text-foreground tracking-tight">Budget</Text>
          <Text className="text-sm text-muted-foreground mt-1">
            Personal envelopes and shared group budgets.
          </Text>
        </View>
        <View className="py-12 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading...</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Budget</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Personal envelopes and shared group budgets.
        </Text>
      </View>

      <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
        <Text className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
          Combined Overview
        </Text>
        <View className="flex-row gap-3">
          <View className="flex-1 gap-1">
            <Text className="text-xs text-muted-foreground">Budget</Text>
            <Text className="text-xl font-medium text-foreground">{formatGhs(combinedBudget)}</Text>
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-xs text-muted-foreground">Spent</Text>
            <Text className="text-xl font-medium text-foreground">{formatGhs(combinedSpent)}</Text>
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-xs text-muted-foreground">Remaining</Text>
            <Text
              className={`text-xl font-medium ${
                combinedBudget - combinedSpent >= 0 ? "text-success" : "text-danger"
              }`}
            >
              {formatGhs(combinedBudget - combinedSpent)}
            </Text>
          </View>
        </View>
      </View>

      <View className="gap-3">
        <View className="flex-row justify-between items-center">
          <SectionLabel>Personal Envelopes</SectionLabel>
          <Pressable onPress={() => router.push("/(tabs)/finance/budget/add")}>
            <Text className="text-sm text-warning font-medium">Add</Text>
          </Pressable>
        </View>
        <EnvelopesList
          envelopes={envelopes || []}
          onEnvelopePress={(envelopeId) =>
            router.push(`/(tabs)/finance/budget/edit?id=${envelopeId}`)
          }
          onEnvelopeLongPress={(envelope) =>
            setLongPressTarget({
              type: "envelope",
              id: envelope.envelopeId,
              name: envelope.name,
            })
          }
        />
      </View>

      <View className="gap-3">
        <View className="flex-row justify-between items-center">
          <SectionLabel>Shared Budgets</SectionLabel>
          <Pressable onPress={() => setShowSharedForm(!showSharedForm)}>
            <Text className="text-sm text-warning font-medium">
              {showSharedForm ? "Cancel" : "Add"}
            </Text>
          </Pressable>
        </View>

        {showSharedForm && (
          <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
            <Text className="text-sm font-medium text-foreground">
              {editingBudgetId ? "Edit Shared Budget" : "New Shared Budget"}
            </Text>
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
                label={isSubmitting ? "Saving..." : editingBudgetId ? "Save" : "Add"}
                onPress={handleSharedSubmit}
                disabled={isSubmitting}
              />
              {editingBudgetId && (
                <Button label="Cancel" variant="ghost" onPress={resetSharedForm} />
              )}
            </View>
          </View>
        )}

        <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
          {(sharedBudgetOverview?.items || []).length === 0 && !showSharedForm ? (
            <Text className="text-sm text-muted-foreground">No shared budgets yet.</Text>
          ) : (
            (sharedBudgetOverview?.items || []).map((item) => (
              <Pressable
                key={item.sharedBudgetId}
                className="border border-border rounded-xl p-3 gap-2 bg-background"
                onPress={() => editSharedBudget(item)}
                onLongPress={() =>
                  setLongPressTarget({
                    type: "shared",
                    id: item.sharedBudgetId,
                    name: item.name,
                  })
                }
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-medium text-foreground">{item.name}</Text>
                  <Text className="text-sm text-warning font-medium">
                    {Math.round(
                      item.budgetAmount > 0 ? item.spentAmount / item.budgetAmount : 0,
                    ) * 100}
                    %
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

      <ActionSheet
        visible={!!longPressTarget}
        onClose={() => setLongPressTarget(null)}
        title={longPressTarget ? `What to do with "${longPressTarget.name}"?` : ""}
        options={getActionSheetOptions()}
      />
    </ScrollView>
  );
}
