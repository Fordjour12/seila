import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";
import {
  appendHabitEvent,
  getDedupedEventByIdempotencyKey,
  syncHabitProjection,
  upsertHabitLog,
  dayKeyValidator,
  isHabitActiveOnDay,
} from "../../habits/shared";

export const skipHabit = mutation({
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
        deduplicated: true,
      };
    }

    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.archivedAt) {
      throw new ConvexError("Habit not found or archived");
    }
    if (
      !isHabitActiveOnDay({
        dayKey: args.dayKey,
        startDayKey: habit.startDayKey,
        endDayKey: habit.endDayKey,
      })
    ) {
      throw new ConvexError("Habit is outside its active date range");
    }

    const occurredAt = Date.now();

    await appendHabitEvent(ctx, {
      type: "habit.skipped",
      occurredAt,
      idempotencyKey: args.idempotencyKey,
      payload: {
        habitId: args.habitId as unknown as string,
      },
      meta: {},
    });

    await upsertHabitLog(ctx, {
      habitId: args.habitId,
      dayKey: args.dayKey,
      status: "skipped",
      occurredAt,
    });

    await ctx.db.patch(args.habitId, {
      lastEngagedAt: occurredAt,
      stalePromptSnoozedUntil: undefined,
    });

    await syncHabitProjection(ctx, args.habitId);

    return {
      habitId: args.habitId,
      deduplicated: false,
    };
  },
});
