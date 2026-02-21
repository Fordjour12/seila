import { query } from "../_generated/server";

export const monthlyCloseExport = query({
  args: {},
  handler: async (ctx) => {
    const [incomes, transactions] = await Promise.all([
      ctx.db.query("incomes").collect(),
      ctx.db.query("transactions").collect(),
    ]);

    const now = new Date();
    const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0);

    const monthIncome = incomes.filter((income) => income.occurredAt >= monthStart);
    const monthTx = transactions.filter((tx) => !tx.pendingImport && !tx.voidedAt && tx.occurredAt >= monthStart);

    const totalIncome = monthIncome.reduce((sum, income) => sum + income.amount, 0);
    const totalExpense = monthTx.reduce((sum, tx) => sum + tx.amount, 0);

    const csvRows = [
      "type,amount,occurredAt,note",
      ...monthIncome.map((income) => `income,${income.amount},${income.occurredAt},${income.note ?? ""}`),
      ...monthTx.map((tx) => `expense,${tx.amount},${tx.occurredAt},${tx.note ?? tx.merchantHint ?? ""}`),
    ];

    return {
      shareText: `Monthly close: income ${totalIncome}, expense ${totalExpense}, net ${totalIncome - totalExpense}`,
      csv: csvRows.join("\n"),
    };
  },
});

