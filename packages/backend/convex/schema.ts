import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  hardModeConstraintValidator,
  hardModePlanValidator,
  hardModeScopeValidator,
} from "./hardMode/validators";
import {
  aiCalibrationValidator,
  aiMemoryEntryValidator,
  aiWorkingModelValidator,
} from "./aiContext/validators";
import { jsonPayloadObjectValidator } from "./lib/payloadValidators";

export default defineSchema({
  events: defineTable({
    type: v.string(),
    occurredAt: v.number(),
    idempotencyKey: v.string(),
    payload: jsonPayloadObjectValidator,
  }).index("by_idempotency_key", ["idempotencyKey"]),
  habits: defineTable({
    name: v.string(),
    cadence: v.union(
      v.literal("daily"),
      v.literal("weekdays"),
      v.object({ customDays: v.array(v.number()) }),
    ),
    anchor: v.optional(
      v.union(
        v.literal("morning"),
        v.literal("afternoon"),
        v.literal("evening"),
        v.literal("anytime"),
      ),
    ),
    difficulty: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    kind: v.optional(v.union(v.literal("build"), v.literal("break"))),
    targetValue: v.optional(v.number()),
    targetUnit: v.optional(v.string()),
    timezone: v.optional(v.string()),
    startDayKey: v.optional(v.string()),
    endDayKey: v.optional(v.string()),
    pausedUntilDayKey: v.optional(v.string()),
    stalePromptSnoozedUntil: v.optional(v.number()),
    lastEngagedAt: v.optional(v.number()),
    archivedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastCompletedAt: v.optional(v.number()),
    lastSkippedAt: v.optional(v.number()),
    snoozedUntil: v.optional(v.number()),
  }).index("by_archived_at", ["archivedAt"]),
  habitLogs: defineTable({
    habitId: v.id("habits"),
    dayKey: v.string(),
    status: v.union(
      v.literal("completed"),
      v.literal("skipped"),
      v.literal("snoozed"),
      v.literal("missed"),
      v.literal("relapsed"),
    ),
    occurredAt: v.number(),
    snoozedUntil: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_day_key", ["dayKey"])
    .index("by_habit_day", ["habitId", "dayKey"]),
  checkins: defineTable({
    type: v.union(v.literal("daily"), v.literal("weekly")),
    mood: v.number(),
    energy: v.number(),
    flags: v.array(v.string()),
    note: v.optional(v.string()),
    occurredAt: v.number(),
    weeklyAnswers: v.optional(
      v.object({
        feltGood: v.string(),
        feltHard: v.string(),
        carryForward: v.string(),
        aiSuggested: v.optional(v.string()),
      }),
    ),
  })
    .index("by_occurredAt", ["occurredAt"])
    .index("by_type", ["type"]),
  tasks: defineTable({
    title: v.string(),
    note: v.optional(v.string()),
    estimateMinutes: v.optional(v.number()),
    recurrence: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))),
    blockedByTaskId: v.optional(v.id("tasks")),
    blockedReason: v.optional(v.string()),
    subtasks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          completed: v.boolean(),
        }),
      ),
    ),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    dueAt: v.optional(v.number()),
    status: v.union(
      v.literal("inbox"),
      v.literal("focus"),
      v.literal("deferred"),
      v.literal("completed"),
      v.literal("abandoned"),
    ),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    reopenedAt: v.optional(v.number()),
    focusedAt: v.optional(v.number()),
    deferredUntil: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    abandonedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"])
    .index("by_due_at", ["dueAt"]),
  suggestions: defineTable({
    policy: v.string(),
    headline: v.string(),
    subtext: v.string(),
    priority: v.number(),
    action: v.optional(
      v.object({
        type: v.union(v.literal("open_screen"), v.literal("run_command")),
        label: v.string(),
        payload: v.optional(jsonPayloadObjectValidator),
      }),
    ),
    createdAt: v.number(),
    dismissedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  })
    .index("by_dismissed_at", ["dismissedAt"])
    .index("by_priority", ["priority"]),
  envelopes: defineTable({
    name: v.string(),
    softCeiling: v.optional(v.number()),
    emoji: v.optional(v.string()),
    isPrivate: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),
  transactions: defineTable({
    amount: v.number(),
    envelopeId: v.optional(v.id("envelopes")),
    source: v.union(v.literal("manual"), v.literal("imported")),
    merchantHint: v.optional(v.string()),
    note: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    occurredAt: v.number(),
    pendingImport: v.boolean(),
    voidedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_occurred_at", ["occurredAt"])
    .index("by_pending_import", ["pendingImport"])
    .index("by_envelope", ["envelopeId"]),
  patterns: defineTable({
    type: v.union(
      v.literal("mood_habit"),
      v.literal("energy_checkin_timing"),
      v.literal("spending_mood"),
    ),
    correlation: v.number(),
    confidence: v.number(),
    headline: v.string(),
    subtext: v.string(),
    detectedAt: v.number(),
    surfacedAt: v.optional(v.number()),
    pinnedAt: v.optional(v.number()),
    dismissedAt: v.optional(v.number()),
    expiresAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_dismissed_at", ["dismissedAt"])
    .index("by_type", ["type"])
    .index("by_confidence", ["confidence"])
    .index("by_expires_at", ["expiresAt"]),
  reviews: defineTable({
    weekStart: v.number(),
    weekEnd: v.number(),
    phase: v.union(
      v.literal("lookback"),
      v.literal("reflect"),
      v.literal("intentions"),
      v.literal("closed"),
    ),
    feltGood: v.optional(v.string()),
    feltHard: v.optional(v.string()),
    carryForward: v.optional(v.string()),
    aiSuggested: v.optional(v.string()),
    intentions: v.array(v.string()),
    summaryGenerated: v.boolean(),
    summary: v.optional(v.string()),
    brightSpot: v.optional(v.string()),
    worthNoticing: v.optional(v.string()),
    createdAt: v.number(),
    closedAt: v.optional(v.number()),
    skippedAt: v.optional(v.number()),
  })
    .index("by_week", ["weekStart"])
    .index("by_phase", ["phase"]),
  hardModeSessions: defineTable({
    scope: hardModeScopeValidator,
    constraints: v.array(hardModeConstraintValidator),
    windowStart: v.number(),
    windowEnd: v.number(),
    isActive: v.boolean(),
    plan: v.optional(hardModePlanValidator),
    createdAt: v.number(),
    deactivatedAt: v.optional(v.number()),
  })
    .index("by_active", ["isActive"])
    .index("by_window_end", ["windowEnd"]),
  scratchpadEntries: defineTable({
    text: v.string(),
    createdAt: v.number(),
    triagedAt: v.optional(v.number()),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_triaged_at", ["triagedAt"]),
  recoveryContext: defineTable({
    hardDayLooksLike: v.optional(v.string()),
    knownTriggers: v.array(v.string()),
    restDefinition: v.optional(v.string()),
    updatedAt: v.number(),
    createdAt: v.number(),
  }).index("by_updated_at", ["updatedAt"]),
  quietDays: defineTable({
    dayStart: v.number(),
    isQuiet: v.boolean(),
    setAt: v.number(),
    reason: v.optional(v.string()),
  }).index("by_day_start", ["dayStart"]),
  aiContext: defineTable({
    lastUpdated: v.number(),
    workingModel: aiWorkingModelValidator,
    memory: v.array(aiMemoryEntryValidator),
    calibration: aiCalibrationValidator,
  }).index("by_last_updated", ["lastUpdated"]),
  accounts: defineTable({
    name: v.string(),
    type: v.union(
      v.literal("checking"),
      v.literal("savings"),
      v.literal("cash"),
      v.literal("credit"),
      v.literal("other"),
    ),
    balance: v.number(),
    currency: v.optional(v.string()),
    institution: v.optional(v.string()),
    isHidden: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_type", ["type"]),
  incomes: defineTable({
    amount: v.number(),
    source: v.optional(v.string()),
    note: v.optional(v.string()),
    occurredAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_occurred_at", ["occurredAt"]),
  savingsGoals: defineTable({
    name: v.string(),
    targetAmount: v.number(),
    currentAmount: v.number(),
    envelopeId: v.optional(v.id("envelopes")),
    deadlineAt: v.optional(v.number()),
    archivedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_archived_at", ["archivedAt"]),
  receiptAttachments: defineTable({
    transactionId: v.id("transactions"),
    storageId: v.string(),
    fileName: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_transaction", ["transactionId"])
    .index("by_created_at", ["createdAt"]),
  debts: defineTable({
    name: v.string(),
    balance: v.number(),
    aprBps: v.number(),
    minPayment: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_active", ["isActive"]),
  investments: defineTable({
    name: v.string(),
    type: v.union(
      v.literal("stock"),
      v.literal("fund"),
      v.literal("crypto"),
      v.literal("cash"),
      v.literal("other"),
    ),
    currentValue: v.number(),
    costBasis: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_type", ["type"]),
  sharedBudgets: defineTable({
    name: v.string(),
    budgetAmount: v.number(),
    spentAmount: v.number(),
    members: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),
  fxRates: defineTable({
    baseCurrency: v.string(),
    quoteCurrency: v.string(),
    rateScaled: v.number(),
    asOf: v.number(),
    createdAt: v.number(),
  })
    .index("by_pair", ["baseCurrency", "quoteCurrency"])
    .index("by_as_of", ["asOf"]),
  weeklyMoneyCheckins: defineTable({
    weekStart: v.number(),
    wins: v.array(v.string()),
    overspendAreas: v.array(v.string()),
    correction: v.string(),
    focus: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_week", ["weekStart"]),
  lowSpendResets: defineTable({
    startedAt: v.number(),
    endsAt: v.number(),
    reason: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("canceled")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status"]),
  financeSecuritySettings: defineTable({
    biometricLockEnabled: v.boolean(),
    offlineModeEnabled: v.boolean(),
    conflictSafeSyncEnabled: v.boolean(),
    updatedAt: v.number(),
    createdAt: v.number(),
  }).index("by_updated_at", ["updatedAt"]),
});
