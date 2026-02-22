import { ConvexError, v } from "convex/values";

import { query } from "../_generated/server";

export const transactionById = query({
  args: {
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new ConvexError("Transaction not found");
    }

    return transaction;
  },
});
