import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { Ionicons } from "@expo/vector-icons";
import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { Button, Popover, useToast } from "heroui-native";

import ConsistencyDetailCard from "../../../components/consistency/ConsistencyDetailCard";
import {
    archiveHabitRef,
    habitDayDetailsRef,
    habitsConsistencyRef,
} from "../../../lib/productivity-refs";
import { getLocalDayKey } from "../../../lib/date";

type WindowOption = 7 | 30 | 90;

function statusTone(status: string) {
    if (status === "completed") {
        return {
            chipClass: "text-success bg-success/10 border-success/20",
            icon: "checkmark-circle-outline" as const,
            iconColor: "#22c55e",
        };
    }
    if (status === "skipped") {
        return {
            chipClass: "text-warning bg-warning/10 border-warning/20",
            icon: "play-skip-forward-outline" as const,
            iconColor: "#f59e0b",
        };
    }
    if (status === "snoozed") {
        return {
            chipClass: "text-primary bg-primary/10 border-primary/20",
            icon: "alarm-outline" as const,
            iconColor: "#3b82f6",
        };
    }
    if (status === "missed") {
        return {
            chipClass: "text-muted-foreground bg-muted/30 border-border",
            icon: "ellipse-outline" as const,
            iconColor: "#9ca3af",
        };
    }
    return {
        chipClass: "text-danger bg-danger/10 border-danger/20",
        icon: "alert-circle-outline" as const,
        iconColor: "#ef4444",
    };
}

