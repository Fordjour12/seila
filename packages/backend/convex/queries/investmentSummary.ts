import { query } from "../_generated/server";

export const investmentSummary = query({
  args: {},
  handler: async (ctx) => {
    const investments = await ctx.db.query("investments").collect();
    const totalValue = investments.reduce((sum, item) => sum + item.currentValue, 0);
    const totalCostBasis = investments.reduce((sum, item) => sum + item.costBasis, 0);

    return {
      totalValue,
      totalCostBasis,
      unrealizedPnl: totalValue - totalCostBasis,
      items: investments.map((item) => ({
        investmentId: item._id,
        name: item.name,
        type: item.type,
        currentValue: item.currentValue,
        costBasis: item.costBasis,
      })),
    };
  },
});
