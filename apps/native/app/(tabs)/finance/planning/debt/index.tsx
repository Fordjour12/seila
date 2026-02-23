import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import {
  debtStrategyRef,
  recordDebtPaymentRef,
  setDebtRef,
} from "../../../../../lib/finance-refs";
import { formatGhs } from "../../../../../lib/ghs";
import { Button, SectionLabel } from "../../../../../components/ui";

type Strategy = "snowball" | "avalanche";

function parseCurrencyToCents(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return NaN;
  return Math.round(parsed * 100);
}

export default function FinanceDebtIndexScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const [strategy, setStrategy] = React.useState<Strategy>("avalanche");
  const debtOverview = useQuery(debtStrategyRef, { strategy });

  const setDebt = useMutation(setDebtRef);
  const recordDebtPayment = useMutation(recordDebtPaymentRef);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isRecordingPayment, setIsRecordingPayment] = React.useState(false);
  const [paymentDebtId, setPaymentDebtId] = React.useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = React.useState("");

  const isLoading = debtOverview === undefined;

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
    } catch {
      toast.show({ variant: "danger", label: "Failed to archive debt" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (debtId: string) => {
    const paymentCents = parseCurrencyToCents(paymentAmount);
    if (!Number.isInteger(paymentCents) || paymentCents <= 0) {
      toast.show({ variant: "warning", label: "Enter a valid payment amount" });
      return;
    }

    setIsRecordingPayment(true);
    try {
      const result = await recordDebtPayment({
        debtId: debtId as Id<"debts">,
        amount: paymentCents,
      });
      toast.show({
        variant: "success",
        label: result.archived
          ? "Debt paid off and archived"
          : `Payment recorded. Remaining ${formatGhs(result.balance)}`,
      });
      setPaymentAmount("");
      setPaymentDebtId(null);
    } catch {
      toast.show({ variant: "danger", label: "Failed to record payment" });
    } finally {
      setIsRecordingPayment(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Debt Management</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Track debts and run payoff strategy with payment history updates.
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
              <Button
                label="Add Debt"
                onPress={() => router.push("/(tabs)/finance/planning/debt/add" as any)}
              />
            </View>
          </View>

          <View className="gap-3">
            <SectionLabel>Active Debts</SectionLabel>
            <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
              {(debtOverview?.debts || []).length === 0 ? (
                <Text className="text-sm text-muted-foreground">No active debts.</Text>
              ) : (
                (debtOverview?.debts || []).map((debt) => (
                  <View key={debt.debtId} className="border border-border rounded-xl p-3 gap-3 bg-background">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-base font-medium text-foreground">{debt.name}</Text>
                      <Text className="text-sm text-danger font-medium">{formatGhs(debt.balance)}</Text>
                    </View>
                    <Text className="text-xs text-muted-foreground">
                      APR {(debt.aprBps / 100).toFixed(2)}% · Min {formatGhs(debt.minPayment)}
                    </Text>

                    <View className="flex-row flex-wrap gap-2">
                      <Pressable
                        className="bg-warning/10 border border-warning/20 rounded-lg px-3 py-2"
                        onPress={() =>
                          router.push({
                            pathname: "/(tabs)/finance/planning/debt/edit",
                            params: { id: debt.debtId },
                          } as any)
                        }
                      >
                        <Text className="text-xs font-medium text-warning">Edit</Text>
                      </Pressable>

                      <Pressable
                        className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2"
                        onPress={() => {
                          setPaymentDebtId((current) =>
                            current === debt.debtId ? null : debt.debtId,
                          );
                          setPaymentAmount("");
                        }}
                      >
                        <Text className="text-xs font-medium text-primary">Record Payment</Text>
                      </Pressable>

                      <Pressable
                        className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2"
                        onPress={() => handleArchive(debt.debtId, debt.name)}
                        disabled={isSubmitting}
                      >
                        <Text className="text-xs font-medium text-danger">Archive</Text>
                      </Pressable>
                    </View>

                    {paymentDebtId === debt.debtId ? (
                      <View className="gap-2 pt-1">
                        <TextInput
                          className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                          placeholder="Payment amount (e.g. 250)"
                          placeholderTextColor="#6b7280"
                          value={paymentAmount}
                          onChangeText={setPaymentAmount}
                          keyboardType="decimal-pad"
                        />
                        <View className="flex-row gap-2">
                          <Button
                            label={isRecordingPayment ? "Recording..." : "Apply Payment"}
                            onPress={() => handleRecordPayment(debt.debtId)}
                            disabled={isRecordingPayment}
                          />
                          <Button
                            label="Cancel"
                            variant="ghost"
                            onPress={() => {
                              setPaymentDebtId(null);
                              setPaymentAmount("");
                            }}
                          />
                        </View>
                      </View>
                    ) : null}
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
