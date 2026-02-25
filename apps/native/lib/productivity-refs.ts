import { makeFunctionReference } from "convex/server";
import type { Id, Doc } from "@seila/backend/convex/_generated/dataModel";

export type HabitCadence = "daily" | "weekdays" | { customDays: number[] };
export type HabitAnchor = "morning" | "afternoon" | "evening" | "anytime";
export type HabitDifficulty = "low" | "medium" | "high";
export type HabitKind = "build" | "break";

export const todayHabitsRef = makeFunctionReference<
  "query",
  { dayKey: string },
  Array<{
    habitId: Id<"habits">;
    name: string;
    cadence: HabitCadence;
    anchor?: HabitAnchor;
    difficulty?: HabitDifficulty;
    kind?: HabitKind;
    targetValue?: number;
    targetUnit?: string;
    timezone?: string;
    startDayKey?: string;
    endDayKey?: string;
    todayStatus?: "completed" | "skipped" | "snoozed" | "missed" | "relapsed";
    todayOccurredAt?: number;
    snoozedUntil?: number;
  }>
>("queries/todayHabits:todayHabits");

export const createHabitRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    name: string;
    cadence: HabitCadence;
    anchor?: HabitAnchor;
    difficulty?: HabitDifficulty;
    kind?: HabitKind;
    targetValue?: number;
    targetUnit?: string;
    timezone?: string;
    startDayKey?: string;
    endDayKey?: string;
  },
  { habitId?: string; deduplicated: boolean }
>("commands/habits/createHabit:createHabit");

export const updateHabitRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    habitId: Id<"habits">;
    name: string;
    cadence: HabitCadence;
    anchor?: HabitAnchor;
    difficulty?: HabitDifficulty;
    kind?: HabitKind;
    targetValue?: number;
    targetUnit?: string;
    timezone?: string;
    startDayKey?: string;
    endDayKey?: string;
  },
  { habitId?: Id<"habits">; deduplicated: boolean }
>("commands/habits/updateHabit:updateHabit");

export const logHabitRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; habitId: Id<"habits">; dayKey: string },
  { habitId?: Id<"habits">; deduplicated: boolean }
>("commands/habits/logHabit:logHabit");

export const skipHabitRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; habitId: Id<"habits">; dayKey: string },
  { habitId?: Id<"habits">; deduplicated: boolean }
>("commands/habits/skipHabit:skipHabit");

export const snoozeHabitRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; habitId: Id<"habits">; dayKey: string; snoozedUntil: number },
  { habitId?: Id<"habits">; deduplicated: boolean }
>("commands/habits/snoozeHabit:snoozeHabit");

export const relapseHabitRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; habitId: Id<"habits">; dayKey: string },
  { habitId?: Id<"habits">; deduplicated: boolean }
>("commands/habits/relapseHabit:relapseHabit");

export const resolveMissedHabitsRef = makeFunctionReference<
  "mutation",
  { dayKey: string; lookbackDays?: number },
  { marked: number }
>("commands/habits/resolveMissedHabits:resolveMissedHabits");

export const clearHabitTodayStatusRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; habitId: Id<"habits">; dayKey: string },
  { habitId?: Id<"habits">; cleared: boolean; deduplicated: boolean }
>("commands/habits/clearHabitTodayStatus:clearHabitTodayStatus");

export const habitStalePromptsRef = makeFunctionReference<
  "query",
  { dayKey: string },
  Array<{
    habitId: Id<"habits">;
    name: string;
    inactiveDays: number;
    stage: "stale" | "overdue";
  }>
>("queries/habitStalePrompts:habitStalePrompts");

export const respondStaleHabitPromptRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    habitId: Id<"habits">;
    dayKey: string;
    action: "keep" | "pause_30" | "archive";
  },
  { habitId?: Id<"habits">; deduplicated: boolean }
>("commands/habits/respondStaleHabitPrompt:respondStaleHabitPrompt");

export const habitsConsistencyRef = makeFunctionReference<
  "query",
  { dayKey: string; windowDays?: number; trendDays?: number },
  {
    windowDays: number;
    consistencyPct: number;
    completedScheduledDays: number;
    scheduledDays: number;
    currentStreak: number;
    bestStreak: number;
    missedLast14: number;
    activeHabits: number;
    trend: Array<{
      dayKey: string;
      score: number;
      scheduled: number;
      completed: number;
    }>;
  }
>("queries/consistencyQueries:habitsConsistency");

export const habitConsistencyByIdRef = makeFunctionReference<
  "query",
  { habitId: Id<"habits">; dayKey: string; windowDays?: number },
  {
    habitId: Id<"habits">;
    name: string;
    cadence: HabitCadence;
    anchor?: HabitAnchor;
    difficulty?: HabitDifficulty;
    kind?: HabitKind;
    windowDays: number;
    consistencyPct: number;
    scheduledDays: number;
    completedDays: number;
    skippedDays: number;
    snoozedDays: number;
    missedDays: number;
    relapsedDays: number;
    currentStreak: number;
    bestStreak: number;
    trend: Array<{
      dayKey: string;
      scheduled: boolean;
      status?: "completed" | "skipped" | "snoozed" | "missed" | "relapsed";
      score: number;
    }>;
  } | null
>("queries/consistencyQueries:habitConsistencyById");

