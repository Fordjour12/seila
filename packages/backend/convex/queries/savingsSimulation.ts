import { query } from "../_generated/server";

export const savingsSimulation = query({
  args: {},
  handler: async (ctx) => {
    const [goals, incomes] = await Promise.all([
      ctx.db.query("savingsGoals").collect(),
      ctx.db.query("incomes").collect(),
    ]);

    const monthlyIncome = incomes
      .filter((income) => {
        const now = new Date();
        const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0);
        return income.occurredAt >= monthStart;
      })
      .reduce((sum, income) => sum + income.amount, 0);

    const microSavingsMonthly = Math.round(monthlyIncome * 0.02);
    const allocationPerGoal = goals.length > 0 ? Math.round(microSavingsMonthly / goals.length) : 0;

    return {
      microSavingsMonthly,
      allocationPerGoal,
      projections: goals.map((goal) => ({
        goalId: goal._id,
        name: goal.name,
        currentAmount: goal.currentAmount,
        targetAmount: goal.targetAmount,
        projectedNextMonth: goal.currentAmount + allocationPerGoal,
      })),
    };
  },
});

