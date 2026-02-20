import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";

export const currentHardModePlan = query({
  args: {},
  handler: async (ctx) => {
    const session = await ctx.db
      .query("hardModeSessions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .first();

    if (!session || !session.plan) {
      return null;
    }

    return {
      sessionId: session._id,
      dayStart: session.plan.dayStart,
      generatedAt: session.plan.generatedAt,
      items: session.plan.items
        .slice()
        .sort((a, b) => a.scheduledAt - b.scheduledAt),
    };
  },
});

export const internalCurrentHardModePlan = internalQuery({
  args: {
    sessionId: v.id("hardModeSessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);

    if (!session || !session.plan) {
      return null;
    }

    return {
      sessionId: session._id,
      dayStart: session.plan.dayStart,
      generatedAt: session.plan.generatedAt,
      items: session.plan.items
        .slice()
        .sort((a, b) => a.scheduledAt - b.scheduledAt),
    };
  },
});

