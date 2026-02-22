import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";

export const updateRecurringTransaction = mutation({
  args: {
    idempotencyKey: v.string(),
    recurringId: v.string(),
    amount: v.optional(v.number()),
    cadence: v.optional(v.union(v.literal("weekly"), v.literal("biweekly"), v.literal("monthly"))),
    nextDueAt: v.optional(v.number()),
    envelopeId: v.optional(v.id("envelopes")),
    clearEnvelope: v.optional(v.boolean()),
    merchantHint: v.optional(v.string()),
    note: v.optional(v.string()),
    kind: v.optional(v.union(v.literal("regular"), v.literal("subscription"))),
    category: v.optional(v.string()),
    clearCategory: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const dedupe = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (dedupe) {
      return { deduplicated: true };
    }

    if (!args.recurringId.trim()) {
      throw new ConvexError("recurringId is required");
    }

    if (args.amount !== undefined && (!Number.isInteger(args.amount) || args.amount <= 0)) {
      throw new ConvexError("amount must be a positive integer in cents");
    }

    if (
      args.nextDueAt !== undefined &&
      (!Number.isInteger(args.nextDueAt) || args.nextDueAt <= 0)
    ) {
      throw new ConvexError("nextDueAt must be a valid timestamp");
    }

    if (args.envelopeId) {
      const envelope = await ctx.db.get(args.envelopeId);
      if (!envelope) {
        throw new ConvexError("Envelope not found");
      }
    }

    const now = Date.now();
    await ctx.db.insert("events", {
      type: "finance.recurringTransactionUpdated",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        recurringId: args.recurringId,
        ...(args.amount ? { amount: args.amount } : {}),
        ...(args.cadence ? { cadence: args.cadence } : {}),
        ...(args.nextDueAt ? { nextDueAt: args.nextDueAt } : {}),
        ...(args.clearEnvelope ? { envelopeCleared: true } : {}),
        ...(args.envelopeId ? { envelopeId: args.envelopeId } : {}),
        ...(args.merchantHint ? { merchantHint: args.merchantHint } : {}),
        ...(args.note ? { note: args.note } : {}),
        ...(args.kind ? { kind: args.kind } : {}),
        ...(args.category !== undefined ? { category: args.category.trim() } : {}),
        ...(args.clearCategory ? { categoryCleared: true } : {}),
      },
    });

    return {
      recurringId: args.recurringId,
      deduplicated: false,
    };
  },
});
