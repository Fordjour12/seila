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
} from "../../../lib/finance-refs";
import { formatGhs } from "../../../lib/ghs";
import { Button, SectionLabel } from "../../../components/ui";
import { formatDueDate, styles } from "../../../components/finance/routeShared";
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

  const handleDelayRecurring = async (recurringId: string, currentDueAt: number) => {
    setBusyRecurringId(recurringId);
    try {
      await updateRecurringTransaction({
        idempotencyKey: `finance.recurring.delay:${recurringId}:${Date.now()}`,
        recurringId,
        nextDueAt: currentDueAt + 7 * 24 * 60 * 60 * 1000,
      });
      toast.show({ variant: "success", label: "Moved due date by 7 days" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to update due date" });
    } finally {
      setBusyRecurringId(null);
    }
  };

  const handleSetDateRecurring = async (
    recurringId: string,
    currentDueAt: number,
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
        currentRecurring.nextDueAt,
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

  const handleRecurringCadenceCycle = async (
    recurringId: string,
    cadence: "weekly" | "biweekly" | "monthly",
  ) => {
    const nextCadence: "weekly" | "biweekly" | "monthly" =
      cadence === "weekly" ? "biweekly" : cadence === "biweekly" ? "monthly" : "weekly";

    setBusyRecurringId(recurringId);
    try {
      await updateRecurringTransaction({
        idempotencyKey: `finance.recurring.cadence:${recurringId}:${Date.now()}`,
        recurringId,
        cadence: nextCadence,
      });
      toast.show({ variant: "success", label: `Cadence set to ${nextCadence}` });
    } catch {
      toast.show({ variant: "danger", label: "Failed to update cadence" });
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Recurring</Text>
      <Text style={styles.subtitle}>Manage your active schedules and update timing fast.</Text>

      {isLoading ? (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <Button
              label="Add Recurring"
              onPress={() => router.push("/(tabs)/finance/add-recurring")}
            />
          </View>

          <View style={styles.section}>
            <SectionLabel>Overview</SectionLabel>
            <View style={styles.snapshotGrid}>
              <View style={styles.snapshotCard}>
                <Text style={styles.snapshotLabel}>Active</Text>
                <Text style={styles.snapshotValue}>{sortedRecurring.length}</Text>
              </View>
              <View style={styles.snapshotCard}>
                <Text style={styles.snapshotLabel}>Due Soon</Text>
                <Text style={styles.snapshotValue}>{dueSoonCount}</Text>
              </View>
              <View style={styles.snapshotCard}>
                <Text style={styles.snapshotLabel}>Monthly Eq.</Text>
                <Text style={styles.snapshotValue}>{formatGhs(monthlyEquivalent)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <SectionLabel>Active Schedules</SectionLabel>
            {sortedRecurring.length === 0 ? (
              <View style={styles.recurringCard}>
                <Text style={styles.recurringTitle}>No recurring schedules yet</Text>
                <Text style={styles.recurringMeta}>
                  Create one to automate regular expenses and planning.
                </Text>
              </View>
            ) : (
              <View style={styles.recurringList}>
                {sortedRecurring.map((item) => {
                  const isBusy = busyRecurringId === item.recurringId;
                  const now = Date.now();
                  const dueSoon = item.nextDueAt <= now + 7 * 24 * 60 * 60 * 1000;

                  return (
                    <View key={item.recurringId} style={styles.recurringCard}>
                      <Pressable
                        style={styles.recurringTopRow}
                        onPress={() =>
                          router.push(
                            `/(tabs)/finance/edit-recurring?recurringId=${item.recurringId}`,
                          )
                        }
                      >
                        <View style={styles.recurringInfo}>
                          <Text style={styles.recurringTitle}>
                            {item.merchantHint || item.note || "Recurring expense"}
                          </Text>
                          <Text style={styles.recurringMeta}>
                            {formatGhs(item.amount)} · {item.cadence} · due{" "}
                            {formatDueDate(item.nextDueAt)}
                          </Text>
                          {dueSoon ? (
                            <Text style={styles.pendingSuggestedText}>Due in the next 7 days</Text>
                          ) : null}
                        </View>
                      </Pressable>

                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.pendingEnvelopePicker}
                      >
                        <View style={styles.cadenceRow}>
                          <Pressable
                            style={[
                              styles.pendingEnvelopeChip,
                              !item.envelopeId && styles.pendingEnvelopeChipSelected,
                              isBusy && styles.pendingDisabled,
                            ]}
                            onPress={() => handleAssignEnvelope(item.recurringId, undefined)}
                            disabled={isBusy}
                          >
                            <Text style={styles.pendingEnvelopeChipText}>Unassigned</Text>
                          </Pressable>
                          {(envelopes || []).map((envelope) => (
                            <Pressable
                              key={`${item.recurringId}:${envelope.envelopeId}`}
                              style={[
                                styles.pendingEnvelopeChip,
                                item.envelopeId === envelope.envelopeId &&
                                  styles.pendingEnvelopeChipSelected,
                                isBusy && styles.pendingDisabled,
                              ]}
                              onPress={() =>
                                handleAssignEnvelope(item.recurringId, envelope.envelopeId)
                              }
                              disabled={isBusy}
                            >
                              <Text style={styles.pendingEnvelopeChipText}>
                                {envelope.emoji ? `${envelope.emoji} ` : ""}
                                {envelope.name}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </ScrollView>

                      <View style={styles.recurringActions}>
                        <Pressable
                          style={[
                            styles.pendingActionButton,
                            styles.pendingVoidButton,
                            isBusy && styles.pendingDisabled,
                          ]}
                          onPress={() =>
                            handleSetDateRecurring(item.recurringId, item.nextDueAt, 0)
                          }
                          disabled={isBusy}
                        >
                          <Text style={styles.pendingVoidText}>Today</Text>
                        </Pressable>
                        <Pressable
                          style={[
                            styles.pendingActionButton,
                            styles.pendingVoidButton,
                            isBusy && styles.pendingDisabled,
                          ]}
                          onPress={() =>
                            handleSetDateRecurring(item.recurringId, item.nextDueAt, 1)
                          }
                          disabled={isBusy}
                        >
                          <Text style={styles.pendingVoidText}>+1d</Text>
                        </Pressable>
                        <Pressable
                          style={[
                            styles.pendingActionButton,
                            styles.pendingVoidButton,
                            isBusy && styles.pendingDisabled,
                          ]}
                          onPress={() =>
                            handleSetDateRecurring(item.recurringId, item.nextDueAt, 7)
                          }
                          disabled={isBusy}
                        >
                          <Text style={styles.pendingVoidText}>+7d</Text>
                        </Pressable>
                        <Pressable
                          style={[
                            styles.pendingActionButton,
                            styles.pendingVoidButton,
                            isBusy && styles.pendingDisabled,
                          ]}
                          onPress={() =>
                            handleSetDateRecurring(item.recurringId, item.nextDueAt, 14)
                          }
                          disabled={isBusy}
                        >
                          <Text style={styles.pendingVoidText}>+14d</Text>
                        </Pressable>
                        <Pressable
                          style={[
                            styles.pendingActionButton,
                            styles.pendingVoidButton,
                            isBusy && styles.pendingDisabled,
                          ]}
                          onPress={() => handleCustomDateRecurring(item.recurringId)}
                          disabled={isBusy}
                        >
                          <Text style={styles.pendingVoidText}>Custom</Text>
                        </Pressable>
                        <Pressable
                          style={[
                            styles.pendingActionButton,
                            styles.pendingConfirmButton,
                            isBusy && styles.pendingDisabled,
                          ]}
                          onPress={() => handleCancelRecurring(item.recurringId)}
                          disabled={isBusy}
                        >
                          <Text style={styles.pendingConfirmText}>Cancel</Text>
                        </Pressable>
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
