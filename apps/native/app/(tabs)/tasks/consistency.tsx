import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { Ionicons } from "@expo/vector-icons";
import { Button, Chip, Separator, Surface } from "heroui-native";

import {
  taskDataHealthRef,
  taskOnTimeMetricsRef,
  tasksConsistencyRef,
  tasksFilteredRef,
} from "@/lib/productivity-refs";
import { getLocalDayKey } from "@/lib/date";

type WindowOption = 7 | 30 | 90;
type TaskStatus = "inbox" | "focus" | "deferred" | "completed" | "abandoned";
type TaskPriority = "low" | "medium" | "high";
type CompositionTab = "status" | "priority";
type CompositionTone = "accent" | "success" | "warning" | "danger";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Surface className="flex-1 rounded-2xl border border-border bg-surface p-4">
      <Text className="text-[11px] uppercase tracking-[0.5px] text-muted-foreground">
        {label}
      </Text>
      <Text className="mt-1 text-2xl font-bold text-foreground">{value}</Text>
      {sub ? (
        <Text className="mt-1 text-xs text-muted-foreground">{sub}</Text>
      ) : null}
    </Surface>
  );
}

function pctFromCount(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

function toneStyles(tone: CompositionTone) {
  if (tone === "success") {
    return {
      text: "text-success",
      bgSoft: "bg-success/10",
      borderSoft: "border-success/30",
      solid: "bg-success",
    };
  }
  if (tone === "warning") {
    return {
      text: "text-warning",
      bgSoft: "bg-warning/10",
      borderSoft: "border-warning/30",
      solid: "bg-warning",
    };
  }
  if (tone === "danger") {
    return {
      text: "text-danger",
      bgSoft: "bg-danger/10",
      borderSoft: "border-danger/30",
      solid: "bg-danger",
    };
  }
  return {
    text: "text-accent",
    bgSoft: "bg-accent/10",
    borderSoft: "border-accent/30",
    solid: "bg-accent",
  };
}

function DotScaleRow({
  label,
  count,
  total,
  tone,
}: {
  label: string;
  count: number;
  total: number;
  tone: CompositionTone;
}) {
  const pct = pctFromCount(count, total);
  const styles = toneStyles(tone);
  const filled = Math.max(0, Math.min(10, Math.round(pct / 10)));

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-foreground">{label}</Text>
        <Text className="text-xs text-muted-foreground">
          {count} ({pct}%)
        </Text>
      </View>
      <View className="flex-row gap-1.5">
        {Array.from({ length: 10 }).map((_, index) => (
          <View
            key={`${label}-dot-${index}`}
            className={`h-2.5 flex-1 rounded-full ${index < filled ? styles.solid : "bg-muted"}`}
          />
        ))}
      </View>
    </View>
  );
}

