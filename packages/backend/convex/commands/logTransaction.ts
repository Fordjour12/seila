import { ConvexError, v } from "convex/values";

import { mutation } from "../_generated/server";

export const logTransaction = mutation({
  args: {
    idempotencyKey: v.string(),
    amount: v.number(),
    envelopeId: v.optional(v.id("envelopes")),
    source: v.union(v.literal("manual"), v.literal("imported")),
    merchantHint: v.optional(v.string()),
    note: v.optional(v.string()),
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

    if (args.envelopeId) {
      const envelope = await ctx.db.get(args.envelopeId);
      if (!envelope) {
        throw new ConvexError("Envelope not found");
      }
    }

    const now = Date.now();
    const transactionId = await ctx.db.insert("transactions", {
      amount: args.amount,
      envelopeId: args.envelopeId,
      source: args.source,
      merchantHint: args.merchantHint,
      note: args.note,
      occurredAt: now,
      pendingImport: false,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("events", {
      type: "finance.transactionLogged",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        transactionId,
        amount: args.amount,
        source: args.source,
        ...(args.envelopeId ? { envelopeId: args.envelopeId } : {}),
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
