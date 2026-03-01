import type { Doc } from "@seila/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Button, Chip, Surface, Tabs, useToast } from "heroui-native";
import React from "react";
import { ScrollView, Text, View } from "react-native";

import { TaskCard } from "@/app/(tabs)/tasks/_components/TaskCard";
import {
    abandonTaskRef,
    completeTaskRef,
    deferTaskRef,
    focusTaskRef,
    tasksFilteredRef,
} from "@/lib/productivity-refs";
import { Ionicons } from "@expo/vector-icons";
import { useModeThemeColors } from "@/lib/theme";

type TaskStatus = "inbox" | "focus" | "deferred" | "completed" | "abandoned";
type TaskTab = "all" | TaskStatus;

type TaskDoc = Doc<"tasks">;

const STATUS_TABS: Array<{ value: TaskTab; label: string }> = [
    { value: "all", label: "All" },
    { value: "inbox", label: "Inbox" },
    { value: "focus", label: "Focus" },
    { value: "deferred", label: "Deferred" },
    { value: "completed", label: "Completed" },
    { value: "abandoned", label: "Abandoned" },
];

function getIdempotencyKey(prefix: string) {
    return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}

function toTaskStatus(value: unknown): TaskStatus {
    if (
        value === "inbox" ||
        value === "focus" ||
        value === "deferred" ||
        value === "completed" ||
        value === "abandoned"
    ) {
        return value;
    }
    return "inbox";
}

function getOverdueOpenCount(tasks: TaskDoc[]) {
    const now = Date.now();
    return tasks.filter((task) => {
        const status = toTaskStatus(task.status);
        const open = status !== "completed" && status !== "abandoned";
        return open && typeof task.dueAt === "number" && task.dueAt < now;
    }).length;
}

