import { makeFunctionReference } from "convex/server";
import type { Id, Doc } from "@seila/backend/convex/_generated/dataModel";

export type HabitCadence = "daily" | "weekdays" | { customDays: number[] };
export type HabitAnchor = "morning" | "afternoon" | "evening" | "anytime";
export type HabitDifficulty = "low" | "medium" | "high";
export type HabitKind = "build" | "break";
export type HabitTargetType = "binary" | "quantity" | "duration";
export type HabitBreakGoal = "quit" | "limit";
export type HabitBreakMetric = "times" | "minutes";
export type HabitFrequencyType = "daily" | "weekly";
export type HabitFrequencyConfig = { everyXDays?: number; weekdays?: number[] };
export type HabitTimePreference = "morning" | "afternoon" | "evening" | "flexible";
export type HabitEnergyLevel = "low" | "medium" | "high";

export const todayHabitsRef = makeFunctionReference<
  "query",
  { dayKey: string; lowEnergyMode?: boolean },
  Array<{
    habitId: Id<"habits">;
    name: string;
    cadence: HabitCadence;
    anchor?: HabitAnchor;
    difficulty?: HabitDifficulty;
    kind?: HabitKind;
    breakGoal?: HabitBreakGoal;
    breakMetric?: HabitBreakMetric;
    targetValue?: number;
    targetUnit?: string;
    targetType?: HabitTargetType;
    frequencyType?: HabitFrequencyType;
    frequencyConfig?: HabitFrequencyConfig;
    identityTags?: string[];
    energyLevel?: HabitEnergyLevel;
    timePreference?: HabitTimePreference;
    timezone?: string;
    startDayKey?: string;
    endDayKey?: string;
    todayStatus?: "completed" | "skipped" | "snoozed" | "missed" | "relapsed";
    todayOccurredAt?: number;
    todayValue?: number;
    completed?: boolean;
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
    breakGoal?: HabitBreakGoal;
    breakMetric?: HabitBreakMetric;
    targetValue?: number;
    targetUnit?: string;
    targetType?: HabitTargetType;
    frequencyType?: HabitFrequencyType;
    frequencyConfig?: HabitFrequencyConfig;
    identityTags?: string[];
    energyLevel?: HabitEnergyLevel;
    timePreference?: HabitTimePreference;
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
    breakGoal?: HabitBreakGoal;
    breakMetric?: HabitBreakMetric;
    targetValue?: number;
    targetUnit?: string;
    targetType?: HabitTargetType;
    frequencyType?: HabitFrequencyType;
    frequencyConfig?: HabitFrequencyConfig;
    identityTags?: string[];
    energyLevel?: HabitEnergyLevel;
    timePreference?: HabitTimePreference;
    timezone?: string;
    startDayKey?: string;
    endDayKey?: string;
  },
  { habitId?: Id<"habits">; deduplicated: boolean }
>("commands/habits/updateHabit:updateHabit");

export const logHabitRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; habitId: Id<"habits">; dayKey: string; value?: number },
  { habitId?: Id<"habits">; deduplicated: boolean }
>("commands/habits/logHabit:logHabit");

export const gentleReturnSuggestionRef = makeFunctionReference<
  "query",
  { dayKey: string },
  { habitId: Id<"habits">; name: string; energyLevel: HabitEnergyLevel; targetType: HabitTargetType } | null
>("queries/habitInsights:gentleReturnSuggestion");

export const habitAnalyticsRef = makeFunctionReference<
  "query",
  { dayKey: string },
  {
    completion7d: { scheduled: number; completed: number; ratePct: number };
    completion30d: { scheduled: number; completed: number; ratePct: number };
    energyCompletion: Record<HabitEnergyLevel, number>;
    identityBreakdown: Array<{ tag: string; scheduled: number; completed: number; ratePct: number }>;
    identityImbalance:
      | {
          strongestTag: string;
          strongestRatePct: number;
          weakestTag: string;
          weakestRatePct: number;
        }
      | null;
  }
>("queries/habitInsights:habitAnalytics");

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

export const tasksFilteredRef = makeFunctionReference<
  "query",
  {
    search?: string;
    status?: "inbox" | "focus" | "deferred" | "completed" | "abandoned";
    priority?: "low" | "medium" | "high";
    dueBucket?: "all" | "today" | "overdue" | "none";
  },
  Doc<"tasks">[]
>("queries/taskQueries:filteredTasks");

