import { ConvexError, v } from "convex/values";

import { mutation } from "../_generated/server";

export const logIncome = mutation({
  args: {
    idempotencyKey: v.string(),
    amount: v.number(),
    source: v.optional(v.string()),
    note: v.optional(v.string()),
    occurredAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const dedupe = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (dedupe) {
      return { deduplicated: true };
    }

    if (!Number.isInteger(args.amount) || args.amount <= 0) {
      throw new ConvexError("amount must be a positive integer in cents");
    }

    const now = Date.now();
    const occurredAt = args.occurredAt ?? now;
    const incomeId = await ctx.db.insert("incomes", {
      amount: args.amount,
      source: args.source,
      note: args.note,
      occurredAt,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("events", {
      type: "finance.income.logged",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        incomeId,
        amount: args.amount,
        ...(args.source ? { source: args.source } : {}),
      },
    });

    return { incomeId, deduplicated: false };
  },
});
