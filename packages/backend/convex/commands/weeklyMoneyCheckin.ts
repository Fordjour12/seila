import { ConvexError, v } from "convex/values";

import { mutation } from "../_generated/server";

export const upsertWeeklyMoneyCheckin = mutation({
  args: {
    idempotencyKey: v.string(),
    weekStart: v.number(),
    wins: v.array(v.string()),
    overspendAreas: v.array(v.string()),
    correction: v.string(),
    focus: v.string(),
  },
  handler: async (ctx, args) => {
    const dedupe = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (dedupe) return { deduplicated: true };

    if (!args.correction.trim() || !args.focus.trim()) {
      throw new ConvexError("correction and focus are required");
    }

    const existing = await ctx.db
      .query("weeklyMoneyCheckins")
      .withIndex("by_week", (q) => q.eq("weekStart", args.weekStart))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        wins: args.wins,
        overspendAreas: args.overspendAreas,
        correction: args.correction.trim(),
        focus: args.focus.trim(),
        updatedAt: now,
      });
      return { checkinId: existing._id, deduplicated: false };
    }

    const checkinId = await ctx.db.insert("weeklyMoneyCheckins", {
      weekStart: args.weekStart,
      wins: args.wins,
      overspendAreas: args.overspendAreas,
      correction: args.correction.trim(),
      focus: args.focus.trim(),
      createdAt: now,
      updatedAt: now,
    });
    return { checkinId, deduplicated: false };
  },
});

