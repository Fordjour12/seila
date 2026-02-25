import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";
import { getDedupedEventByIdempotencyKey } from "../../habits/shared";

export const resumePausedHabit = mutation({
  args: {
    idempotencyKey: v.string(),
    habitId: v.id("habits"),
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

    await ctx.db.patch(args.habitId, {
      pausedUntilDayKey: undefined,
      stalePromptSnoozedUntil: undefined,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("events", {
      type: "habit.resumed",
      occurredAt: Date.now(),
      idempotencyKey: args.idempotencyKey,
      payload: { habitId: args.habitId as unknown as string },
    });

    return { habitId: args.habitId, deduplicated: false };
  },
});
