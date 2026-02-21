import { v } from "convex/values";

import { query } from "../_generated/server";

export const transactionInbox = query({
  args: {
    pendingOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 100, 1), 200);
    const pendingOnly = args.pendingOnly ?? false;

    if (pendingOnly) {
      const transactions = await ctx.db
        .query("transactions")
        .withIndex("by_pending_import", (q) => q.eq("pendingImport", true))
        .collect();

      return transactions
        .filter((transaction) => !transaction.voidedAt)
        .sort((a, b) => b.occurredAt - a.occurredAt)
        .slice(0, limit);
    }

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_occurred_at")
      .order("desc")
      .take(limit * 2);

    return transactions
      .filter((transaction) => !transaction.voidedAt && !transaction.pendingImport)
      .slice(0, limit);
  },
});
