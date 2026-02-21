import { ConvexError, v } from "convex/values";

import { mutation } from "../_generated/server";

export const setInvestment = mutation({
  args: {
    idempotencyKey: v.string(),
    investmentId: v.optional(v.id("investments")),
    name: v.string(),
    type: v.union(v.literal("stock"), v.literal("fund"), v.literal("crypto"), v.literal("cash"), v.literal("other")),
    currentValue: v.number(),
    costBasis: v.number(),
  },
  handler: async (ctx, args) => {
    const dedupe = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (dedupe) return { deduplicated: true };

    if (!args.name.trim()) throw new ConvexError("name is required");
    if (!Number.isInteger(args.currentValue) || args.currentValue < 0) throw new ConvexError("currentValue invalid");
    if (!Number.isInteger(args.costBasis) || args.costBasis < 0) throw new ConvexError("costBasis invalid");

    const now = Date.now();
    if (args.investmentId) {
      const existing = await ctx.db.get(args.investmentId);
      if (!existing) throw new ConvexError("Investment not found");
      await ctx.db.patch(args.investmentId, {
        name: args.name.trim(),
        type: args.type,
        currentValue: args.currentValue,
        costBasis: args.costBasis,
        updatedAt: now,
      });
      return { investmentId: args.investmentId, deduplicated: false };
    }

    const investmentId = await ctx.db.insert("investments", {
      name: args.name.trim(),
      type: args.type,
      currentValue: args.currentValue,
      costBasis: args.costBasis,
      createdAt: now,
      updatedAt: now,
    });
    return { investmentId, deduplicated: false };
  },
});