function CompositionSegment({
  active,
  onPress,
  label,
}: {
  active: boolean;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 rounded-xl px-3 py-2.5 items-center ${
        active
          ? "bg-accent/20 border border-accent/40"
          : "bg-background border border-border"
      }`}
    >
      <Text
        className={`text-xs font-semibold uppercase tracking-[0.4px] ${
          active ? "text-accent" : "text-muted-foreground"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function WindowPicker({
  selected,
  onChange,
}: {
  selected: WindowOption;
  onChange: (window: WindowOption) => void;
}) {
  return (
    <View className="flex-row gap-2">
      {[7, 30, 90].map((window) => {
        const active = selected === window;
        return (
          <Pressable
            key={window}
            onPress={() => onChange(window as WindowOption)}
            className="rounded-full"
          >
            <Chip variant="soft" color={active ? "accent" : "default"}>
              <Chip.Label
                className={`text-xs font-medium ${active ? "text-accent" : "text-muted-foreground"}`}
              >
                {window}d
              </Chip.Label>
            </Chip>
          </Pressable>
        );
      })}
    </View>
  );
}

function TrendBars({
  trend,
}: {
  trend: Array<{ dayKey: string; completed: number }>;
}) {
  const max = Math.max(...trend.map((t) => t.completed), 0);
  const reduced = trend.length > 21 ? trend.slice(trend.length - 21) : trend;

  return (
    <Surface className="rounded-xl border border-border bg-background p-3">
      <View className="h-20 flex-row items-end gap-1">
        {reduced.map((item) => {
          const pct =
            max > 0 ? Math.max(8, Math.round((item.completed / max) * 100)) : 4;
          return (
            <View
              key={item.dayKey}
              className="flex-1 rounded-sm bg-accent/80"
              style={{ height: `${pct}%` }}
            />
          );
        })}
      </View>
      <View className="mt-2 flex-row justify-between">
        <Text className="text-[11px] text-muted-foreground">
          Recent completion trend
        </Text>
        <Text className="text-[11px] text-muted-foreground">
          max/day: {max}
        </Text>
      </View>
    </Surface>
  );
}

export default function TasksDetailsScreen() {
  const router = useRouter();
  const dayKey = getLocalDayKey();
  const [windowDays, setWindowDays] = useState<WindowOption>(30);
  const [compositionTab, setCompositionTab] =
    useState<CompositionTab>("status");

  const allTasks = useQuery(tasksFilteredRef, {}) ?? [];
  const consistency = useQuery(tasksConsistencyRef, {
    dayKey,
    windowDays,
    trendDays: Math.max(14, windowDays),
  });
  const onTime = useQuery(taskOnTimeMetricsRef, { windowDays });
  const dataHealth = useQuery(taskDataHealthRef, {});

  const stats = useMemo(() => {
    const now = Date.now();
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date();
    dayEnd.setHours(23, 59, 59, 999);

    const byStatus: Record<TaskStatus, number> = {
      inbox: 0,
      focus: 0,
      deferred: 0,
      completed: 0,
      abandoned: 0,
    };

    const byPriority: Record<TaskPriority, number> = {
      low: 0,
      medium: 0,
      high: 0,
    };

    let overdueOpen = 0;
    let dueTodayOpen = 0;

    for (const task of allTasks) {
      const status = (task.status ?? "inbox") as TaskStatus;
      const priority = (task.priority ?? "medium") as TaskPriority;

      if (byStatus[status] !== undefined) byStatus[status] += 1;
      if (byPriority[priority] !== undefined) byPriority[priority] += 1;

      const isOpen = status !== "completed" && status !== "abandoned";
      if (isOpen && typeof task.dueAt === "number") {
        if (task.dueAt < now) overdueOpen += 1;
        if (task.dueAt >= dayStart.getTime() && task.dueAt <= dayEnd.getTime())
          dueTodayOpen += 1;
      }
    }

    return {
      total: allTasks.length,
      open: byStatus.inbox + byStatus.focus + byStatus.deferred,
      completed: byStatus.completed,
      completionPct:
        allTasks.length > 0
          ? Math.round((byStatus.completed / allTasks.length) * 100)
          : 0,
      byStatus,
      byPriority,
      overdueOpen,
      dueTodayOpen,
    };
  }, [allTasks]);

  const statusItems = useMemo(
    () => [
      {
        key: "inbox",
        label: "Inbox",
        count: stats.byStatus.inbox,
        tone: "accent" as const,
      },
      {
        key: "focus",
        label: "Focus",
        count: stats.byStatus.focus,
        tone: "warning" as const,
      },
      {
        key: "deferred",
        label: "Deferred",
        count: stats.byStatus.deferred,
        tone: "danger" as const,
      },
      {
        key: "completed",
        label: "Completed",
        count: stats.byStatus.completed,
        tone: "success" as const,
      },
      {
        key: "abandoned",
        label: "Abandoned",
        count: stats.byStatus.abandoned,
        tone: "danger" as const,
      },
    ],
    [stats.byStatus],
  );

  const priorityItems = useMemo(
    () => [
      {
        key: "high",
        label: "High",
        count: stats.byPriority.high,
        tone: "danger" as const,
      },
      {
        key: "medium",
        label: "Medium",
        count: stats.byPriority.medium,
        tone: "warning" as const,
      },
      {
        key: "low",
        label: "Low",
        count: stats.byPriority.low,
        tone: "success" as const,
      },
    ],
    [stats.byPriority],
  );

  const compositionItems =
    compositionTab === "status" ? statusItems : priorityItems;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 pb-20 pt-4 gap-4 mt-4"
    >
      <View className="mb-1 flex-row items-center justify-between">
        <View>
          <Text className="text-3xl font-semibold text-foreground">
            Task Analytics Window
          </Text>
          <Text className="text-xs text-muted-foreground">
            Controls consistency + SLA range
          </Text>
        </View>
      </View>

      <WindowPicker selected={windowDays} onChange={setWindowDays} />

      <View className="flex-row gap-3">
        <StatCard
          label="Total"
          value={String(stats.total)}
          sub="All tracked tasks"
        />
        <StatCard
          label="Open"
          value={String(stats.open)}
          sub={`Due today ${stats.dueTodayOpen}`}
        />
      </View>
      <View className="flex-row gap-3">
        <StatCard
          label="Completed"
          value={String(stats.completed)}
          sub={`${stats.completionPct}% overall`}
        />
        <StatCard
          label="Overdue"
          value={String(stats.overdueOpen)}
          sub="Open tasks past due"
        />
      </View>

      <Surface className="rounded-2xl border border-border bg-surface p-4 gap-3">
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="text-base font-semibold text-foreground">
              Workload Composition
            </Text>
            <Text className="text-xs text-muted-foreground mt-1">
              Switch between status and priority distribution
            </Text>
          </View>
          <Chip variant="soft" color="default" size="sm">
            <Chip.Label className="text-xs text-muted-foreground">
              Total {stats.total}
            </Chip.Label>
          </Chip>
        </View>

        <View className="flex-row gap-2">
          <CompositionSegment
            label="Status"
            active={compositionTab === "status"}
            onPress={() => setCompositionTab("status")}
          />
          <CompositionSegment
            label="Priority"
            active={compositionTab === "priority"}
            onPress={() => setCompositionTab("priority")}
          />
        </View>

        <View className="gap-3">
          {compositionItems.map((item) => (
            <DotScaleRow
              key={item.key}
              label={item.label}
              count={item.count}
              total={stats.total}
              tone={item.tone}
            />
          ))}
        </View>
      </Surface>

      <Surface className="rounded-2xl border border-border bg-surface p-4 gap-3">
        <Text className="text-base font-semibold text-foreground">
          Consistency
        </Text>
        <Separator />
        {consistency === undefined ? (
          <Text className="text-sm text-muted-foreground">
            Loading consistency...
          </Text>
        ) : (
          <>
            <View className="flex-row gap-3">
              <StatCard
                label="Completion"
                value={`${consistency.completionRatePct}%`}
                sub={`${consistency.completedInWindow}/${consistency.createdInWindow} in window`}
              />
              <StatCard
                label="Streak"
                value={`${consistency.currentStreak}d`}
                sub={`Best ${consistency.bestStreak}d`}
              />
            </View>
            <TrendBars trend={consistency.trend} />
          </>
        )}
      </Surface>

      <Surface className="rounded-2xl border border-border bg-surface p-4 gap-3">
        <Text className="text-base font-semibold text-foreground">
          On-time SLA
        </Text>
        <Separator />
        {onTime === undefined ? (
          <Text className="text-sm text-muted-foreground">
            Loading SLA metrics...
          </Text>
        ) : (
          <>
            <View className="flex-row items-end justify-between">
              <Text className="text-4xl font-bold text-foreground">
                {onTime.onTimeRatePct}%
              </Text>
              <Text className="text-xs text-muted-foreground">
                window {onTime.windowDays} days
              </Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-muted">
              <View
                className="h-2 rounded-full bg-success"
                style={{ width: `${onTime.onTimeRatePct}%` }}
              />
            </View>
            <Text className="text-xs text-muted-foreground">
              On-time {onTime.onTimeCompleted} · Late{" "}
              {onTime.overdueCompletions} · With due date{" "}
              {onTime.completedWithDue}
            </Text>
          </>
        )}
      </Surface>

      <Surface className="rounded-2xl border border-border bg-surface p-4 gap-2">
        <Text className="text-base font-semibold text-foreground">
          Data Health
        </Text>
        <Separator />
        {dataHealth === undefined ? (
          <Text className="text-sm text-muted-foreground">
            Loading data health...
          </Text>
        ) : (
          <>
            <Text className="text-sm text-foreground">
              Total tasks: {dataHealth.totalTasks}
            </Text>
            <Text className="text-xs text-muted-foreground">
              Missing priority: {dataHealth.missingPriority} · Missing
              updatedAt: {dataHealth.missingUpdatedAt}
            </Text>
            <Text className="text-xs text-muted-foreground">
              Recurring without series: {dataHealth.recurringWithoutSeries} ·
              Invalid dependencies: {dataHealth.invalidDependencies}
            </Text>
          </>
        )}
      </Surface>
    </ScrollView>
  );
}