export const habitDayDetailsRef = makeFunctionReference<
  "query",
  { dayKey: string },
  {
    dayKey: string;
    logs: Array<{
      habitId: Id<"habits">;
      name: string;
      status: "completed" | "skipped" | "snoozed" | "missed" | "relapsed";
      occurredAt: number;
      anchor?: HabitAnchor;
      difficulty?: HabitDifficulty;
      kind?: HabitKind;
    }>;
    scheduledHabits: Array<{ habitId: Id<"habits">; name: string }>;
  }
>("queries/consistencyQueries:habitDayDetails");

export const habitHistoryRef = makeFunctionReference<
  "query",
  { habitId: Id<"habits"> },
  Array<{ type: string; occurredAt: number; payload: unknown }>
>("queries/habitManagement:habitHistory");

export const habitLifecycleRef = makeFunctionReference<
  "query",
  { dayKey: string },
  {
    paused: Array<{ habitId: Id<"habits">; name: string; pausedUntilDayKey?: string; kind?: HabitKind }>;
    archived: Array<{ habitId: Id<"habits">; name: string; archivedAt?: number; kind?: HabitKind }>;
  }
>("queries/habitManagement:habitLifecycle");

export const resumePausedHabitRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; habitId: Id<"habits"> },
  { habitId?: Id<"habits">; deduplicated: boolean }
>("commands/habits/resumePausedHabit:resumePausedHabit");

export const restoreArchivedHabitRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; habitId: Id<"habits"> },
  { restoredHabitId?: string; deduplicated: boolean }
>("commands/habits/restoreArchivedHabit:restoreArchivedHabit");

export const archiveHabitRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; habitId: Id<"habits"> },
  { habitId?: Id<"habits">; deduplicated: boolean }
>("commands/habits/archiveHabit:archiveHabit");

export const tasksFocusRef = makeFunctionReference<"query", {}, Doc<"tasks">[]>(
  "queries/taskQueries:todayFocus",
);

export const tasksInboxRef = makeFunctionReference<"query", {}, Doc<"tasks">[]>(
  "queries/taskQueries:inbox",
);

export const tasksDeferredRef = makeFunctionReference<"query", {}, Doc<"tasks">[]>(
  "queries/taskQueries:deferred",
);

export const tasksDoneRecentlyRef = makeFunctionReference<"query", {}, Doc<"tasks">[]>(
  "queries/taskQueries:doneRecently",
);

export const taskByIdRef = makeFunctionReference<
  "query",
  { taskId: Id<"tasks"> },
  Doc<"tasks"> | null
>("queries/taskQueries:taskById");

export const taskHistoryRef = makeFunctionReference<
  "query",
  { taskId: Id<"tasks"> },
  Array<{ type: string; occurredAt: number; payload: unknown }>
>("queries/taskQueries:taskHistory");

export const captureTaskRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    title: string;
    note?: string;
    priority?: "low" | "medium" | "high";
    dueAt?: number;
  },
  Id<"tasks">
>("commands/tasks/captureTask:captureTask");

export const updateTaskRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    taskId: Id<"tasks">;
    title: string;
    note?: string;
    priority?: "low" | "medium" | "high";
    dueAt?: number;
  },
  { success: boolean; deduplicated?: boolean }
>("commands/tasks/updateTask:updateTask");

export const focusTaskRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; taskId: Id<"tasks"> },
  { success: boolean; message?: string }
>("commands/tasks/focusTask:focusTask");

export const deferTaskRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; taskId: Id<"tasks">; deferUntil?: number },
  { success: boolean }
>("commands/tasks/deferTask:deferTask");

export const completeTaskRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; taskId: Id<"tasks"> },
  { success: boolean }
>("commands/tasks/completeTask:completeTask");

export const abandonTaskRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; taskId: Id<"tasks"> },
  { success: boolean }
>("commands/tasks/abandonTask:abandonTask");

export const reopenTaskRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; taskId: Id<"tasks"> },
  { success: boolean }
>("commands/tasks/reopenTask:reopenTask");

export const tasksConsistencyRef = makeFunctionReference<
  "query",
  { dayKey: string; windowDays?: number; trendDays?: number },
  {
    windowDays: number;
    completionRatePct: number;
    createdInWindow: number;
    completedInWindow: number;
    currentStreak: number;
    bestStreak: number;
    trend: Array<{ dayKey: string; completed: number }>;
  }
>("queries/consistencyQueries:tasksConsistency");

export const taskConsistencyByIdRef = makeFunctionReference<
  "query",
  { taskId: Id<"tasks">; dayKey: string; windowDays?: number },
  {
    taskId: Id<"tasks">;
    title: string;
    status: Doc<"tasks">["status"];
    createdAt: number;
    completedAt?: number;
    focusedAt?: number;
    deferredUntil?: number;
    windowDays: number;
    completionRatePct: number;
    createdInWindow: number;
    completedInWindow: number;
    currentStreak: number;
    bestStreak: number;
    trend: Array<{ dayKey: string; completed: number }>;
  } | null
>("queries/consistencyQueries:taskConsistencyById");

export const taskDayDetailsRef = makeFunctionReference<
  "query",
  { dayKey: string },
  {
    dayKey: string;
    created: Array<{ taskId: Id<"tasks">; title: string; status: Doc<"tasks">["status"]; at: number }>;
    completed: Array<{ taskId: Id<"tasks">; title: string; status: Doc<"tasks">["status"]; at: number }>;
    focused: Array<{ taskId: Id<"tasks">; title: string; status: Doc<"tasks">["status"]; at: number }>;
    deferred: Array<{ taskId: Id<"tasks">; title: string; status: Doc<"tasks">["status"]; at: number }>;
  }
>("queries/consistencyQueries:taskDayDetails");
