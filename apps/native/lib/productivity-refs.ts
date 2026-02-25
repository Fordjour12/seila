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
    startDayKey?: string;
    endDayKey?: string;
    todayStatus?: "completed" | "skipped" | "snoozed";
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

export const taskByIdRef = makeFunctionReference<
  "query",
  { taskId: Id<"tasks"> },
  Doc<"tasks"> | null
>("queries/taskQueries:taskById");

export const captureTaskRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; title: string },
  Id<"tasks">
>("commands/tasks/captureTask:captureTask");

export const updateTaskRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; taskId: Id<"tasks">; title: string },
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
