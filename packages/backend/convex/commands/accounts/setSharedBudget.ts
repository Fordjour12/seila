import { ConvexError, v } from "convex/values";

import { internalMutation, mutation } from "../../_generated/server";

export const setSharedBudget = mutation({
  args: {
    idempotencyKey: v.string(),
    sharedBudgetId: v.optional(v.id("sharedBudgets")),
    name: v.string(),
    budgetAmount: v.number(),
    spentAmount: v.optional(v.number()),
    members: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const dedupe = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (dedupe) return { deduplicated: true };

    if (!args.name.trim()) throw new ConvexError("name is required");
    if (!Number.isInteger(args.budgetAmount) || args.budgetAmount <= 0)
      throw new ConvexError("budgetAmount invalid");
    if (
      args.spentAmount !== undefined &&
      (!Number.isInteger(args.spentAmount) || args.spentAmount < 0)
    ) {
      throw new ConvexError("spentAmount invalid");
    }

    const now = Date.now();
    if (args.sharedBudgetId) {
      const existing = await ctx.db.get(args.sharedBudgetId);
      if (!existing) throw new ConvexError("Shared budget not found");
      await ctx.db.patch(args.sharedBudgetId, {
        name: args.name.trim(),
        budgetAmount: args.budgetAmount,
        spentAmount: args.spentAmount ?? existing.spentAmount,
        members: args.members,
        updatedAt: now,
      });
      return { sharedBudgetId: args.sharedBudgetId, deduplicated: false };
    }

    const sharedBudgetId = await ctx.db.insert("sharedBudgets", {
      name: args.name.trim(),
      budgetAmount: args.budgetAmount,
      spentAmount: args.spentAmount ?? 0,
      members: args.members,
      createdAt: now,
      updatedAt: now,
    });
    return { sharedBudgetId, deduplicated: false };
  },
});

export const deleteSharedBudget = mutation({
  args: {
    sharedBudgetId: v.id("sharedBudgets"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.sharedBudgetId);
    if (!existing) {
      throw new ConvexError("Shared budget not found");
    }

    await ctx.db.delete(args.sharedBudgetId);

    await ctx.db.insert("events", {
      type: "finance.sharedBudgetDeleted",
      occurredAt: Date.now(),
      idempotencyKey: `delete-shared-budget:${args.sharedBudgetId}:${Date.now()}`,
      payload: {
        sharedBudgetId: args.sharedBudgetId,
        name: existing.name,
      },
    });

    return { deleted: true };
  },
});
