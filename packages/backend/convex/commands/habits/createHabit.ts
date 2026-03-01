import type { HabitCadence } from "@seila/domain-kernel";
import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";
import {
  anchorValidator,
  appendHabitEvent,
  assertValidCustomCadence,
  breakGoalValidator,
  breakMetricValidator,
  cadenceValidator,
  difficultyValidator,
  energyLevelValidator,
  frequencyConfigValidator,
  frequencyTypeValidator,
  getDedupedEventByIdempotencyKey,
  identityTagsValidator,
  kindValidator,
  dayKeyValidator,
  assertValidHabitWindow,
  assertValidHabitTarget,
  assertValidFrequencyConfig,
  inferBreakGoal,
  inferBreakMetric,
  targetTypeValidator,
  timePreferenceValidator,
  syncHabitProjection,
} from "../../habits/shared";

export const createHabit = mutation({
  args: {
    idempotencyKey: v.string(),
    name: v.string(),
    cadence: cadenceValidator,
    anchor: v.optional(anchorValidator),
    difficulty: v.optional(difficultyValidator),
    kind: v.optional(kindValidator),
    breakGoal: v.optional(breakGoalValidator),
    breakMetric: v.optional(breakMetricValidator),
    targetValue: v.optional(v.number()),
    targetUnit: v.optional(v.string()),
    targetType: v.optional(targetTypeValidator),
    frequencyType: v.optional(frequencyTypeValidator),
    frequencyConfig: v.optional(frequencyConfigValidator),
    identityTags: v.optional(identityTagsValidator),
    energyLevel: v.optional(energyLevelValidator),
    timePreference: v.optional(timePreferenceValidator),
    timezone: v.optional(v.string()),
    startDayKey: v.optional(dayKeyValidator),
    endDayKey: v.optional(dayKeyValidator),
  },
  handler: async (ctx, args) => {
    const existing = await getDedupedEventByIdempotencyKey(ctx, args.idempotencyKey);
    if (existing) {
      if (typeof existing.payload === "object" && existing.payload !== null) {
        const habitId = (existing.payload as { habitId?: unknown }).habitId;
        if (typeof habitId === "string") {
          return {
            habitId,
            deduplicated: true,
          };
        }
      }
      throw new ConvexError("Duplicate idempotency key already used by another command");
    }

    const name = args.name.trim();
    if (!name) {
      throw new ConvexError("Habit name cannot be empty");
    }

    assertValidCustomCadence(args.cadence as HabitCadence);
    assertValidHabitWindow({
      startDayKey: args.startDayKey,
      endDayKey: args.endDayKey,
    });
    assertValidFrequencyConfig({
      frequencyType: args.frequencyType,
      frequencyConfig: args.frequencyConfig,
    });
    const kind = args.kind ?? "build";
    let targetType = args.targetType;
    let targetValue = args.targetValue;
    let targetUnit = args.targetUnit;
    let breakGoal = args.breakGoal;
    let breakMetric = args.breakMetric;

    if (kind === "break") {
      breakGoal = inferBreakGoal({ kind, breakGoal, targetValue });
      if (!breakGoal) {
        throw new ConvexError("breakGoal is required for break habits");
      }

      if (breakGoal === "quit") {
        targetType = "quantity";
        targetValue = 0;
        targetUnit = "times";
        breakMetric = "times";
      } else {
        assertValidHabitTarget({
          targetValue,
          targetUnit,
        });
        breakMetric = inferBreakMetric({ breakMetric, targetType, targetUnit });
        if (!breakMetric) {
          throw new ConvexError("breakMetric is required for break limit habits");
        }
        if (typeof targetValue !== "number" || targetValue < 1) {
          throw new ConvexError("Break limit value must be at least 1");
        }
        targetType = breakMetric === "minutes" ? "duration" : "quantity";
        targetUnit = breakMetric === "minutes" ? "minutes" : "times";
      }
    } else {
      assertValidHabitTarget({
        targetValue,
        targetUnit,
      });
      if ((targetType === "quantity" || targetType === "duration") && targetValue === undefined) {
        throw new ConvexError("targetValue is required for quantity and duration habits");
      }
      if (targetType === "duration" && targetUnit && targetUnit !== "minutes") {
        throw new ConvexError("Duration habits must use minutes in V1");
      }
    }
    const activeHabits = (await ctx.db.query("habits").collect()).filter((habit) => !habit.archivedAt);
    if (activeHabits.length >= 15) {
      throw new ConvexError("V1 limit reached: maximum 15 active habits");
    }
    const desiredEnergy = args.energyLevel ?? "low";
    const highEnergyCount = activeHabits.filter(
      (habit) => (habit.energyLevel ?? habit.difficulty ?? "low") === "high",
    ).length;
    if (desiredEnergy === "high" && highEnergyCount >= 3) {
      throw new ConvexError("V1 limit reached: maximum 3 high-energy habits");
    }

    const now = Date.now();
    const habitId = await ctx.db.insert("habits", {
      name,
      cadence: args.cadence,
      anchor: args.anchor,
      difficulty: args.difficulty,
      kind,
      breakGoal,
      breakMetric,
      targetValue,
      targetUnit,
      targetType,
      frequencyType: args.frequencyType,
      frequencyConfig: args.frequencyConfig,
      identityTags: args.identityTags ?? [],
      energyLevel: args.energyLevel ?? "low",
      timePreference: args.timePreference ?? "flexible",
      timezone: args.timezone,
      startDayKey: args.startDayKey,
      endDayKey: args.endDayKey,
      createdAt: now,
      updatedAt: now,
    });

    const habitIdString = habitId as unknown as string;
    await appendHabitEvent(ctx, {
      type: "habit.created",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        habitId: habitIdString,
        name,
        cadence: args.cadence,
        anchor: args.anchor,
        difficulty: args.difficulty,
        kind,
        targetValue,
        targetUnit,
        timezone: args.timezone,
        startDayKey: args.startDayKey,
        endDayKey: args.endDayKey,
      },
      meta: {},
    });

    await syncHabitProjection(ctx, habitId);
    await ctx.db.patch(habitId, {
      targetType,
      breakGoal,
      breakMetric,
      frequencyType: args.frequencyType,
      frequencyConfig: args.frequencyConfig,
      identityTags: args.identityTags ?? [],
      energyLevel: args.energyLevel ?? "low",
      timePreference: args.timePreference ?? "flexible",
    });

    return {
      habitId: habitIdString,
      deduplicated: false,
    };
  },
});
