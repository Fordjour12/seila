import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { Button } from "../../../../../../components/ui";
import { formatGhs } from "../../../../../../lib/ghs";

export type InvestmentType = "stock" | "fund" | "crypto" | "cash" | "other";

type Props = {
  title: string;
  name: string;
  type: InvestmentType;
  currentValue: string;
  costBasis: string;
  validationError: string | null;
  isSubmitting: boolean;
  submitLabel: string;
  onNameChange: (value: string) => void;
  onTypeChange: (value: InvestmentType) => void;
  onCurrentValueChange: (value: string) => void;
  onCostBasisChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
};

export function InvestmentForm({
  title,
  name,
  type,
  currentValue,
  costBasis,
  validationError,
  isSubmitting,
  submitLabel,
  onNameChange,
  onTypeChange,
  onCurrentValueChange,
  onCostBasisChange,
  onSubmit,
  onCancel,
}: Props) {
  const currentValueCents = Math.round((Number(currentValue) || 0) * 100);
  const costBasisCents = Math.round((Number(costBasis) || 0) * 100);
  const unrealizedPnl = currentValueCents - costBasisCents;

  return (
    <View className="gap-3">
      <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
        <Text className="text-base font-medium text-foreground">{title}</Text>

        <TextInput
          className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
          placeholder="Name"
          placeholderTextColor="#6b7280"
          value={name}
          onChangeText={onNameChange}
        />

        <View className="flex-row flex-wrap gap-2">
          {(["stock", "fund", "crypto", "cash", "other"] as const).map((value) => (
            <Pressable
              key={value}
              className={`rounded-full px-3 py-2 border ${
                type === value ? "bg-warning/10 border-warning/30" : "bg-background border-border"
              }`}
              onPress={() => onTypeChange(value)}
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
          onChangeText={onCurrentValueChange}
          keyboardType="decimal-pad"
        />

        <TextInput
          className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
          placeholder="Cost basis (e.g. 15000)"
          placeholderTextColor="#6b7280"
          value={costBasis}
          onChangeText={onCostBasisChange}
          keyboardType="decimal-pad"
        />

        <View className="bg-background border border-border rounded-xl p-3 gap-1">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider">Preview</Text>
          <Text className="text-sm text-foreground">Value {formatGhs(currentValueCents)}</Text>
          <Text className="text-sm text-muted-foreground">Cost {formatGhs(costBasisCents)}</Text>
          <Text className={`text-sm font-medium ${unrealizedPnl >= 0 ? "text-success" : "text-danger"}`}>
            PnL {formatGhs(unrealizedPnl)}
          </Text>
        </View>

        {validationError ? (
          <View className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
            <Text className="text-xs text-danger">{validationError}</Text>
          </View>
        ) : null}

        <View className="flex-row gap-2">
          <Button
            label={isSubmitting ? "Saving..." : submitLabel}
            onPress={onSubmit}
            disabled={isSubmitting || !!validationError}
          />
          {onCancel ? <Button label="Cancel" variant="ghost" onPress={onCancel} /> : null}
        </View>
      </View>
    </View>
  );
}
