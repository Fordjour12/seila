import { query } from "../_generated/server";

export const transactionInbox = query({
  args: {},
  handler: async (ctx) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_pending_import", (q) => q.eq("pendingImport", true))
      .collect();

    return transactions
      .filter((transaction) => !transaction.voidedAt)
      .sort((a, b) => b.occurredAt - a.occurredAt);
  },
});
