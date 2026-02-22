import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";

export const setSubscription = mutation({
  args: {
    idempotencyKey: v.string(),
    subscriptionId: v.optional(v.id("subscriptions")),
    name: v.string(),
    amount: v.number(),
    cadence: v.union(v.literal("monthly"), v.literal("yearly")),
    nextDueAt: v.number(),
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const dedupe = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (dedupe) return { deduplicated: true };

    if (!args.name.trim()) throw new ConvexError("name is required");
    if (!Number.isInteger(args.amount) || args.amount <= 0) throw new ConvexError("amount invalid");
    if (!Number.isInteger(args.nextDueAt) || args.nextDueAt <= 0)
      throw new ConvexError("nextDueAt invalid");

    const now = Date.now();
    if (args.subscriptionId) {
      const existing = await ctx.db.get(args.subscriptionId);
      if (!existing) throw new ConvexError("Subscription not found");
      await ctx.db.patch(args.subscriptionId, {
        name: args.name.trim(),
        amount: args.amount,
        cadence: args.cadence,
        nextDueAt: args.nextDueAt,
        category: args.category,
        isActive: args.isActive ?? existing.isActive,
        updatedAt: now,
      });
      return { subscriptionId: args.subscriptionId, deduplicated: false };
    }

    const subscriptionId = await ctx.db.insert("subscriptions", {
      name: args.name.trim(),
      amount: args.amount,
      cadence: args.cadence,
      nextDueAt: args.nextDueAt,
      category: args.category,
      isActive: args.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
    return { subscriptionId, deduplicated: false };
  },
});
