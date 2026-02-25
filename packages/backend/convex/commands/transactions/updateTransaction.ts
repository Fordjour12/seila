import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";

export const updateTransaction = mutation({
  args: {
    idempotencyKey: v.string(),
    transactionId: v.id("transactions"),
    amount: v.optional(v.number()),
    envelopeId: v.optional(v.id("envelopes")),
    clearEnvelope: v.optional(v.boolean()),
    merchantHint: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const dedupe = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (dedupe) {
      return { deduplicated: true };
    }

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new ConvexError("Transaction not found");
    }

    if (transaction.voidedAt) {
      throw new ConvexError("Cannot edit a voided transaction");
    }

    if (args.amount !== undefined && (!Number.isInteger(args.amount) || args.amount <= 0)) {
      throw new ConvexError("amount must be a positive integer in cents");
    }

    if (args.envelopeId) {
      const envelope = await ctx.db.get(args.envelopeId);
      if (!envelope) {
        throw new ConvexError("Envelope not found");
      }
    }

    const now = Date.now();
    await ctx.db.patch(args.transactionId, {
      ...(args.amount !== undefined ? { amount: args.amount } : {}),
      ...(args.clearEnvelope ? { envelopeId: undefined } : {}),
      ...(args.envelopeId ? { envelopeId: args.envelopeId } : {}),
      ...(args.merchantHint !== undefined ? { merchantHint: args.merchantHint.trim() || undefined } : {}),
      ...(args.note !== undefined ? { note: args.note.trim() || undefined } : {}),
      updatedAt: now,
    });

    await ctx.db.insert("events", {
      type: "finance.transactionUpdated",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        transactionId: args.transactionId,
        ...(args.amount !== undefined ? { amount: args.amount } : {}),
        ...(args.clearEnvelope ? { envelopeCleared: true } : {}),
        ...(args.envelopeId ? { envelopeId: args.envelopeId } : {}),
      },
    });

    return { transactionId: args.transactionId, deduplicated: false };
  },
});
