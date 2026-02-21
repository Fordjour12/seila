import { ConvexError, v } from "convex/values";

import { mutation } from "../_generated/server";

export const setTransactionTags = mutation({
  args: {
    idempotencyKey: v.string(),
    transactionId: v.id("transactions"),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const dedupe = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (dedupe) return { deduplicated: true };

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) throw new ConvexError("Transaction not found");

    const tags = Array.from(new Set(args.tags.map((tag) => tag.trim()).filter(Boolean))).slice(0, 20);

    await ctx.db.patch(args.transactionId, {
      tags,
      updatedAt: Date.now(),
    });

    return { transactionId: args.transactionId, tags, deduplicated: false };
  },
});

