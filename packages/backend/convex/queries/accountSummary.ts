import { query } from "../_generated/server";

export const accountList = query({
  handler: async (ctx) => {
    const accounts = await ctx.db
      .query("accounts")
      .filter((q) => q.eq(q.field("isHidden"), false))
      .collect();

    return accounts.map((account) => ({
      accountId: account._id,
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency,
      institution: account.institution,
    }));
  },
});

export const accountSummary = query({
  handler: async (ctx) => {
    const accounts = await ctx.db
      .query("accounts")
      .filter((q) => q.eq(q.field("isHidden"), false))
      .collect();

    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

    const byType = accounts.reduce(
      (acc, account) => {
        if (!acc[account.type]) {
          acc[account.type] = 0;
        }
        acc[account.type] += account.balance;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      accounts: accounts.map((account) => ({
        accountId: account._id,
        name: account.name,
        type: account.type,
        balance: account.balance,
        currency: account.currency,
        institution: account.institution,
      })),
      totalBalance,
      byType,
    };
  },
});
