import { v } from "convex/values";

import { mutation } from "../../_generated/server";

const DAY_MS = 24 * 60 * 60 * 1000;

export const startLowSpendReset = mutation({
  args: {
    idempotencyKey: v.string(),
    durationDays: v.optional(v.number()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const dedupe = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (dedupe) return { deduplicated: true };

    const now = Date.now();
    const durationDays = Math.min(Math.max(args.durationDays ?? 2, 1), 7);
    const resetId = await ctx.db.insert("lowSpendResets", {
      startedAt: now,
      endsAt: now + durationDays * DAY_MS,
      reason: args.reason,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("events", {
      type: "finance.lowSpendReset.started",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        resetId,
        durationDays,
        ...(args.reason ? { reason: args.reason } : {}),
      },
    });

    return { resetId, deduplicated: false };
  },
});
