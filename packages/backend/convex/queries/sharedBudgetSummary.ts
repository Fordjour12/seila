import { query } from "../_generated/server";

export const sharedBudgetSummary = query({
  args: {},
  handler: async (ctx) => {
    const budgets = await ctx.db.query("sharedBudgets").collect();
    const totalBudget = budgets.reduce((sum, item) => sum + item.budgetAmount, 0);
    const totalSpent = budgets.reduce((sum, item) => sum + item.spentAmount, 0);

    return {
      totalBudget,
      totalSpent,
      utilization: totalBudget > 0 ? totalSpent / totalBudget : 0,
      items: budgets.map((item) => ({
        sharedBudgetId: item._id,
        name: item.name,
        budgetAmount: item.budgetAmount,
        spentAmount: item.spentAmount,
        members: item.members,
      })),
    };
  },
});
