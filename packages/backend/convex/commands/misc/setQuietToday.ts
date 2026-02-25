import { v } from "convex/values";

import { mutation } from "../../_generated/server";

function startOfLocalDay(now: number) {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export const setQuietToday = mutation({
  args: {
    idempotencyKey: v.string(),
    isQuiet: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingEvent = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (existingEvent) {
      return { updated: true, deduplicated: true };
    }

    const now = Date.now();
    const dayStart = startOfLocalDay(now);

    const existing = await ctx.db
      .query("quietDays")
      .withIndex("by_day_start", (q) => q.eq("dayStart", dayStart))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isQuiet: args.isQuiet,
        setAt: now,
        reason: args.reason,
      });
    } else {
      await ctx.db.insert("quietDays", {
        dayStart,
        isQuiet: args.isQuiet,
        setAt: now,
        reason: args.reason,
      });
    }

    await ctx.db.insert("events", {
      type: "system.restDaySet",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        dayStart,
        isQuiet: args.isQuiet,
      },
    });

    return { updated: true, deduplicated: false, isQuiet: args.isQuiet };
  },
});
