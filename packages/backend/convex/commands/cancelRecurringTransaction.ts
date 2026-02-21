import { ConvexError, v } from "convex/values";

import { mutation } from "../_generated/server";

export const cancelRecurringTransaction = mutation({
  args: {
    idempotencyKey: v.string(),
    recurringId: v.string(),
  },
  handler: async (ctx, args) => {
    const dedupe = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (dedupe) {
      return { deduplicated: true };
    }

    if (!args.recurringId.trim()) {
      throw new ConvexError("recurringId is required");
    }

    const now = Date.now();
    await ctx.db.insert("events", {
      type: "finance.recurringTransactionCanceled",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: { recurringId: args.recurringId },
    });

    return {
      recurringId: args.recurringId,
      deduplicated: false,
    };
  },
});
