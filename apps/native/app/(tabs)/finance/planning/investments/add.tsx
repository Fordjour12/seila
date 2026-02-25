import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { useToast } from "heroui-native";

import { setInvestmentRef } from "../../../../../lib/finance-refs";
import { InvestmentForm, type InvestmentType } from "./_components/InvestmentForm";

function parseCurrencyToCents(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return NaN;
  return Math.round(parsed * 100);
}

export default function AddInvestmentScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const setInvestment = useMutation(setInvestmentRef);

  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<InvestmentType>("stock");
  const [currentValue, setCurrentValue] = React.useState("");
  const [costBasis, setCostBasis] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const currentValueCents = parseCurrencyToCents(currentValue);
  const costBasisCents = parseCurrencyToCents(costBasis);

  const validationError = React.useMemo(() => {
    if (!name.trim()) return "Name is required";
    if (!Number.isInteger(currentValueCents) || currentValueCents < 0) {
      return "Current value must be 0 or more";
    }
    if (!Number.isInteger(costBasisCents) || costBasisCents < 0) {
      return "Cost basis must be 0 or more";
    }
    return null;
  }, [costBasisCents, currentValueCents, name]);

  const handleSubmit = async () => {
    if (validationError) {
      toast.show({ variant: "warning", label: validationError });
      return;
    }

    setIsSubmitting(true);
    try {
      await setInvestment({
        idempotencyKey: `finance.investment:new:${Date.now()}`,
        name: name.trim(),
        type,
        currentValue: currentValueCents,
        costBasis: costBasisCents,
      });
      toast.show({ variant: "success", label: "Investment added" });
      router.back();
    } catch {
      toast.show({ variant: "danger", label: "Failed to save investment" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Add Investment</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Add a holding to your investment portfolio.
        </Text>
      </View>

      <InvestmentForm
        title="Investment Details"
        name={name}
        type={type}
        currentValue={currentValue}
        costBasis={costBasis}
        validationError={validationError}
        isSubmitting={isSubmitting}
        submitLabel="Add Investment"
        onNameChange={setName}
        onTypeChange={setType}
        onCurrentValueChange={setCurrentValue}
        onCostBasisChange={setCostBasis}
        onSubmit={handleSubmit}
      />
    </ScrollView>
  );
}
