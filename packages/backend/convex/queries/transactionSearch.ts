import { v } from "convex/values";

import { query } from "../_generated/server";

function normalizeText(value?: string) {
  return (value || "").trim().toLowerCase();
}

export const transactionSearch = query({
  args: {
    q: v.optional(v.string()),
    envelopeId: v.optional(v.id("envelopes")),
    minAmount: v.optional(v.number()),
    maxAmount: v.optional(v.number()),
    includeVoided: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 100, 1), 250);
    const queryText = normalizeText(args.q);
    const includeVoided = args.includeVoided ?? false;

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_occurred_at")
      .order("desc")
      .take(limit * 3);

    return transactions
      .filter((transaction) => {
        if (!includeVoided && transaction.voidedAt) return false;
        if (transaction.pendingImport) return false;
        if (args.envelopeId && transaction.envelopeId !== args.envelopeId) return false;
        if (args.minAmount !== undefined && transaction.amount < args.minAmount) return false;
        if (args.maxAmount !== undefined && transaction.amount > args.maxAmount) return false;
        if (!queryText) return true;

        const haystack = normalizeText(
          `${transaction.merchantHint || ""} ${transaction.note || ""}`,
        );
        return haystack.includes(queryText);
      })
      .slice(0, limit);
  },
});
