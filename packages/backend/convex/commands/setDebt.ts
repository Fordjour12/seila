import { ConvexError, v } from "convex/values";

import { mutation } from "../_generated/server";

export const setDebt = mutation({
  args: {
    idempotencyKey: v.string(),
    debtId: v.optional(v.id("debts")),
    name: v.string(),
    balance: v.number(),
    aprBps: v.number(),
    minPayment: v.number(),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const dedupe = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (dedupe) return { deduplicated: true };

    if (!args.name.trim()) throw new ConvexError("name is required");
    if (!Number.isInteger(args.balance) || args.balance < 0)
      throw new ConvexError("balance invalid");
    if (!Number.isInteger(args.aprBps) || args.aprBps < 0) throw new ConvexError("aprBps invalid");
    if (!Number.isInteger(args.minPayment) || args.minPayment < 0)
      throw new ConvexError("minPayment invalid");

    const now = Date.now();
    if (args.debtId) {
      const existing = await ctx.db.get(args.debtId);
      if (!existing) throw new ConvexError("Debt not found");
      await ctx.db.patch(args.debtId, {
        name: args.name.trim(),
        balance: args.balance,
        aprBps: args.aprBps,
        minPayment: args.minPayment,
        isActive: args.isActive ?? existing.isActive,
        updatedAt: now,
      });
      return { debtId: args.debtId, deduplicated: false };
    }

    const debtId = await ctx.db.insert("debts", {
      name: args.name.trim(),
      balance: args.balance,
      aprBps: args.aprBps,
      minPayment: args.minPayment,
      isActive: args.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });

    return { debtId, deduplicated: false };
  },
});
