import { query } from "../_generated/server";

export const multiCurrencySummary = query({
  args: {},
  handler: async (ctx) => {
    const [accounts, fxRates] = await Promise.all([
      ctx.db.query("accounts").collect(),
      ctx.db.query("fxRates").collect(),
    ]);

    const latestRateByPair = new Map<string, number>();
    for (const row of fxRates.sort((a, b) => b.asOf - a.asOf)) {
      const key = `${row.baseCurrency}:${row.quoteCurrency}`;
      if (!latestRateByPair.has(key)) {
        latestRateByPair.set(key, row.rateScaled);
      }
    }

    const balancesByCurrency = new Map<string, number>();
    for (const account of accounts) {
      if (account.isHidden) continue;
      const currency = (account.currency || "GHS").toUpperCase();
      balancesByCurrency.set(currency, (balancesByCurrency.get(currency) ?? 0) + account.balance);
    }

    const baseCurrency = "GHS";
    let baseValue = 0;
    for (const [currency, value] of balancesByCurrency.entries()) {
      if (currency === baseCurrency) {
        baseValue += value;
        continue;
      }

      const rateKey = `${currency}:${baseCurrency}`;
      const rateScaled = latestRateByPair.get(rateKey);
      if (rateScaled) {
        baseValue += Math.round((value * rateScaled) / 1000000);
      }
    }

    return {
      baseCurrency,
      estimatedTotalInBase: baseValue,
      currencies: Array.from(balancesByCurrency.entries()).map(([currency, amount]) => ({ currency, amount })),
    };
  },
});

