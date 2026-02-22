import React from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useToast } from "heroui-native";

import {
  cancelRecurringTransactionRef,
  recurringTransactionsRef,
  updateRecurringTransactionRef,
} from "../../../../lib/finance-refs";
import { formatGhs } from "../../../../lib/ghs";
import { Button, SectionLabel } from "../../../../components/ui";
import { formatDueDate } from "../../../../components/finance/routeShared";
import { api } from "@seila/backend/convex/_generated/api";

function cadenceMonthlyEquivalent(amount: number, cadence: "weekly" | "biweekly" | "monthly") {
  if (cadence === "weekly") return Math.round(amount * 4.345);
  if (cadence === "biweekly") return Math.round(amount * 2.1725);
  return amount;
}

export default function FinanceRecurringScreen() {
  const router = useRouter();
  const { toast } = useToast();

  const envelopes = useQuery(api.queries.envelopeSummary.envelopeSummary);
  const recurringTransactions = useQuery(recurringTransactionsRef, { limit: 50 });

  const updateRecurringTransaction = useMutation(updateRecurringTransactionRef);
  const cancelRecurringTransaction = useMutation(cancelRecurringTransactionRef);

  const [busyRecurringId, setBusyRecurringId] = React.useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [selectedRecurringId, setSelectedRecurringId] = React.useState<string | null>(null);

  const isLoading = recurringTransactions === undefined || envelopes === undefined;

  const sortedRecurring = React.useMemo(
    () => [...(recurringTransactions || [])].sort((a, b) => a.nextDueAt - b.nextDueAt),
    [recurringTransactions],
  );

  const monthlyEquivalent = React.useMemo(
    () =>
      sortedRecurring.reduce(
        (sum, item) => sum + cadenceMonthlyEquivalent(item.amount, item.cadence),
        0,
      ),
    [sortedRecurring],
  );

  const dueSoonCount = React.useMemo(() => {
    const now = Date.now();
    const soon = now + 7 * 24 * 60 * 60 * 1000;
    return sortedRecurring.filter((item) => item.nextDueAt <= soon).length;
  }, [sortedRecurring]);

  const handleSetDateRecurring = async (
    recurringId: string,
    daysFromNow: number,
  ) => {
    setBusyRecurringId(recurringId);
    try {
      const newDate = Date.now() + daysFromNow * 24 * 60 * 60 * 1000;
      await updateRecurringTransaction({
        idempotencyKey: `finance.recurring.setDate:${recurringId}:${Date.now()}`,
        recurringId,
        nextDueAt: newDate,
      });
      toast.show({
        variant: "success",
        label: `Due date set to ${daysFromNow === 0 ? "today" : daysFromNow === 1 ? "tomorrow" : `${daysFromNow} days`}`,
      });
    } catch {
      toast.show({ variant: "danger", label: "Failed to update due date" });
    } finally {
      setBusyRecurringId(null);
    }
  };

  const handleCustomDateRecurring = (recurringId: string) => {
    setSelectedRecurringId(recurringId);
    setShowDatePicker(true);
  };

  const handleDatePickerChange = async (
    event: { nativeEvent: { timestamp: number } },
    date?: Date,
  ) => {
    setShowDatePicker(false);
    const currentRecurring = sortedRecurring.find((r) => r.recurringId === selectedRecurringId);
    if (date && currentRecurring) {
      await handleSetDateRecurring(
        selectedRecurringId!,
        Math.round((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
      );
    }
    setSelectedRecurringId(null);
  };

  const handleCancelRecurring = async (recurringId: string) => {
    setBusyRecurringId(recurringId);
    try {
      await cancelRecurringTransaction({
        idempotencyKey: `finance.recurring.cancel:${recurringId}:${Date.now()}`,
        recurringId,
      });
      toast.show({ variant: "success", label: "Recurring schedule canceled" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to cancel recurring schedule" });
    } finally {
      setBusyRecurringId(null);
    }
  };

  const handleAssignEnvelope = async (recurringId: string, envelopeId?: string) => {
    setBusyRecurringId(recurringId);
    try {
      await updateRecurringTransaction({
        idempotencyKey: `finance.recurring.envelope:${recurringId}:${Date.now()}`,
        recurringId,
        envelopeId: envelopeId as Id<"envelopes"> | undefined,
      });
      toast.show({ variant: "success", label: "Recurring envelope updated" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to update envelope" });
    } finally {
      setBusyRecurringId(null);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6 pb-24 gap-6">
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">Recurring</Text>
        <Text className="text-sm text-muted-foreground mt-1">Manage active schedules and update timing fast.</Text>
      </View>

      {isLoading ? (
        <View className="py-12 items-center justify-center">
          <Text className="text-base text-muted-foreground">Loading...</Text>
        </View>
      ) : (
        <>
          <View className="gap-3">
            <Button
              label="Add Recurring"
              onPress={() => router.push("/(tabs)/finance/recurring/add" as any)}
            />
          </View>

          <View className="gap-3">
            <SectionLabel>Overview</SectionLabel>
            <View className="flex-row gap-2">
              <View className="flex-1 bg-surface rounded-2xl border border-border p-4 gap-1 shadow-sm">
                <Text className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Active</Text>
                <Text className="text-xl font-medium text-foreground">{sortedRecurring.length}</Text>
              </View>
              <View className="flex-1 bg-surface rounded-2xl border border-border p-4 gap-1 shadow-sm">
                <Text className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Due Soon</Text>
                <Text className="text-xl font-medium text-foreground">{dueSoonCount}</Text>
              </View>
              <View className="flex-1 bg-surface rounded-2xl border border-border p-4 gap-1 shadow-sm">
                <Text className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Monthly Eq.</Text>
                <Text className="text-xl font-medium text-foreground">{formatGhs(monthlyEquivalent)}</Text>
              </View>
            </View>
          </View>

          <View className="gap-3">
            <SectionLabel>Active Schedules</SectionLabel>
            {sortedRecurring.length === 0 ? (
              <View className="bg-surface rounded-2xl border border-border p-6 items-center justify-center gap-2 shadow-sm">
                <Text className="text-base font-medium text-foreground">No recurring schedules yet</Text>
                <Text className="text-sm text-muted-foreground text-center">
                  Create one to automate regular expenses and planning.
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {sortedRecurring.map((item) => {
                  const isBusy = busyRecurringId === item.recurringId;
                  const now = Date.now();
                  const dueSoon = item.nextDueAt <= now + 7 * 24 * 60 * 60 * 1000;

                  return (
                    <View key={item.recurringId} className="bg-surface rounded-2xl border border-border p-4 gap-4 shadow-sm">
                      <Pressable
                        onPress={() =>
                          router.push(
                            `/(tabs)/finance/recurring/edit?recurringId=${item.recurringId}` as any,
                          )
                        }
                      >
                        <View className="flex-row justify-between items-start">
                          <View className="flex-1">
                            <Text className="text-base font-medium text-foreground">
                              {item.merchantHint || item.note || "Recurring expense"}
                            </Text>
                            <Text className="text-xs text-muted-foreground mt-1">
                              {formatGhs(item.amount)} · <Text className="capitalize">{item.cadence}</Text> · <Text className={dueSoon ? "text-warning font-medium" : ""}>due {formatDueDate(item.nextDueAt)}</Text>
                            </Text>
                          </View>
                          {dueSoon && (
                            <View className="bg-warning/10 border border-warning/20 rounded-full px-2 py-0.5">
                              <Text className="text-[10px] text-warning font-bold uppercase tracking-tighter">Soon</Text>
                            </View>
                          )}
                        </View>
                      </Pressable>

                      <View className="h-px bg-border" />

                      <View className="gap-2">
                        <Text className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Assigned Envelope</Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          className="flex-row"
                        >
                          <View className="flex-row gap-2">
                            <Pressable
                              className={`rounded-full px-3 py-1.5 border ${!item.envelopeId ? "bg-warning/10 border-warning/30" : "bg-background border-border"} ${isBusy ? "opacity-50" : ""}`}
                              onPress={() => handleAssignEnvelope(item.recurringId, undefined)}
                              disabled={isBusy}
                            >
                              <Text className={`text-xs font-medium ${!item.envelopeId ? "text-warning" : "text-foreground"}`}>Unassigned</Text>
                            </Pressable>
                            {(envelopes || []).map((envelope) => (
                              <Pressable
                                key={`${item.recurringId}:${envelope.envelopeId}`}
                                className={`rounded-full px-3 py-1.5 border ${item.envelopeId === envelope.envelopeId ? "bg-warning/10 border-warning/30" : "bg-background border-border"} ${isBusy ? "opacity-50" : ""}`}
                                onPress={() =>
                                  handleAssignEnvelope(item.recurringId, envelope.envelopeId)
                                }
                                disabled={isBusy}
                              >
                                <Text className={`text-xs font-medium ${item.envelopeId === envelope.envelopeId ? "text-warning" : "text-foreground"}`}>
                                  {envelope.emoji ? `${envelope.emoji} ` : ""}
                                  {envelope.name}
                                </Text>
                              </Pressable>
                            ))}
                          </View>
                        </ScrollView>
                      </View>

                      <View className="h-px bg-border" />

                      <View className="gap-2">
                        <Text className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Update Timing</Text>
                        <View className="flex-row flex-wrap gap-2">
                          {[
                            { label: "Today", days: 0 },
                            { label: "+1d", days: 1 },
                            { label: "+7d", days: 7 },
                            { label: "+14d", days: 14 },
                          ].map((opt) => (
                            <Pressable
                              key={opt.label}
                              className={`bg-background border border-border rounded-full px-3 py-1.5 active:bg-muted ${isBusy ? "opacity-50" : ""}`}
                              onPress={() => handleSetDateRecurring(item.recurringId, opt.days)}
                              disabled={isBusy}
                            >
                              <Text className="text-xs text-foreground font-medium">{opt.label}</Text>
                            </Pressable>
                          ))}
                          <Pressable
                            className={`bg-background border border-border rounded-full px-3 py-1.5 active:bg-muted ${isBusy ? "opacity-50" : ""}`}
                            onPress={() => handleCustomDateRecurring(item.recurringId)}
                            disabled={isBusy}
                          >
                            <Text className="text-xs text-foreground font-medium">Custom</Text>
                          </Pressable>
                          <View className="flex-1" />
                          <Pressable
                            className={`bg-danger/10 border border-danger/20 rounded-full px-3 py-1.5 active:bg-danger/20 ${isBusy ? "opacity-50" : ""}`}
                            onPress={() => handleCancelRecurring(item.recurringId)}
                            disabled={isBusy}
                          >
                            <Text className="text-xs text-danger font-medium">Cancel</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </>
      )}
      {showDatePicker && selectedRecurringId && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={handleDatePickerChange}
        />
      )}
    </ScrollView>
  );
}
