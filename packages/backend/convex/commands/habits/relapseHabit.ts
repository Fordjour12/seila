import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";
import {
  dayKeyValidator,
  getDedupedEventByIdempotencyKey,
  isHabitActiveOnDay,
  upsertHabitLog,
} from "../../habits/shared";

export const relapseHabit = mutation({
  args: {
    idempotencyKey: v.string(),
    habitId: v.id("habits"),
    dayKey: dayKeyValidator,
  },
  handler: async (ctx, args) => {
    const existing = await getDedupedEventByIdempotencyKey(ctx, args.idempotencyKey);
    if (existing) {
      return { habitId: args.habitId, deduplicated: true };
    }

    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.archivedAt) {
      throw new ConvexError("Habit not found or archived");
    }
    if (habit.kind !== "break") {
      throw new ConvexError("Relapse can only be logged for break habits");
    }
    if (
      !isHabitActiveOnDay({
        dayKey: args.dayKey,
        startDayKey: habit.startDayKey,
        endDayKey: habit.endDayKey,
        pausedUntilDayKey: habit.pausedUntilDayKey,
      })
    ) {
      throw new ConvexError("Habit is outside its active date range");
    }

    const occurredAt = Date.now();
    await upsertHabitLog(ctx, {
      habitId: args.habitId,
      dayKey: args.dayKey,
      status: "relapsed",
      occurredAt,
    });

    await ctx.db.patch(args.habitId, {
      lastEngagedAt: occurredAt,
      stalePromptSnoozedUntil: undefined,
      updatedAt: occurredAt,
    });

    return {
      habitId: args.habitId,
      deduplicated: false,
    };
  },
});
