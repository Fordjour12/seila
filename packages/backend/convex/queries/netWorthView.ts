import { query } from "../_generated/server";

export const netWorthView = query({
  args: {},
  handler: async (ctx) => {
    const [accounts, investments, debts] = await Promise.all([
      ctx.db.query("accounts").collect(),
      ctx.db.query("investments").collect(),
      ctx.db.query("debts").collect(),
    ]);

    const accountAssets = accounts.filter((account) => !account.isHidden).reduce((sum, account) => sum + account.balance, 0);
    const investmentAssets = investments.reduce((sum, item) => sum + item.currentValue, 0);
    const liabilities = debts.filter((debt) => debt.isActive).reduce((sum, debt) => sum + debt.balance, 0);

    return {
      assets: accountAssets + investmentAssets,
      liabilities,
      netWorth: accountAssets + investmentAssets - liabilities,
      breakdown: {
        accounts: accountAssets,
        investments: investmentAssets,
        debts: liabilities,
      },
    };
  },
});

