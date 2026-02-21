import { ConvexError, v } from "convex/values";

import { mutation } from "../_generated/server";

export const setFxRate = mutation({
  args: {
    idempotencyKey: v.string(),
    baseCurrency: v.string(),
    quoteCurrency: v.string(),
    rateScaled: v.number(),
    asOf: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const dedupe = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (dedupe) return { deduplicated: true };

    if (!Number.isInteger(args.rateScaled) || args.rateScaled <= 0) {
      throw new ConvexError("rateScaled must be a positive integer");
    }

    const recordId = await ctx.db.insert("fxRates", {
      baseCurrency: args.baseCurrency.toUpperCase(),
      quoteCurrency: args.quoteCurrency.toUpperCase(),
      rateScaled: args.rateScaled,
      asOf: args.asOf ?? Date.now(),
      createdAt: Date.now(),
    });

    return { recordId, deduplicated: false };
  },
});

