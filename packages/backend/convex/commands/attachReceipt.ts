import { ConvexError, v } from "convex/values";

import { mutation } from "../_generated/server";

export const attachReceipt = mutation({
  args: {
    idempotencyKey: v.string(),
    transactionId: v.id("transactions"),
    storageId: v.string(),
    fileName: v.optional(v.string()),
    mimeType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const dedupe = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (dedupe) return { deduplicated: true };

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) throw new ConvexError("Transaction not found");
    if (!args.storageId.trim()) throw new ConvexError("storageId is required");

    const receiptId = await ctx.db.insert("receiptAttachments", {
      transactionId: args.transactionId,
      storageId: args.storageId.trim(),
      fileName: args.fileName,
      mimeType: args.mimeType,
      createdAt: Date.now(),
    });

    return { receiptId, deduplicated: false };
  },
});
