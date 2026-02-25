import { query } from "../_generated/server";

const ESTIMATED_EFFECTIVE_TAX_BPS = 1800;

export const taxEstimate = query({
  args: {},
  handler: async (ctx) => {
    const incomes = await ctx.db.query("incomes").collect();
    const now = new Date();
    const yearStart = Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0);

    const ytdIncome = incomes
      .filter((income) => income.occurredAt >= yearStart)
      .reduce((sum, income) => sum + income.amount, 0);

    const estimatedTax = Math.round((ytdIncome * ESTIMATED_EFFECTIVE_TAX_BPS) / 10000);
    return {
      ytdIncome,
      estimatedTax,
      effectiveRateBps: ESTIMATED_EFFECTIVE_TAX_BPS,
    };
  },
});