export default function AllTaskScreen() {
    const { toast } = useToast();

    const focusTask = useMutation(focusTaskRef);
    const deferTask = useMutation(deferTaskRef);
    const completeTask = useMutation(completeTaskRef);
    const abandonTask = useMutation(abandonTaskRef);

    const [activeTab, setActiveTab] = React.useState<TaskTab>("all");

    const allTasks = (useQuery(tasksFilteredRef, {}) ?? []) as TaskDoc[];

    const byStatus = React.useMemo(() => {
        const map: Record<TaskStatus, TaskDoc[]> = {
            inbox: [],
            focus: [],
            deferred: [],
            completed: [],
            abandoned: [],
        };

        for (const task of allTasks) {
            map[toTaskStatus(task.status)].push(task);
        }

        return map;
    }, [allTasks]);

    const counts = React.useMemo(
        () => ({
            all: allTasks.length,
            inbox: byStatus.inbox.length,
            focus: byStatus.focus.length,
            deferred: byStatus.deferred.length,
            completed: byStatus.completed.length,
            abandoned: byStatus.abandoned.length,
        }),
        [allTasks.length, byStatus],
    );

    const openCount = counts.inbox + counts.focus + counts.deferred;
    const overdueOpen = React.useMemo(() => getOverdueOpenCount(allTasks), [allTasks]);

    const tasksForTab = React.useMemo(() => {
        if (activeTab === "all") {
            return allTasks;
        }
        return byStatus[activeTab];
    }, [activeTab, allTasks, byStatus]);

    const headerSubtitle =
        activeTab === "all"
            ? "Everything in one place"
            : `${activeTab[0].toUpperCase()}${activeTab.slice(1)} tasks`;

    const handleFocus = async (taskId: TaskDoc["_id"]) => {
        try {
            await focusTask({ idempotencyKey: getIdempotencyKey("task.focus"), taskId });
            toast.show({ variant: "success", label: "Moved to focus" });
        } catch {
            toast.show({ variant: "warning", label: "Could not focus task" });
        }
    };

    const handleDefer = async (taskId: TaskDoc["_id"]) => {
        try {
            await deferTask({
                idempotencyKey: getIdempotencyKey("task.defer"),
                taskId,
                deferUntil: Date.now() + 24 * 60 * 60 * 1000,
            });
            toast.show({ variant: "success", label: "Deferred to tomorrow" });
        } catch {
            toast.show({ variant: "danger", label: "Failed to defer task" });
        }
    };

    const handleComplete = async (taskId: TaskDoc["_id"]) => {
        try {
            await completeTask({ idempotencyKey: getIdempotencyKey("task.complete"), taskId });
            toast.show({ variant: "success", label: "Task completed" });
        } catch {
            toast.show({ variant: "danger", label: "Failed to complete task" });
        }
    };

    const handleAbandon = async (taskId: TaskDoc["_id"]) => {
        try {
            await abandonTask({ idempotencyKey: getIdempotencyKey("task.abandon"), taskId });
            toast.show({ variant: "default", label: "Task abandoned" });
        } catch {
            toast.show({ variant: "danger", label: "Failed to abandon task" });
        }
    };
    const Colors = useModeThemeColors()
    const router = useRouter()

    const handleAddTask = () => {
        router.push("/tasks/add")
    };
    const handleHistoryTask = () => {
        router.push("/tasks/consistency")
    }

    return (
        <ScrollView
            className="flex-1 bg-background"
            contentContainerClassName="px-4 pt-4 pb-24 gap-4"
            showsVerticalScrollIndicator={false}
        >
            <Surface className="rounded-3xl border border-border bg-surface px-4 py-4 gap-3 overflow-hidden">
                <View className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/15" />
                <View className="absolute -left-10 -bottom-12 h-36 w-36 rounded-full bg-warning/15" />

                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-xs uppercase tracking-[1.2px] text-muted-foreground font-sans-semibold">
                            Task Atlas
                        </Text>
                        <Text className="text-3xl text-foreground mt-1 font-sans-extrabold">All Tasks</Text>
                        <Text className="text-sm text-muted-foreground mt-1 font-sans-medium">{headerSubtitle}</Text>
                    </View>

                    <View className="flex-row">
                        <Button variant="ghost" onPress={handleAddTask} isIconOnly>
                            <Ionicons name="add" size={24} color={Colors.foreground} />
                        </Button>

                        <Button variant="ghost" onPress={handleHistoryTask} isIconOnly>
                            <Ionicons name="map-outline" size={24} color={Colors.foreground} />
                        </Button>
                    </View>


                </View>

                <View className="flex-row gap-2">
                    <Chip variant="soft" color="default" size="sm">
                        <Chip.Label className="text-xs text-muted-foreground font-sans-semibold">
                            Total {counts.all}
                        </Chip.Label>
                    </Chip>
                    <Chip variant="soft" color="accent" size="sm">
                        <Chip.Label className="text-xs text-accent font-sans-semibold">
                            Open {openCount}
                        </Chip.Label>
                    </Chip>
                    <Chip variant="soft" color="danger" size="sm">
                        <Chip.Label className="text-xs text-danger font-sans-semibold">
                            Overdue {overdueOpen}
                        </Chip.Label>
                    </Chip>
                </View>
            </Surface>

            <Tabs
                value={activeTab}
                onValueChange={(next) => setActiveTab(next as TaskTab)}
                variant="secondary"
                className="gap-3"
            >
                <Tabs.List>
                    <Tabs.ScrollView scrollAlign="center" className="gap-2">
                        <Tabs.Indicator />
                        {STATUS_TABS.map((tab) => (
                            <Tabs.Trigger key={tab.value} value={tab.value}>
                                <Tabs.Label className="text-xs font-sans-semibold">
                                    {tab.label} ({counts[tab.value]})
                                </Tabs.Label>
                            </Tabs.Trigger>
                        ))}
                    </Tabs.ScrollView>
                </Tabs.List>

                {STATUS_TABS.map((tab) => {
                    const tabTasks = tab.value === "all" ? allTasks : byStatus[tab.value];
                    return (
                        <Tabs.Content key={tab.value} value={tab.value}>
                            <View className="gap-3 mt-1">
                                {tabTasks.length === 0 ? (
                                    <Surface className="rounded-2xl border border-border bg-surface p-6 items-center">
                                        <Text className="text-base text-foreground font-sans-semibold">
                                            No {tab.label.toLowerCase()} tasks
                                        </Text>
                                        <Text className="text-sm text-muted-foreground mt-1 text-center font-sans-medium">
                                            This bucket is clear. Capture a new task or switch tabs.
                                        </Text>
                                    </Surface>
                                ) : (
                                    tabTasks.map((task) => (
                                        <TaskCard
                                            key={String(task._id)}
                                            task={{
                                                _id: String(task._id),
                                                title: task.title,
                                                description: task.note,
                                                source: task.status,
                                                dueAt: task.dueAt,
                                                priority: task.priority,
                                                status: task.status,
                                            }}
                                            onPress={() => router.push(`/(tabs)/tasks/edit?id=${task._id}`)}
                                            onCompletePress={() => handleComplete(task._id)}
                                            onFocusPress={() => handleFocus(task._id)}
                                            onDeferPress={() => handleDefer(task._id)}
                                            onAbandonPress={() => handleAbandon(task._id)}
                                        />
                                    ))
                                )}
                            </View>
                        </Tabs.Content>
                    );
                })}
            </Tabs>

            <Surface className="rounded-2xl border border-border bg-surface p-4">
                <Text className="text-xs uppercase tracking-[1px] text-muted-foreground font-sans-semibold">
                    Quick Snapshot
                </Text>
                <View className="flex-row items-center justify-between mt-2">
                    <Text className="text-sm text-foreground font-sans-medium">Active tab items</Text>
                    <Text className="text-lg text-foreground font-sans-bold">{tasksForTab.length}</Text>
                </View>
            </Surface>
        </ScrollView>
    );
}
