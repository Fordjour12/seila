import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";

function normalizeMerchant(value: string) {
  return value.trim().toLowerCase();
}

export const setMerchantEnvelopeHint = mutation({
  args: {
    idempotencyKey: v.string(),
    merchantHint: v.string(),
    envelopeId: v.id("envelopes"),
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

    const merchantKey = normalizeMerchant(args.merchantHint);
    if (!merchantKey) {
      throw new ConvexError("merchantHint is required");
    }

    const envelope = await ctx.db.get(args.envelopeId);
    if (!envelope) {
      throw new ConvexError("Envelope not found");
    }

    const now = Date.now();
    await ctx.db.insert("events", {
      type: "finance.merchantEnvelopeHintSet",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        merchantKey,
        envelopeId: args.envelopeId,
        source: "manual_set_merchant_hint",
      },
    });

    return {
      merchantKey,
      envelopeId: args.envelopeId,
      deduplicated: false,
    };
  },
});
