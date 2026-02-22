import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";

export const setSavingsGoal = mutation({
  args: {
    idempotencyKey: v.string(),
    goalId: v.optional(v.id("savingsGoals")),
    name: v.string(),
    targetAmount: v.number(),
    currentAmount: v.optional(v.number()),
    envelopeId: v.optional(v.id("envelopes")),
    deadlineAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const dedupe = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (dedupe) return { deduplicated: true };

    if (!args.name.trim()) throw new ConvexError("name is required");
    if (!Number.isInteger(args.targetAmount) || args.targetAmount <= 0) {
      throw new ConvexError("targetAmount must be a positive integer in cents");
    }

    const now = Date.now();
    if (args.goalId) {
      const existing = await ctx.db.get(args.goalId);
      if (!existing) throw new ConvexError("Goal not found");
      await ctx.db.patch(args.goalId, {
        name: args.name.trim(),
        targetAmount: args.targetAmount,
        currentAmount: args.currentAmount ?? existing.currentAmount,
        envelopeId: args.envelopeId,
        deadlineAt: args.deadlineAt,
        updatedAt: now,
      });
      return { goalId: args.goalId, deduplicated: false };
    }

    const goalId = await ctx.db.insert("savingsGoals", {
      name: args.name.trim(),
      targetAmount: args.targetAmount,
      currentAmount: args.currentAmount ?? 0,
      envelopeId: args.envelopeId,
      deadlineAt: args.deadlineAt,
      createdAt: now,
      updatedAt: now,
    });
    return { goalId, deduplicated: false };
  },
});

export const deleteSavingsGoal = mutation({
  args: {
    goalId: v.id("savingsGoals"),
  },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new ConvexError("Goal not found");

    await ctx.db.patch(args.goalId, {
      archivedAt: Date.now(),
    });

    return { success: true };
  },
});

export const contributeSavingsGoal = mutation({
  args: {
    idempotencyKey: v.string(),
    goalId: v.id("savingsGoals"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const dedupe = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (dedupe) return { deduplicated: true };

    if (!Number.isInteger(args.amount) || args.amount <= 0) {
      throw new ConvexError("amount must be a positive integer in cents");
    }

    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new ConvexError("Goal not found");

    await ctx.db.patch(args.goalId, {
      currentAmount: goal.currentAmount + args.amount,
      updatedAt: Date.now(),
    });

    return { goalId: args.goalId, deduplicated: false };
  },
});
