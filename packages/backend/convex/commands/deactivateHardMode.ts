import { v } from "convex/values";

import { mutation } from "../_generated/server";

export const deactivateHardMode = mutation({
  args: {
    idempotencyKey: v.string(),
    sessionId: v.id("hardModeSessions"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (existing) {
      return { deactivated: true, deduplicated: true };
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return { deactivated: false, deduplicated: false };
    }

    const now = Date.now();

    await ctx.db.patch(args.sessionId, {
      isActive: false,
      deactivatedAt: now,
    });

    await ctx.db.insert("events", {
      type: "hardMode.deactivated",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        sessionId: args.sessionId,
      },
    });

    return { deactivated: true, deduplicated: false };
  },
});
