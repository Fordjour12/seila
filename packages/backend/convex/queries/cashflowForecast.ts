import { query } from "../_generated/server";

const DAY_MS = 24 * 60 * 60 * 1000;

export const cashflowForecast = query({
  args: {},
  handler: async (ctx) => {
    const [incomes, transactions] = await Promise.all([
      ctx.db.query("incomes").collect(),
      ctx.db.query("transactions").collect(),
    ]);

    const now = Date.now();
    const trailing60 = now - 60 * DAY_MS;
    const trailingIncome = incomes
      .filter((income) => income.occurredAt >= trailing60)
      .reduce((sum, income) => sum + income.amount, 0);
    const trailingExpense = transactions
      .filter(
        (transaction) =>
          !transaction.pendingImport &&
          !transaction.voidedAt &&
          transaction.occurredAt >= trailing60,
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const dailyIncome = trailingIncome / 60;
    const dailyExpense = trailingExpense / 60;
    const forecast30Net = Math.round((dailyIncome - dailyExpense) * 30);

    return {
      dailyIncome,
      dailyExpense,
      forecast30Net,
      expectedIncome30: Math.round(dailyIncome * 30),
      expectedExpense30: Math.round(dailyExpense * 30),
    };
  },
});
