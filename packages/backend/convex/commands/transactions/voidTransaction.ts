import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";

export const voidTransaction = mutation({
  args: {
    idempotencyKey: v.string(),
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    const dedupe = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (dedupe) {
      return {
        deduplicated: true,
      };
    }

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new ConvexError("Transaction not found");
    }

    if (transaction.voidedAt) {
      return {
        deduplicated: false,
      };
    }

    const now = Date.now();

    await ctx.db.patch(args.transactionId, {
      voidedAt: now,
      pendingImport: false,
      updatedAt: now,
    });

    await ctx.db.insert("events", {
      type: "finance.transactionVoided",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        transactionId: args.transactionId,
      },
    });

    return {
      transactionId: args.transactionId,
      deduplicated: false,
    };
  },
});
