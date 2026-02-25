import React from "react";
import { ScrollView, Text, TextInput, View, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import { debtStrategyRef, setDebtRef } from "../../../../../lib/finance-refs";
import { Button, SectionLabel } from "../../../../../components/ui";

function parseCurrencyToCents(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return NaN;
  return Math.round(parsed * 100);
}

function calculateAprBps(params: {
  amountCents: number;
  paybackAmountCents: number;
  isFlatFee: boolean;
  months: number;
}) {
  const { amountCents, paybackAmountCents, isFlatFee, months } = params;
  const interest = paybackAmountCents - amountCents;
  if (amountCents <= 0 || interest < 0) return NaN;

  if (isFlatFee) {
    return Math.round((interest / amountCents) * 10000);
  }

  if (months <= 0) return NaN;
  return Math.round((interest / amountCents) * (12 / months) * 10000);
}

export default function EditDebtScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toast } = useToast();

  const debtOverview = useQuery(debtStrategyRef, { strategy: "avalanche" });
  const setDebt = useMutation(setDebtRef);

  const debt = React.useMemo(
    () => (debtOverview?.debts || []).find((item) => item.debtId === id),
    [debtOverview, id],
  );

  const [name, setName] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [paybackAmount, setPaybackAmount] = React.useState("");
  const [isFlatFee, setIsFlatFee] = React.useState(false);
  const [months, setMonths] = React.useState("12");
  const [minPayment, setMinPayment] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hydratedDebtId, setHydratedDebtId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!debt) return;
    if (hydratedDebtId === debt.debtId) return;

    setName(debt.name);
    setAmount((debt.balance / 100).toString());
    const estimatedPayback = Math.round(
      debt.balance + debt.balance * (debt.aprBps / 10000),
    );
    setPaybackAmount((estimatedPayback / 100).toString());
    setIsFlatFee(false);
    setMonths("12");
    setMinPayment((debt.minPayment / 100).toString());
    setHydratedDebtId(debt.debtId);
  }, [debt, hydratedDebtId]);

  const isLoading = debtOverview === undefined;

  const amountCents = parseCurrencyToCents(amount);
  const paybackAmountCents = parseCurrencyToCents(paybackAmount);
  const monthsValue = Number(months);
  const minPaymentCents = parseCurrencyToCents(minPayment);

  const aprBps = calculateAprBps({
    amountCents,
    paybackAmountCents,
    isFlatFee,
    months: monthsValue,
  });

  const validationError = React.useMemo(() => {
    if (!debt) return "Debt not found";
    if (!name.trim()) return "Debt name is required";
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      return "Principal amount must be greater than 0";
    }
    if (!Number.isInteger(paybackAmountCents) || paybackAmountCents <= 0) {
      return "Payback amount must be greater than 0";
    }
    if (paybackAmountCents < amountCents) {
      return "Payback amount cannot be less than principal";
    }
    if (!isFlatFee && (!Number.isInteger(monthsValue) || monthsValue <= 0)) {
      return "Months is required and must be greater than 0";
    }
    if (!Number.isInteger(minPaymentCents) || minPaymentCents <= 0) {
      return "Minimum payment must be greater than 0";
    }
    if (!Number.isInteger(aprBps) || aprBps < 0) {
      return "APR could not be calculated from the provided values";
    }
    return null;
  }, [
    amountCents,
    aprBps,
    debt,
    isFlatFee,
    minPaymentCents,
    monthsValue,
    name,
    paybackAmountCents,
  ]);

  const handleSubmit = async () => {
    if (!debt) {
      toast.show({ variant: "danger", label: "Debt not found" });
      return;
    }

    if (validationError) {
      toast.show({ variant: "warning", label: validationError });
      return;
    }

    setIsSubmitting(true);
    try {
      await setDebt({
        idempotencyKey: `finance.debt.edit:${debt.debtId}:${Date.now()}`,
        debtId: debt.debtId as Id<"debts">,
        name: name.trim(),
        balance: amountCents,
        aprBps,
        minPayment: minPaymentCents,
      });
      toast.show({ variant: "success", label: "Debt updated" });
      router.back();
    } catch {
      toast.show({ variant: "danger", label: "Failed to save debt" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoading && !debt) {
    return (
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
        <Text className="text-2xl font-serif text-foreground">Debt not found</Text>
        <Button label="Go Back" onPress={() => router.back()} />
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Edit Debt</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Update debt terms and recalculated APR.
        </Text>
      </View>

      {isLoading ? (
        <View className="py-12 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading...</Text>
        </View>
      ) : (
        <View className="gap-3">
          <SectionLabel>Debt Details</SectionLabel>
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
              placeholder="Principal amount (e.g. 3000)"
              placeholderTextColor="#6b7280"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />

            <TextInput
              className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
              placeholder="Total payback amount (e.g. 3600)"
              placeholderTextColor="#6b7280"
              value={paybackAmount}
              onChangeText={setPaybackAmount}
              keyboardType="decimal-pad"
            />

            <View className="flex-row gap-2">
              <Pressable
                className={`rounded-full px-4 py-2 border ${isFlatFee ? "bg-warning/10 border-warning/30" : "bg-background border-border"}`}
                onPress={() => setIsFlatFee(true)}
              >
                <Text className={`text-xs font-medium ${isFlatFee ? "text-warning" : "text-foreground"}`}>
                  Flat Fee
                </Text>
              </Pressable>
              <Pressable
                className={`rounded-full px-4 py-2 border ${!isFlatFee ? "bg-warning/10 border-warning/30" : "bg-background border-border"}`}
                onPress={() => setIsFlatFee(false)}
              >
                <Text className={`text-xs font-medium ${!isFlatFee ? "text-warning" : "text-foreground"}`}>
                  Time-Based
                </Text>
              </Pressable>
            </View>

            {!isFlatFee ? (
              <TextInput
                className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                placeholder="Months (e.g. 12)"
                placeholderTextColor="#6b7280"
                value={months}
                onChangeText={setMonths}
                keyboardType="number-pad"
              />
            ) : null}

            <TextInput
              className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
              placeholder="Minimum monthly payment (e.g. 250)"
              placeholderTextColor="#6b7280"
              value={minPayment}
              onChangeText={setMinPayment}
              keyboardType="decimal-pad"
            />

            <View className="bg-background border border-border rounded-xl px-3 py-2">
              <Text className="text-xs text-muted-foreground uppercase tracking-wider">Calculated APR</Text>
              <Text className="text-base font-medium text-foreground mt-1">
                {Number.isInteger(aprBps) && aprBps >= 0 ? `${(aprBps / 100).toFixed(2)}%` : "-"}
              </Text>
            </View>

            {validationError ? (
              <View className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
                <Text className="text-xs text-danger">{validationError}</Text>
              </View>
            ) : null}

            <Button
              label={isSubmitting ? "Saving..." : "Save Debt"}
              onPress={handleSubmit}
              disabled={isSubmitting || !!validationError}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}
