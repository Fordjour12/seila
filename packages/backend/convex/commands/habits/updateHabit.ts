import type { HabitCadence } from "@seila/domain-kernel";
import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";
import {
  anchorValidator,
  appendHabitEvent,
  assertValidCustomCadence,
  cadenceValidator,
  difficultyValidator,
  getDedupedEventByIdempotencyKey,
  kindValidator,
  dayKeyValidator,
  assertValidHabitWindow,
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
        kind: args.kind,
        startDayKey: args.startDayKey,
        endDayKey: args.endDayKey,
      },
      meta: {},
    });

    await syncHabitProjection(ctx, args.habitId);

    return {
      habitId: args.habitId,
      deduplicated: false,
    };
  },
});
