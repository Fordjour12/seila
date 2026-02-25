import { v } from "convex/values";

import { mutation } from "../../_generated/server";

export const crisisOverrideHardMode = mutation({
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
      return { cleared: true, deduplicated: true };
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.plan) {
      return { cleared: false, deduplicated: false };
    }

    const now = Date.now();
    await ctx.db.patch(args.sessionId, {
      plan: {
        ...session.plan,
        items: session.plan.items.map((item) => ({
          ...item,
          status: "dropped" as const,
          flaggedAt: now,
        })),
      },
    });

    await ctx.db.insert("events", {
      type: "hardMode.crisisOverride",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        sessionId: args.sessionId,
      },
    });

    return { cleared: true, deduplicated: false };
  },
});
