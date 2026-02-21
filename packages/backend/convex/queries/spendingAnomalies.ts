import { query } from "../_generated/server";

const DAY_MS = 24 * 60 * 60 * 1000;

export const spendingAnomalies = query({
  args: {},
  handler: async (ctx) => {
    const transactions = await ctx.db.query("transactions").collect();
    const now = Date.now();
    const last7 = now - 7 * DAY_MS;
    const baseline28 = now - 35 * DAY_MS;

    const recent = transactions
      .filter((tx) => !tx.pendingImport && !tx.voidedAt && tx.occurredAt >= last7)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const baseline = transactions
      .filter((tx) => !tx.pendingImport && !tx.voidedAt && tx.occurredAt >= baseline28 && tx.occurredAt < last7)
      .reduce((sum, tx) => sum + tx.amount, 0) / 4;

    const ratio = baseline > 0 ? recent / baseline : 0;
    const anomalies = [] as Array<{ type: string; headline: string; ratio: number }>;

    if (ratio >= 1.4) {
      anomalies.push({
        type: "spike",
        headline: "Spending is significantly above your baseline this week.",
        ratio,
      });
    }

    return {
      recent,
      baseline,
      anomalies,
    };
  },
});

