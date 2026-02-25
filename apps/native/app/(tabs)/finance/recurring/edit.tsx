import React from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { api } from "@seila/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import { recurringOverviewRef, updateRecurringTransactionRef } from "../../../../lib/finance-refs";
import { formatGhs } from "../../../../lib/ghs";
import { AddEnvelopeSheet } from "../../../../components/finance/FinanceComponents";
import { Button } from "../../../../components/ui";

const DATE_OFFSETS = [
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "+7 days", days: 7 },
  { label: "+14 days", days: 14 },
  { label: "+30 days", days: 30 },
];

const CATEGORY_PRESETS = [
  "Utilities",
  "Housing",
  "Transport",
  "Food",
  "Health",
  "Entertainment",
] as const;

function startOfDay(timestamp: number) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export default function EditRecurringRoute() {
  const router = useRouter();
  const { recurringId } = useLocalSearchParams<{ recurringId: string }>();
  const { toast } = useToast();

  const recurringOverview = useQuery(recurringOverviewRef, { limit: 200 });
  const envelopes = useQuery(api.queries.envelopeSummary.envelopeSummary);
  const updateRecurringTransaction = useMutation(updateRecurringTransactionRef);
  const setEnvelope = useMutation(api.commands.accounts.setEnvelope.setEnvelope);

  const existingRecurring = React.useMemo(
    () => recurringOverview?.items.find((item) => item.recurringId === recurringId),
    [recurringOverview, recurringId],
  );

  const amountPresets = React.useMemo(() => [1000, 2500, 5000, 10000], []);

  const [selectedAmount, setSelectedAmount] = React.useState<number>(amountPresets[1] || 2500);
  const [customAmount, setCustomAmount] = React.useState("");
  const [merchantInput, setMerchantInput] = React.useState("");
  const [cadence, setCadence] = React.useState<"weekly" | "biweekly" | "monthly">("monthly");
  const [kind, setKind] = React.useState<"regular" | "subscription">("regular");
  const [selectedEnvelopeId, setSelectedEnvelopeId] = React.useState<string | undefined>();
  const [firstChargeMode, setFirstChargeMode] = React.useState<"today" | "scheduled">("scheduled");
  const [selectedDueDate, setSelectedDueDate] = React.useState<number>(startOfDay(Date.now()));
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [categoryInput, setCategoryInput] = React.useState("");
  const [selectedCategoryPreset, setSelectedCategoryPreset] = React.useState<string | undefined>();
  const [noteInput, setNoteInput] = React.useState("");
  const [showEnvelopeSheet, setShowEnvelopeSheet] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hydratedRecurringId, setHydratedRecurringId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!existingRecurring) return;
    if (hydratedRecurringId === existingRecurring.recurringId) return;

    setSelectedAmount(existingRecurring.amount);
    setCustomAmount("");
    setMerchantInput(existingRecurring.merchantHint || "");
    setCadence(existingRecurring.cadence);
    setKind(existingRecurring.kind || "regular");
    setSelectedEnvelopeId(existingRecurring.envelopeId);
    setSelectedDueDate(startOfDay(existingRecurring.nextDueAt));
    setFirstChargeMode("scheduled");
    setCategoryInput(existingRecurring.category || "");
    setSelectedCategoryPreset(undefined);
    setNoteInput(existingRecurring.note || "");
    setHydratedRecurringId(existingRecurring.recurringId);
  }, [existingRecurring, hydratedRecurringId]);

  const isLoading = recurringOverview === undefined || envelopes === undefined;

  const parsedCustomAmount = customAmount.trim() === "" ? null : Number(customAmount);
  const resolvedAmount =
    parsedCustomAmount === null
      ? selectedAmount
      : Math.round(parsedCustomAmount * 100);
  const resolvedMerchant = merchantInput.trim();
  const resolvedCategory = (categoryInput.trim() || selectedCategoryPreset || "").trim();
  const effectiveNextDueAt =
    firstChargeMode === "today" ? Date.now() : startOfDay(selectedDueDate);

  const validationError = React.useMemo(() => {
    if (!existingRecurring) {
      return "Schedule not found.";
    }

    if (customAmount.trim() !== "") {
      if (!Number.isFinite(parsedCustomAmount) || parsedCustomAmount === null) {
        return "Enter a valid amount.";
      }
      if (parsedCustomAmount <= 0) {
        return "Amount must be greater than 0.";
      }
    }

    if (!Number.isInteger(resolvedAmount) || resolvedAmount <= 0) {
      return "Amount must be a valid positive value.";
    }

    if (resolvedMerchant.length < 2) {
      return "Merchant name is required (at least 2 characters).";
    }

    if (resolvedCategory.length > 40) {
      return "Category must be 40 characters or less.";
    }

    if (noteInput.trim().length > 140) {
      return "Note must be 140 characters or less.";
    }

    if (!Number.isInteger(effectiveNextDueAt) || effectiveNextDueAt <= 0) {
      return "Choose a valid next charge date.";
    }

    return null;
  }, [
    customAmount,
    effectiveNextDueAt,
    existingRecurring,
    noteInput,
    parsedCustomAmount,
    resolvedAmount,
    resolvedCategory.length,
    resolvedMerchant.length,
  ]);

  const handleUpdate = async () => {
    if (isSubmitting || isLoading) return;
    if (!existingRecurring) {
      toast.show({ variant: "danger", label: "Schedule not found" });
      return;
    }

    if (validationError) {
      toast.show({ variant: "warning", label: validationError });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateRecurringTransaction({
        idempotencyKey: `finance.recurring.update:${recurringId}:${Date.now()}`,
        recurringId,
        amount: resolvedAmount,
        cadence,
        kind,
        nextDueAt: effectiveNextDueAt,
        envelopeId: selectedEnvelopeId as Id<"envelopes"> | undefined,
        clearEnvelope: !selectedEnvelopeId,
        merchantHint: resolvedMerchant,
        note: noteInput.trim() || undefined,
        category: resolvedCategory || undefined,
        clearCategory: !resolvedCategory,
      });
      toast.show({ variant: "success", label: "Payment schedule updated" });
      router.back();
    } catch {
      toast.show({ variant: "danger", label: "Failed to update payment schedule" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateEnvelope = async (name: string, softCeiling?: number, emoji?: string) => {
    try {
      const result = await setEnvelope({
        idempotencyKey: `finance.envelope:${Date.now()}`,
        name,
        softCeiling,
        emoji,
      });
      if (result?.envelopeId) {
        setSelectedEnvelopeId(result.envelopeId);
        toast.show({ variant: "success", label: "Envelope created" });
      }
    } catch {
      toast.show({ variant: "danger", label: "Failed to create envelope" });
      throw new Error("Failed to create envelope");
    }
  };

  if (!isLoading && !existingRecurring) {
    return (
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
        <View className="gap-2">
          <Text className="text-3xl font-serif text-foreground tracking-tight">Not Found</Text>
          <Text className="text-sm text-muted-foreground">This payment schedule could not be found.</Text>
        </View>
        <Button label="Go Back" onPress={() => router.back()} />
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="gap-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Edit Schedule</Text>
        <Text className="text-sm text-muted-foreground">Update regular or subscription payment details.</Text>
      </View>

      {isLoading ? (
        <View className="py-12 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading...</Text>
        </View>
      ) : (
        <View className="bg-surface rounded-2xl border border-border p-5 gap-6">
          <View className="bg-background border border-border rounded-xl p-4 gap-2">
            <Text className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              Preview
            </Text>
            <Text className="text-base font-medium text-foreground">
              {resolvedMerchant || "Merchant"}
            </Text>
            <Text className="text-sm text-muted-foreground">
              {formatGhs(resolvedAmount)} · {cadence} · {kind}
            </Text>
          </View>

          <View className="gap-4">
            <Text className="text-sm font-medium text-foreground">Amount</Text>
            <View className="flex-row flex-wrap gap-2">
              {amountPresets.map((amountPreset, amountIndex) => (
                <Pressable
                  key={`amount:${amountPreset}:${amountIndex}`}
                  className={`px-3 py-2 rounded-lg border ${
                    customAmount.trim() === "" && selectedAmount === amountPreset
                      ? "bg-warning/10 border-warning/20"
                      : "bg-background border-border"
                  }`}
                  onPress={() => {
                    setCustomAmount("");
                    setSelectedAmount(amountPreset);
                  }}
                >
                  <Text
                    className={`text-sm font-medium ${
                      customAmount.trim() === "" && selectedAmount === amountPreset
                        ? "text-warning"
                        : "text-foreground"
                    }`}
                  >
                    {formatGhs(amountPreset)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              value={customAmount}
              onChangeText={setCustomAmount}
              keyboardType="decimal-pad"
              placeholder="Custom amount (e.g. 45.00)"
              placeholderTextColor="#6b7280"
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Merchant</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              value={merchantInput}
              onChangeText={setMerchantInput}
              placeholder="Required (e.g. Netflix, Gym)"
              placeholderTextColor="#6b7280"
              autoCapitalize="words"
            />
          </View>

          <View className="gap-4">
            <Text className="text-sm font-medium text-foreground">Cadence</Text>
            <View className="flex-row flex-wrap gap-2">
              {(["weekly", "biweekly", "monthly"] as const).map((cadenceOption, cadenceIndex) => (
                <Pressable
                  key={`cadence:${cadenceOption}:${cadenceIndex}`}
                  className={`px-3 py-2 rounded-lg border ${
                    cadence === cadenceOption
                      ? "bg-warning/10 border-warning/20"
                      : "bg-background border-border"
                  }`}
                  onPress={() => setCadence(cadenceOption)}
                >
                  <Text
                    className={`text-sm font-medium ${
                      cadence === cadenceOption ? "text-warning" : "text-foreground"
                    }`}
                  >
                    {cadenceOption}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="gap-4">
            <Text className="text-sm font-medium text-foreground">Type</Text>
            <View className="flex-row flex-wrap gap-2">
              {([
                { label: "Regular", value: "regular" },
                { label: "Subscription", value: "subscription" },
              ] as const).map((kindOption, kindIndex) => (
                <Pressable
                  key={`kind:${kindOption.value}:${kindIndex}`}
                  className={`px-3 py-2 rounded-lg border ${
                    kind === kindOption.value
                      ? "bg-warning/10 border-warning/20"
                      : "bg-background border-border"
                  }`}
                  onPress={() => setKind(kindOption.value)}
                >
                  <Text
                    className={`text-sm font-medium ${
                      kind === kindOption.value ? "text-warning" : "text-foreground"
                    }`}
                  >
                    {kindOption.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="gap-4">
            <Text className="text-sm font-medium text-foreground">Next Charge</Text>
            <View className="flex-row flex-wrap gap-2">
              {([
                { label: "Today", value: "today" },
                { label: "Choose date", value: "scheduled" },
              ] as const).map((mode, modeIndex) => (
                <Pressable
                  key={`next-charge:${mode.value}:${modeIndex}`}
                  className={`px-3 py-2 rounded-lg border ${
                    firstChargeMode === mode.value
                      ? "bg-warning/10 border-warning/20"
                      : "bg-background border-border"
                  }`}
                  onPress={() => setFirstChargeMode(mode.value)}
                >
                  <Text
                    className={`text-sm font-medium ${
                      firstChargeMode === mode.value ? "text-warning" : "text-foreground"
                    }`}
                  >
                    {mode.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {firstChargeMode === "scheduled" ? (
              <View className="gap-3">
                <View className="flex-row flex-wrap gap-2">
                  {DATE_OFFSETS.map((offset, offsetIndex) => {
                    const offsetDate = startOfDay(Date.now() + offset.days * 24 * 60 * 60 * 1000);
                    const isSelected = startOfDay(selectedDueDate) === offsetDate;
                    return (
                      <Pressable
                        key={`date-offset:${offset.days}:${offsetIndex}`}
                        className={`px-3 py-2 rounded-lg border ${
                          isSelected
                            ? "bg-warning/10 border-warning/20"
                            : "bg-background border-border"
                        }`}
                        onPress={() => setSelectedDueDate(offsetDate)}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            isSelected ? "text-warning" : "text-foreground"
                          }`}
                        >
                          {offset.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                  <Pressable
                    className="px-3 py-2 rounded-lg border bg-warning/10 border-warning/20"
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text className="text-sm font-medium text-warning">Pick Date</Text>
                  </Pressable>
                </View>
                <Text className="text-xs text-muted-foreground">
                  Selected: {format(new Date(selectedDueDate), "MMM d, yyyy")}
                </Text>
              </View>
            ) : null}
          </View>

          <View className="gap-4">
            <Text className="text-sm font-medium text-foreground">Extra Details</Text>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORY_PRESETS.map((category, categoryIndex) => (
                <Pressable
                  key={`category:${category}:${categoryIndex}`}
                  className={`px-3 py-2 rounded-lg border ${
                    !categoryInput.trim() && selectedCategoryPreset === category
                      ? "bg-warning/10 border-warning/20"
                      : "bg-background border-border"
                  }`}
                  onPress={() => {
                    setCategoryInput("");
                    setSelectedCategoryPreset(category);
                  }}
                >
                  <Text
                    className={`text-sm font-medium ${
                      !categoryInput.trim() && selectedCategoryPreset === category
                        ? "text-warning"
                        : "text-foreground"
                    }`}
                  >
                    {category}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              value={categoryInput}
              onChangeText={(value) => {
                setCategoryInput(value);
                if (value.trim()) setSelectedCategoryPreset(undefined);
              }}
              placeholder="Category (optional)"
              placeholderTextColor="#6b7280"
            />
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground min-h-20"
              value={noteInput}
              onChangeText={setNoteInput}
              placeholder="Note (optional)"
              placeholderTextColor="#6b7280"
              multiline
              textAlignVertical="top"
              maxLength={140}
            />
            <Text className="text-xs text-muted-foreground self-end">{noteInput.trim().length}/140</Text>
          </View>

          <View className="gap-4">
            <Text className="text-sm font-medium text-foreground">Envelope (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-1">
                <Pressable
                  className={`px-3 py-2 rounded-lg border ${
                    !selectedEnvelopeId
                      ? "bg-warning/10 border-warning/20"
                      : "bg-background border-border"
                  }`}
                  onPress={() => setSelectedEnvelopeId(undefined)}
                >
                  <Text
                    className={`text-sm font-medium ${
                      !selectedEnvelopeId ? "text-warning" : "text-foreground"
                    }`}
                  >
                    Unassigned
                  </Text>
                </Pressable>
                {(envelopes || []).map((envelope, envelopeIndex) => (
                  <Pressable
                    key={`envelope:${envelope.envelopeId}:${envelopeIndex}`}
                    className={`px-3 py-2 rounded-lg border ${
                      selectedEnvelopeId === envelope.envelopeId
                        ? "bg-warning/10 border-warning/20"
                        : "bg-background border-border"
                    }`}
                    onPress={() => setSelectedEnvelopeId(envelope.envelopeId)}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selectedEnvelopeId === envelope.envelopeId
                          ? "text-warning"
                          : "text-foreground"
                      }`}
                    >
                      {envelope.emoji ? `${envelope.emoji} ` : ""}
                      {envelope.name}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  className="px-3 py-2 rounded-lg border bg-warning/10 border-warning/20"
                  onPress={() => setShowEnvelopeSheet(true)}
                >
                  <Text className="text-sm font-medium text-warning">+ Create New</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>

          {validationError ? (
            <View className="bg-danger/10 border border-danger/20 rounded-xl p-3">
              <Text className="text-xs text-danger">{validationError}</Text>
            </View>
          ) : null}

          <View className="gap-3 pt-2">
            <Button
              label={isSubmitting ? "Saving..." : "Save Changes"}
              onPress={handleUpdate}
              disabled={isSubmitting || !!validationError}
            />
            <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
          </View>
        </View>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={new Date(selectedDueDate)}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_event, date) => {
            setShowDatePicker(Platform.OS === "ios");
            if (date) {
              setSelectedDueDate(startOfDay(date.getTime()));
            }
          }}
        />
      )}

      {showEnvelopeSheet && (
        <AddEnvelopeSheet
          onAdd={async (name, softCeiling, emoji) => {
            await handleCreateEnvelope(name, softCeiling, emoji);
            setShowEnvelopeSheet(false);
          }}
          onClose={() => setShowEnvelopeSheet(false)}
        />
      )}
    </ScrollView>
  );
}