function statusLabel(status: string) {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function DotScale({
    value,
    max,
    tone,
    dots = 10,
}: {
    value: number;
    max: number;
    tone: "success" | "warning" | "primary" | "danger";
    dots?: number;
}) {
    const safeMax = Math.max(max, 1);
    const clamped = Math.max(0, Math.min(value, safeMax));
    const active = Math.round((clamped / safeMax) * dots);
    const activeClass =
        tone === "success"
            ? "bg-success"
            : tone === "warning"
                ? "bg-warning"
                : tone === "danger"
                    ? "bg-danger"
                    : "bg-primary";

    return (
        <View className="flex-row gap-1.5">
            {Array.from({ length: dots }).map((_, index) => (
                <View
                    key={`dot-${index}`}
                    className={`h-2.5 flex-1 rounded-full ${index < active ? activeClass : "bg-muted/55"}`}
                />
            ))}
        </View>
    );
}

function StatTile({
    label,
    value,
    tone,
    icon,
}: {
    label: string;
    value: string;
    tone: "success" | "warning" | "primary" | "danger";
    icon: React.ComponentProps<typeof Ionicons>["name"];
}) {
    const iconColor =
        tone === "success"
            ? "#22c55e"
            : tone === "warning"
                ? "#f59e0b"
                : tone === "danger"
                    ? "#ef4444"
                    : "#3b82f6";
    const tintClass =
        tone === "success"
            ? "bg-success/10 border-success/20"
            : tone === "warning"
                ? "bg-warning/10 border-warning/20"
                : tone === "danger"
                    ? "bg-danger/10 border-danger/20"
                    : "bg-primary/10 border-primary/20";

    return (
        <View className={`flex-1 rounded-2xl border p-3 ${tintClass}`}>
            <View className="flex-row items-center gap-2">
                <Ionicons name={icon} size={14} color={iconColor} />
                <Text className="text-[10px] uppercase tracking-[0.4px] text-muted-foreground font-sans-semibold">
                    {label}
                </Text>
            </View>
            <Text className="mt-2 text-xl text-foreground font-sans-bold">{value}</Text>
        </View>
    );
}

export default function HabitConsistencyScreen() {
    const router = useRouter();
    const { id: habitId } = useLocalSearchParams<{ id: string }>();
    const { toast } = useToast();
    const dayKey = getLocalDayKey();
    const [windowDays, setWindowDays] = React.useState<WindowOption>(30);
    const [selectedDayKey, setSelectedDayKey] = React.useState(dayKey);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

    const consistency = useQuery(habitsConsistencyRef, {
        dayKey,
        windowDays,
        trendDays: windowDays,
    });
    const dayDetails = useQuery(habitDayDetailsRef, { dayKey: selectedDayKey });
    const archiveHabit = useMutation(archiveHabitRef);

    const selectedDateLabel = new Date(selectedDayKey).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
    const allLogs = dayDetails?.logs || [];
    const logs = habitId ? allLogs.filter((log) => log.habitId === habitId) : allLogs;
    const missedLast14 = consistency?.missedLast14 ?? 0;
    const activeHabits = consistency?.activeHabits ?? 0;
    const consistencyPct = consistency?.consistencyPct ?? 0;
    const currentStreak = consistency?.currentStreak ?? 0;
    const bestStreak = consistency?.bestStreak ?? 0;
    const selectedHabit = logs.length > 0 ? logs[0]?.name : "this habit";

    const handleDeleteHabit = React.useCallback(async () => {
        if (!habitId || isDeleting) return;
        setIsDeleting(true);
        try {
            await archiveHabit({
                idempotencyKey: `habits.archive:${habitId}:${Date.now()}`,
                habitId: habitId as Id<"habits">,
            });
            setDeleteDialogOpen(false);
            toast.show({ variant: "success", label: "Habit deleted" });
            router.replace("/(tabs)/habits");
        } catch {
            toast.show({ variant: "danger", label: "Failed to delete habit" });
        } finally {
            setIsDeleting(false);
        }
    }, [archiveHabit, habitId, isDeleting, router, toast]);

    return (
        <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 pt-4 pb-24 gap-4">
            <View className="rounded-2xl border border-danger/30 bg-danger/10 p-4 gap-2">
                <Text className="text-sm font-sans-semibold text-foreground">Danger Zone</Text>
                <Text className="text-xs text-muted-foreground">
                    Delete removes this habit from active lists. You can restore it later from Manage Habits.
                </Text>
                <Popover
                    presentation="bottom-sheet"
                    isOpen={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                >
                    <Popover.Trigger asChild>
                        <Pressable
                            onPress={() => setDeleteDialogOpen(true)}
                            disabled={isDeleting || !habitId}
                            className={`self-start rounded-lg border border-danger/30 px-3 py-2 ${isDeleting ? "opacity-60" : "bg-danger/15"}`}
                        >
                            <Text className="text-xs font-sans-bold uppercase text-danger">
                                {isDeleting ? "Deleting..." : "Delete Habit"}
                            </Text>
                        </Pressable>
                    </Popover.Trigger>

                    <Popover.Portal>
                        <Popover.Overlay className="bg-black/45" />
                        <Popover.Content
                            presentation="bottom-sheet"
                            className="rounded-t-3xl border border-border bg-surface px-4 pt-4 pb-6"
                        >
                            <Text className="text-base font-sans-semibold text-foreground">Delete Habit</Text>
                            <Text className="text-sm text-muted-foreground mt-1">
                                Are you sure you want to delete {selectedHabit}? This archives it and removes it from active lists.
                            </Text>

                            <View className="flex-row gap-2 mt-4 pb-6">
                                <Button
                                    className="flex-1"
                                    variant="secondary"
                                    onPress={() => setDeleteDialogOpen(false)}
                                    isDisabled={isDeleting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1"
                                    variant="ghost"
                                    onPress={() => void handleDeleteHabit()}
                                    isDisabled={isDeleting}
                                >
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </Button>
                            </View>
                        </Popover.Content>
                    </Popover.Portal>
                </Popover>
            </View>


            <ConsistencyDetailCard
                title="Overview"
                subtitle="Scheduled days only. Paused and out-of-range days are excluded."
                scoreLabel={`${windowDays}-day consistency`}
                scoreValue={`${consistencyPct}%`}
                statLine={`Completed ${consistency?.completedScheduledDays ?? 0} of ${consistency?.scheduledDays ?? 0} scheduled · Current ${currentStreak}d · Best ${bestStreak}d`}
                trend={(consistency?.trend || []).map((item) => ({
                    dayKey: item.dayKey,
                    value: item.score,
                }))}
                selectedDayKey={selectedDayKey}
                selectedWindow={windowDays}
                onWindowChange={setWindowDays}
                onDayPress={setSelectedDayKey}
            />

            <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
                <Text className="text-sm font-sans-semibold text-foreground">Performance Snapshot</Text>
                <View className="flex-row gap-2">
                    <StatTile label="Consistency" value={`${consistencyPct}%`} tone="primary" icon="pulse-outline" />
                    <StatTile label="Current Run" value={`${currentStreak}d`} tone="success" icon="trending-up-outline" />
                    <StatTile label="Best Run" value={`${bestStreak}d`} tone="warning" icon="ribbon-outline" />
                </View>
            </View>

            <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
                <Text className="text-sm font-sans-semibold text-foreground">Signal Radar</Text>

                <View className="gap-1.5">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-xs font-sans-semibold text-muted-foreground">Consistency Rate</Text>
                        <Text className="text-xs font-sans-semibold text-primary">{consistencyPct}%</Text>
                    </View>
                    <DotScale value={consistencyPct} max={100} tone="primary" />
                </View>

                <View className="gap-1.5">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-xs font-sans-semibold text-muted-foreground">Missed (14d)</Text>
                        <Text className="text-xs font-sans-semibold text-danger">{missedLast14}</Text>
                    </View>
                    <DotScale value={missedLast14} max={14} tone="danger" />
                </View>

                <View className="gap-1.5">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-xs font-sans-semibold text-muted-foreground">Active Habits Today</Text>
                        <Text className="text-xs font-sans-semibold text-success">{activeHabits}</Text>
                    </View>
                    <DotScale value={activeHabits} max={Math.max(activeHabits, 6)} tone="success" />
                </View>
            </View>

            <View className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm">
                <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-sans-semibold text-foreground">Logs</Text>
                    <Text className="text-xs font-sans-medium text-muted-foreground">{selectedDateLabel}</Text>
                </View>

                {logs.length === 0 ? (
                    <View className="rounded-xl border border-border bg-background px-3 py-4">
                        <Text className="text-xs text-muted-foreground font-sans-medium">
                            No logged habit actions for this day.
                        </Text>
                    </View>
                ) : (
                    logs.slice(0, 5).map((log) => {
                        const tone = statusTone(log.status);
                        return (
                            <View
                                key={`${log.habitId}:${log.occurredAt}`}
                                className="rounded-xl border border-border bg-background p-3"
                            >
                                <View className="flex-row items-start justify-between gap-2">
                                    <View className="flex-1">
                                        <Text className="text-sm text-foreground font-sans-semibold">{log.name}</Text>
                                        <Text className="text-xs text-muted-foreground font-sans-medium mt-0.5">
                                            {new Date(log.occurredAt).toLocaleTimeString()}
                                        </Text>
                                    </View>
                                    <View className={`rounded-full border px-2.5 py-1 flex-row items-center gap-1.5 ${tone.chipClass}`}>
                                        <Ionicons name={tone.icon} size={12} color={tone.iconColor} />
                                        <Text className="text-[10px] uppercase font-sans-bold">{statusLabel(log.status)}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })
                )}
            </View>
        </ScrollView>
    );
}
