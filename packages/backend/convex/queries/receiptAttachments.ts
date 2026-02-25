import { v } from "convex/values";

import { query } from "../_generated/server";

export const receiptsByTransaction = query({
  args: {
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    const receipts = await ctx.db
      .query("receiptAttachments")
      .withIndex("by_transaction", (q) => q.eq("transactionId", args.transactionId))
      .collect();

    return receipts
      .map((receipt) => ({
        receiptId: receipt._id,
        storageId: receipt.storageId,
        fileName: receipt.fileName,
        mimeType: receipt.mimeType,
        createdAt: receipt.createdAt,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});
