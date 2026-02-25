import { query } from "../_generated/server";

const DAY_MS = 24 * 60 * 60 * 1000;

export const cashflowSummary = query({
  args: {},
  handler: async (ctx) => {
    const [accounts, incomes, transactions] = await Promise.all([
      ctx.db.query("accounts").collect(),
      ctx.db.query("incomes").collect(),
      ctx.db.query("transactions").collect(),
    ]);

    const now = Date.now();
    const monthStart = Date.UTC(
      new Date(now).getUTCFullYear(),
      new Date(now).getUTCMonth(),
      1,
      0,
      0,
      0,
      0,
    );
    const trailing30 = now - 30 * DAY_MS;

    const monthIncome = incomes
      .filter((income) => income.occurredAt >= monthStart)
      .reduce((sum, income) => sum + income.amount, 0);
    const monthExpense = transactions
      .filter(
        (transaction) =>
          !transaction.voidedAt &&
          !transaction.pendingImport &&
          transaction.occurredAt >= monthStart,
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const trailingExpense = transactions
      .filter(
        (transaction) =>
          !transaction.voidedAt &&
          !transaction.pendingImport &&
          transaction.occurredAt >= trailing30,
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const dailyBurn = trailingExpense / 30;
    const totalBalance = accounts
      .filter((account) => !account.isHidden)
      .reduce((sum, account) => sum + account.balance, 0);
    const runwayDays = dailyBurn > 0 ? Math.max(Math.floor(totalBalance / dailyBurn), 0) : null;

    return {
      monthIncome,
      monthExpense,
      netCashflow: monthIncome - monthExpense,
      totalBalance,
      dailyBurn,
      runwayDays,
    };
  },
});
