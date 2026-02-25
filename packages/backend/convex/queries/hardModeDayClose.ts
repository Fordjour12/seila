import { v } from "convex/values";

import { internalQuery } from "../_generated/server";

function startOfUtcDay(timestamp: number) {
  const date = new Date(timestamp);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

export const dayCloseInput = internalQuery({
  args: {
    now: v.number(),
    sessionId: v.optional(v.id("hardModeSessions")),
  },
  handler: async (ctx, args) => {
    const dayStart = startOfUtcDay(args.now);
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    const session = args.sessionId
      ? await ctx.db.get(args.sessionId)
      : await ctx.db
          .query("hardModeSessions")
          .withIndex("by_active", (q) => q.eq("isActive", true))
          .order("desc")
          .first();

    const events = await ctx.db.query("events").collect();
    const todayEvents = events.filter(
      (event) => event.occurredAt >= dayStart && event.occurredAt < dayEnd,
    );

    return {
      dayStart,
      dayEnd,
      session: session
        ? {
            _id: session._id,
            plan: session.plan,
            isActive: session.isActive,
          }
        : null,
      todayEvents,
    };
  },
});
