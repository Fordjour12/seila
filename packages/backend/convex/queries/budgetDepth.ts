import { query } from "../_generated/server";

const DAY_MS = 24 * 60 * 60 * 1000;

export const budgetDepth = query({
  args: {},
  handler: async (ctx) => {
    const [envelopes, transactions] = await Promise.all([
      ctx.db.query("envelopes").collect(),
      ctx.db.query("transactions").collect(),
    ]);

    const now = new Date();
    const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0);
    const prevMonthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0);

    return envelopes.map((envelope) => {
      const currentSpent = transactions
        .filter((transaction) => !transaction.pendingImport && !transaction.voidedAt && transaction.envelopeId === envelope._id && transaction.occurredAt >= monthStart)
        .reduce((sum, transaction) => sum + transaction.amount, 0);

      const prevSpent = transactions
        .filter((transaction) => !transaction.pendingImport && !transaction.voidedAt && transaction.envelopeId === envelope._id && transaction.occurredAt >= prevMonthStart && transaction.occurredAt < monthStart)
        .reduce((sum, transaction) => sum + transaction.amount, 0);

      const ceiling = envelope.softCeiling ?? 0;
      const rollover = ceiling > 0 ? Math.max(ceiling - prevSpent, 0) : 0;
      const available = ceiling + rollover - currentSpent;

      return {
        envelopeId: envelope._id,
        name: envelope.name,
        ceiling,
        currentSpent,
        rollover,
        available,
      };
    });
  },
});

