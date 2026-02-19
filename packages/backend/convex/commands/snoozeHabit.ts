import { ConvexError, v } from "convex/values";

import { mutation } from "../_generated/server";
import {
  appendHabitEvent,
  getDedupedEventByIdempotencyKey,
  syncHabitProjection,
} from "../habits/shared";

export const snoozeHabit = mutation({
  args: {
    idempotencyKey: v.string(),
    habitId: v.id("habits"),
    snoozedUntil: v.number(),
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

    if (args.snoozedUntil <= Date.now()) {
      throw new ConvexError("snoozedUntil must be in the future");
    }

    await appendHabitEvent(ctx, {
      type: "habit.snoozed",
      occurredAt: Date.now(),
      idempotencyKey: args.idempotencyKey,
      payload: {
        habitId: args.habitId as unknown as string,
        snoozedUntil: args.snoozedUntil,
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
