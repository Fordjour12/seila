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

export const updateHabit = mutation({
  args: {
    idempotencyKey: v.string(),
    habitId: v.id("habits"),
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
      return {
        habitId: args.habitId,
        deduplicated: true,
      };
    }

    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.archivedAt) {
      throw new ConvexError("Habit not found or archived");
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
    const kind = args.kind ?? habit.kind ?? "build";
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
    const desiredEnergy = args.energyLevel ?? "low";
    const activeHabits = (await ctx.db.query("habits").collect()).filter((item) => !item.archivedAt);
    const currentEnergy = habit.energyLevel ?? habit.difficulty ?? "low";
    const highEnergyCount = activeHabits.filter(
      (item) => (item.energyLevel ?? item.difficulty ?? "low") === "high",
    ).length;
    if (desiredEnergy === "high" && currentEnergy !== "high" && highEnergyCount >= 3) {
      throw new ConvexError("V1 limit reached: maximum 3 high-energy habits");
    }

    await appendHabitEvent(ctx, {
      type: "habit.updated",
      occurredAt: Date.now(),
      idempotencyKey: args.idempotencyKey,
      payload: {
        habitId: args.habitId as unknown as string,
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

    await syncHabitProjection(ctx, args.habitId);
    await ctx.db.patch(args.habitId, {
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
      habitId: args.habitId,
      deduplicated: false,
    };
  },
});
