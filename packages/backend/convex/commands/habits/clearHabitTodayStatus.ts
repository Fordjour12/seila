import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";
import {
  clearHabitLog,
  dayKeyValidator,
  getDedupedEventByIdempotencyKey,
} from "../../habits/shared";

export const clearHabitTodayStatus = mutation({
  args: {
    idempotencyKey: v.string(),
    habitId: v.id("habits"),
    dayKey: dayKeyValidator,
  },
  handler: async (ctx, args) => {
    const existing = await getDedupedEventByIdempotencyKey(ctx, args.idempotencyKey);
    if (existing) {
      return {
        habitId: args.habitId,
        cleared: true,
        deduplicated: true,
      };
    }

    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.archivedAt) {
      throw new ConvexError("Habit not found or archived");
    }

    const cleared = await clearHabitLog(ctx, {
      habitId: args.habitId,
      dayKey: args.dayKey,
    });

    await ctx.db.insert("events", {
      type: "habit.today_cleared",
      occurredAt: Date.now(),
      idempotencyKey: args.idempotencyKey,
      payload: {
        habitId: args.habitId as unknown as string,
        dayKey: args.dayKey,
      },
    });

    return {
      habitId: args.habitId,
      cleared,
      deduplicated: false,
    };
  },
});
