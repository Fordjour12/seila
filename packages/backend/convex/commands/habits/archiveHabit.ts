import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";
import {
  appendHabitEvent,
  getDedupedEventByIdempotencyKey,
  syncHabitProjection,
} from "../../habits/shared";

export const archiveHabit = mutation({
  args: {
    idempotencyKey: v.string(),
    habitId: v.id("habits"),
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
    if (!habit) {
      throw new ConvexError("Habit not found");
    }

    if (habit.archivedAt) {
      throw new ConvexError("Habit already archived");
    }

    await appendHabitEvent(ctx, {
      type: "habit.archived",
      occurredAt: Date.now(),
      idempotencyKey: args.idempotencyKey,
      payload: {
        habitId: args.habitId as unknown as string,
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
