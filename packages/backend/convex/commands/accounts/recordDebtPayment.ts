import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";

export const recordDebtPayment = mutation({
  args: {
    debtId: v.id("debts"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    if (!Number.isInteger(args.amount) || args.amount <= 0) {
      throw new ConvexError("amount must be a positive integer in cents");
    }

    const debt = await ctx.db.get(args.debtId);
    if (!debt) {
      throw new ConvexError("Debt not found");
    }

    if (!debt.isActive) {
      throw new ConvexError("Debt is already archived");
    }

    const nextBalance = Math.max(0, debt.balance - args.amount);
    const archived = nextBalance === 0;

    await ctx.db.patch(args.debtId, {
      balance: nextBalance,
      isActive: archived ? false : debt.isActive,
      updatedAt: Date.now(),
    });

    return {
      debtId: args.debtId,
      balance: nextBalance,
      archived,
    };
  },
});
