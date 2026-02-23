import React from "react";
import { ScrollView, Text, TextInput, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { useToast } from "heroui-native";

import { setDebtRef } from "../../../../../lib/finance-refs";
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

export default function AddDebtScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const setDebt = useMutation(setDebtRef);

  const [name, setName] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [paybackAmount, setPaybackAmount] = React.useState("");
  const [isFlatFee, setIsFlatFee] = React.useState(false);
  const [months, setMonths] = React.useState("12");
  const [minPayment, setMinPayment] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
    isFlatFee,
    minPaymentCents,
    monthsValue,
    name,
    paybackAmountCents,
  ]);

  const handleSubmit = async () => {
    if (validationError) {
      toast.show({ variant: "warning", label: validationError });
      return;
    }

    setIsSubmitting(true);
    try {
      await setDebt({
        idempotencyKey: `finance.debt:new:${Date.now()}`,
        name: name.trim(),
        balance: amountCents,
        aprBps,
        minPayment: minPaymentCents,
      });
      toast.show({ variant: "success", label: "Debt added" });
      router.back();
    } catch {
      toast.show({ variant: "danger", label: "Failed to save debt" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Add Debt</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Create a debt and auto-calculate APR from payoff terms.
        </Text>
      </View>

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
            label={isSubmitting ? "Saving..." : "Add Debt"}
            onPress={handleSubmit}
            disabled={isSubmitting || !!validationError}
          />
        </View>
      </View>
    </ScrollView>
  );
}