export const taskTimeBlockSuggestionsRef = makeFunctionReference<
  "query",
  { startAt?: number; horizonMinutes?: number },
  Array<{
    taskId: string;
    title: string;
    startAt: number;
    endAt: number;
    estimateMinutes: number;
    priority?: "low" | "medium" | "high";
  }>
>("queries/taskQueries:taskTimeBlockSuggestions");

export const taskOnTimeMetricsRef = makeFunctionReference<
  "query",
  { windowDays?: number },
  {
    windowDays: number;
    completed: number;
    completedWithDue: number;
    onTimeCompleted: number;
    overdueCompletions: number;
    onTimeRatePct: number;
  }
>("queries/taskQueries:taskOnTimeMetrics");

export const taskDataHealthRef = makeFunctionReference<
  "query",
  {},
  {
    totalTasks: number;
    missingUpdatedAt: number;
    missingPriority: number;
    recurringWithoutSeries: number;
    invalidDependencies: number;
  }
>("queries/taskQueries:taskDataHealth");

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
    estimateMinutes?: number;
    recurrence?: "daily" | "weekly" | "monthly";
    blockedByTaskId?: Id<"tasks">;
    blockedReason?: string;
    subtasks?: Array<{ id: string; title: string; completed: boolean }>;
    seriesId?: string;
    recurrenceEnabled?: boolean;
    skipNextRecurrence?: boolean;
    remindersEnabled?: boolean;
    reminderOffsetMinutes?: number;
    reminderSnoozedUntil?: number;
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
    estimateMinutes?: number;
    recurrence?: "daily" | "weekly" | "monthly";
    blockedByTaskId?: Id<"tasks">;
    blockedReason?: string;
    subtasks?: Array<{ id: string; title: string; completed: boolean }>;
    seriesId?: string;
    recurrenceEnabled?: boolean;
    skipNextRecurrence?: boolean;
    remindersEnabled?: boolean;
    reminderOffsetMinutes?: number;
    reminderSnoozedUntil?: number;
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

export const bulkUpdateTasksRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    taskIds: Id<"tasks">[];
    action: "focus" | "defer" | "complete" | "abandon" | "reopen" | "setPriority";
    deferUntil?: number;
    priority?: "low" | "medium" | "high";
  },
  { updated: number }
>("commands/tasks/bulkUpdateTasks:bulkUpdateTasks");

export const skipNextRecurrenceRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; taskId: Id<"tasks"> },
  { success: boolean }
>("commands/tasks/skipNextRecurrence:skipNextRecurrence");

export const pauseTaskRecurrenceRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; taskId: Id<"tasks">; paused: boolean },
  { success: boolean }
>("commands/tasks/pauseTaskRecurrence:pauseTaskRecurrence");

export const updateTaskSeriesRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    taskId: Id<"tasks">;
    applyTo: "this" | "future";
    recurrence?: "daily" | "weekly" | "monthly";
    note?: string;
    estimateMinutes?: number;
    priority?: "low" | "medium" | "high";
  },
  { updated: number }
>("commands/tasks/updateTaskSeries:updateTaskSeries");

export const snoozeTaskReminderRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; taskId: Id<"tasks">; snoozeMinutes: number },
  { success: boolean; snoozedUntil: number }
>("commands/tasks/snoozeTaskReminder:snoozeTaskReminder");

export const backfillTaskDefaultsRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string },
  { updated: number }
>("commands/tasks/backfillTaskDefaults:backfillTaskDefaults");

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

export const currentReviewRef = makeFunctionReference<
  "query",
  {},
  Doc<"reviews"> | null
>("queries/reviewQueries:currentReview");

export const startReviewRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string },
  Id<"reviews">
>("commands/misc/reviewCommands:startReview");

export const submitReflectionRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    reviewId: Id<"reviews">;
    feltGood: string;
    feltHard: string;
    carryForward: string;
    aiSuggested?: string;
  },
  { success: boolean; deduplicated: boolean }
>("commands/misc/reviewCommands:submitReflection");

export const setReviewIntentionsRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    reviewId: Id<"reviews">;
    intentions: string[];
  },
  { success: boolean; deduplicated: boolean }
>("commands/misc/reviewCommands:setIntentions");

export const closeReviewRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    reviewId: Id<"reviews">;
    summary?: string;
    brightSpot?: string;
    worthNoticing?: string;
  },
  { success: boolean; deduplicated: boolean }
>("commands/misc/reviewCommands:closeReview");

export const skipReviewRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string },
  { success: boolean; deduplicated: boolean }
>("commands/misc/reviewCommands:skipReview");
