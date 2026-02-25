import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import { investmentSummaryRef, setInvestmentRef } from "../../../../../lib/finance-refs";
import { Button } from "../../../../../components/ui";
import { InvestmentForm, type InvestmentType } from "./_components/InvestmentForm";

function parseCurrencyToCents(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return NaN;
  return Math.round(parsed * 100);
}

export default function EditInvestmentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toast } = useToast();
  const investmentOverview = useQuery(investmentSummaryRef, {});
  const setInvestment = useMutation(setInvestmentRef);

  const investment = React.useMemo(
    () => (investmentOverview?.items || []).find((item) => item.investmentId === id),
    [investmentOverview, id],
  );

  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<InvestmentType>("stock");
  const [currentValue, setCurrentValue] = React.useState("");
  const [costBasis, setCostBasis] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hydratedInvestmentId, setHydratedInvestmentId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!investment) return;
    if (hydratedInvestmentId === investment.investmentId) return;

    setName(investment.name);
    setType(investment.type);
    setCurrentValue((investment.currentValue / 100).toString());
    setCostBasis((investment.costBasis / 100).toString());
    setHydratedInvestmentId(investment.investmentId);
  }, [hydratedInvestmentId, investment]);

  const isLoading = investmentOverview === undefined;

  const currentValueCents = parseCurrencyToCents(currentValue);
  const costBasisCents = parseCurrencyToCents(costBasis);

  const validationError = React.useMemo(() => {
    if (!investment) return "Investment not found";
    if (!name.trim()) return "Name is required";
    if (!Number.isInteger(currentValueCents) || currentValueCents < 0) {
      return "Current value must be 0 or more";
    }
    if (!Number.isInteger(costBasisCents) || costBasisCents < 0) {
      return "Cost basis must be 0 or more";
    }
    return null;
  }, [costBasisCents, currentValueCents, investment, name]);

  const handleSubmit = async () => {
    if (!investment) {
      toast.show({ variant: "danger", label: "Investment not found" });
      return;
    }

    if (validationError) {
      toast.show({ variant: "warning", label: validationError });
      return;
    }

    setIsSubmitting(true);
    try {
      await setInvestment({
        idempotencyKey: `finance.investment:edit:${investment.investmentId}:${Date.now()}`,
        investmentId: investment.investmentId as Id<"investments">,
        name: name.trim(),
        type,
        currentValue: currentValueCents,
        costBasis: costBasisCents,
      });
      toast.show({ variant: "success", label: "Investment updated" });
      router.back();
    } catch {
      toast.show({ variant: "danger", label: "Failed to save investment" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoading && !investment) {
    return (
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
        <Text className="text-2xl font-serif text-foreground">Investment not found</Text>
        <Button label="Go Back" onPress={() => router.back()} />
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Edit Investment</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Update holding details and valuations.
        </Text>
      </View>

      {isLoading ? (
        <View className="py-12 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading...</Text>
        </View>
      ) : (
        <InvestmentForm
          title="Investment Details"
          name={name}
          type={type}
          currentValue={currentValue}
          costBasis={costBasis}
          validationError={validationError}
          isSubmitting={isSubmitting}
          submitLabel="Save Investment"
          onNameChange={setName}
          onTypeChange={setType}
          onCurrentValueChange={setCurrentValue}
          onCostBasisChange={setCostBasis}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
        />
      )}
    </ScrollView>
  );
}
