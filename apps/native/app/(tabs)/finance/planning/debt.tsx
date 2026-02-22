import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import { debtStrategyRef, setDebtRef } from "../../../../lib/finance-refs";
import { formatGhs } from "../../../../lib/ghs";
import { Button, SectionLabel } from "../../../../components/ui";

type Strategy = "snowball" | "avalanche";

export default function FinanceDebtScreen() {
  const { toast } = useToast();
  const [strategy, setStrategy] = React.useState<Strategy>("avalanche");
  const debtOverview = useQuery(debtStrategyRef, { strategy });
  const setDebt = useMutation(setDebtRef);

  const [editingDebtId, setEditingDebtId] = React.useState<Id<"debts"> | undefined>();
  const [name, setName] = React.useState("");
  const [balance, setBalance] = React.useState("");
  const [aprPercent, setAprPercent] = React.useState("");
  const [minPayment, setMinPayment] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isLoading = debtOverview === undefined;

  const resetForm = () => {
    setEditingDebtId(undefined);
    setName("");
    setBalance("");
    setAprPercent("");
    setMinPayment("");
  };

  const handleSubmit = async () => {
    const balanceCents = Math.round(parseFloat(balance) * 100);
    const aprBps = Math.round(parseFloat(aprPercent) * 100);
    const minPaymentCents = Math.round(parseFloat(minPayment) * 100);

    if (!name.trim() || !Number.isInteger(balanceCents) || balanceCents < 0) {
      toast.show({ variant: "warning", label: "Enter valid debt details" });
      return;
    }
    if (!Number.isInteger(aprBps) || aprBps < 0) {
      toast.show({ variant: "warning", label: "Enter a valid APR" });
      return;
    }
    if (!Number.isInteger(minPaymentCents) || minPaymentCents < 0) {
      toast.show({ variant: "warning", label: "Enter a valid minimum payment" });
      return;
    }

    setIsSubmitting(true);
    try {
      await setDebt({
        idempotencyKey: `finance.debt:${editingDebtId || "new"}:${Date.now()}`,
        debtId: editingDebtId,
        name: name.trim(),
        balance: balanceCents,
        aprBps,
        minPayment: minPaymentCents,
      });
      toast.show({ variant: "success", label: editingDebtId ? "Debt updated" : "Debt added" });
      resetForm();
    } catch {
      toast.show({ variant: "danger", label: "Failed to save debt" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (debtId: string, debtName: string) => {
    const debt = (debtOverview?.debts || []).find((item) => item.debtId === debtId);
    if (!debt) return;

    setIsSubmitting(true);
    try {
      await setDebt({
        idempotencyKey: `finance.debt.archive:${debtId}:${Date.now()}`,
        debtId: debtId as Id<"debts">,
        name: debt.name,
        balance: debt.balance,
        aprBps: debt.aprBps,
        minPayment: debt.minPayment,
        isActive: false,
      });
      toast.show({ variant: "success", label: `${debtName} archived` });
      if (editingDebtId === debtId) {
        resetForm();
      }
    } catch {
      toast.show({ variant: "danger", label: "Failed to archive debt" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Debt Management</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Add and manage debts with avalanche or snowball payoff priority.
        </Text>
      </View>

      {isLoading ? (
        <View className="py-12 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading...</Text>
        </View>
      ) : (
        <>
          <View className="gap-3">
            <SectionLabel>Strategy</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
              <View className="flex-row gap-2">
                {(["avalanche", "snowball"] as const).map((value) => (
                  <Pressable
                    key={value}
                    className={`rounded-full px-4 py-2 border ${strategy === value ? "bg-warning/10 border-warning/30" : "bg-background border-border"}`}
                    onPress={() => setStrategy(value)}
                  >
                    <Text className={`text-xs font-medium ${strategy === value ? "text-warning" : "text-foreground"}`}>
                      {value}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text className="text-sm text-muted-foreground">
                Total balance {formatGhs(debtOverview?.totalBalance || 0)} | Minimum payments{" "}
                {formatGhs(debtOverview?.totalMinPayment || 0)}
              </Text>
              <Text className="text-sm text-foreground">
                Next focus: {debtOverview?.nextFocus?.name || "None"}
              </Text>
            </View>
          </View>

          <View className="gap-3">
            <SectionLabel>{editingDebtId ? "Edit Debt" : "Add Debt"}</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
              <TextInput
                className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                placeholder="Debt name"
                placeholderTextColor="#6b7280"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                placeholder="Balance (e.g. 3000)"
                placeholderTextColor="#6b7280"
                value={balance}
                onChangeText={setBalance}
                keyboardType="decimal-pad"
              />
              <TextInput
                className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                placeholder="APR % (e.g. 26.5)"
                placeholderTextColor="#6b7280"
                value={aprPercent}
                onChangeText={setAprPercent}
                keyboardType="decimal-pad"
              />
              <TextInput
                className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                placeholder="Minimum payment (e.g. 250)"
                placeholderTextColor="#6b7280"
                value={minPayment}
                onChangeText={setMinPayment}
                keyboardType="decimal-pad"
              />
              <View className="flex-row gap-2">
                <Button
                  label={isSubmitting ? "Saving..." : editingDebtId ? "Save Debt" : "Add Debt"}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                />
                {editingDebtId ? (
                  <Button label="Cancel" variant="ghost" onPress={resetForm} />
                ) : null}
              </View>
            </View>
          </View>

          <View className="gap-3">
            <SectionLabel>Active Debts</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
              {(debtOverview?.debts || []).length === 0 ? (
                <Text className="text-sm text-muted-foreground">No active debts.</Text>
              ) : (
                (debtOverview?.debts || []).map((debt) => (
                  <View key={debt.debtId} className="border border-border rounded-xl p-3 gap-2 bg-background">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-base font-medium text-foreground">{debt.name}</Text>
                      <Text className="text-sm text-danger font-medium">{formatGhs(debt.balance)}</Text>
                    </View>
                    <Text className="text-xs text-muted-foreground">
                      APR {(debt.aprBps / 100).toFixed(2)}% · Min {formatGhs(debt.minPayment)}
                    </Text>
                    <View className="flex-row gap-2">
                      <Pressable
                        className="bg-warning/10 border border-warning/20 rounded-lg px-3 py-2"
                        onPress={() => {
                          setEditingDebtId(debt.debtId as Id<"debts">);
                          setName(debt.name);
                          setBalance((debt.balance / 100).toString());
                          setAprPercent((debt.aprBps / 100).toString());
                          setMinPayment((debt.minPayment / 100).toString());
                        }}
                      >
                        <Text className="text-xs font-medium text-warning">Edit</Text>
                      </Pressable>
                      <Pressable
                        className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2"
                        onPress={() => handleArchive(debt.debtId, debt.name)}
                        disabled={isSubmitting}
                      >
                        <Text className="text-xs font-medium text-danger">Archive</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}
