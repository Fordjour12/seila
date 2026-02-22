import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";

export const importTransaction = mutation({
  args: {
    idempotencyKey: v.string(),
    amount: v.number(),
    merchantHint: v.optional(v.string()),
    note: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
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

    if (!Number.isInteger(args.amount) || args.amount <= 0) {
      throw new ConvexError("amount must be a positive integer in cents");
    }

    const now = Date.now();
    const transactionId = await ctx.db.insert("transactions", {
      amount: args.amount,
      source: "imported",
      merchantHint: args.merchantHint,
      note: args.note,
      tags: args.tags,
      occurredAt: now,
      pendingImport: true,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("events", {
      type: "finance.transactionImported",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        transactionId,
        amount: args.amount,
        ...(args.merchantHint ? { merchantHint: args.merchantHint } : {}),
        ...(args.note ? { note: args.note } : {}),
      },
    });

    return {
      transactionId,
      deduplicated: false,
    };
  },
});
