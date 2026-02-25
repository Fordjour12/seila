import { v } from "convex/values";

import { query } from "../_generated/server";

export const debtStrategy = query({
  args: {
    strategy: v.optional(v.union(v.literal("snowball"), v.literal("avalanche"))),
  },
  handler: async (ctx, args) => {
    const strategy = args.strategy ?? "avalanche";
    const debts = await ctx.db
      .query("debts")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const ordered = [...debts].sort((a, b) => {
      if (strategy === "snowball") return a.balance - b.balance;
      return b.aprBps - a.aprBps;
    });

    return {
      strategy,
      totalBalance: debts.reduce((sum, debt) => sum + debt.balance, 0),
      totalMinPayment: debts.reduce((sum, debt) => sum + debt.minPayment, 0),
      nextFocus: ordered[0]
        ? {
            debtId: ordered[0]._id,
            name: ordered[0].name,
            balance: ordered[0].balance,
            aprBps: ordered[0].aprBps,
          }
        : null,
      debts: ordered.map((debt) => ({
        debtId: debt._id,
        name: debt.name,
        balance: debt.balance,
        aprBps: debt.aprBps,
        minPayment: debt.minPayment,
      })),
    };
  },
});
