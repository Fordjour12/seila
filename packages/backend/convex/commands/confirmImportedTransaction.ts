import { ConvexError, v } from "convex/values";

import { mutation } from "../_generated/server";

export const confirmImportedTransaction = mutation({
  args: {
    idempotencyKey: v.string(),
    transactionId: v.id("transactions"),
    envelopeId: v.optional(v.id("envelopes")),
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
      throw new ConvexError("Transaction has been voided");
    }

    if (args.envelopeId) {
      const envelope = await ctx.db.get(args.envelopeId);
      if (!envelope) {
        throw new ConvexError("Envelope not found");
      }
    }

    await ctx.db.patch(args.transactionId, {
      envelopeId: args.envelopeId,
      pendingImport: false,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("events", {
      type: "finance.transactionConfirmed",
      occurredAt: Date.now(),
      idempotencyKey: args.idempotencyKey,
      payload: {
        transactionId: args.transactionId,
        ...(args.envelopeId ? { envelopeId: args.envelopeId } : {}),
      },
    });

    return {
      transactionId: args.transactionId,
      deduplicated: false,
    };
  },
});
