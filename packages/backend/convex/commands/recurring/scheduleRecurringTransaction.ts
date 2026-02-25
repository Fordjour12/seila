import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";

export const scheduleRecurringTransaction = mutation({
  args: {
    idempotencyKey: v.string(),
    amount: v.number(),
    cadence: v.union(v.literal("weekly"), v.literal("biweekly"), v.literal("monthly")),
    nextDueAt: v.number(),
    envelopeId: v.optional(v.id("envelopes")),
    merchantHint: v.optional(v.string()),
    note: v.optional(v.string()),
    kind: v.optional(v.union(v.literal("regular"), v.literal("subscription"))),
    category: v.optional(v.string()),
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

    if (!Number.isInteger(args.nextDueAt) || args.nextDueAt <= 0) {
      throw new ConvexError("nextDueAt must be a valid timestamp");
    }

    if (args.envelopeId) {
      const envelope = await ctx.db.get(args.envelopeId);
      if (!envelope) {
        throw new ConvexError("Envelope not found");
      }
    }

    const now = Date.now();
    const recurringId = `${args.cadence}:${args.nextDueAt}:${now}:${Math.random().toString(36).slice(2, 10)}`;
    await ctx.db.insert("events", {
      type: "finance.recurringTransactionScheduled",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        recurringId,
        amount: args.amount,
        cadence: args.cadence,
        nextDueAt: args.nextDueAt,
        kind: args.kind ?? "regular",
        ...(args.envelopeId ? { envelopeId: args.envelopeId } : {}),
        ...(args.merchantHint ? { merchantHint: args.merchantHint } : {}),
        ...(args.note ? { note: args.note } : {}),
        ...(args.category ? { category: args.category.trim() } : {}),
      },
    });

    return {
      recurringId,
      deduplicated: false,
    };
  },
});
