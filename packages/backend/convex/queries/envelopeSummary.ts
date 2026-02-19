import { query } from "../_generated/server";

export const envelopeSummary = query({
  args: {},
  handler: async (ctx) => {
    const [envelopes, transactions] = await Promise.all([
      ctx.db.query("envelopes").collect(),
      ctx.db.query("transactions").collect(),
    ]);

    const currentMonth = new Date();
    const monthStart = new Date(
      Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth(), 1, 0, 0, 0, 0),
    ).getTime();

    return envelopes
      .map((envelope) => {
        const spent = transactions
          .filter(
            (transaction) =>
              !transaction.voidedAt &&
              !transaction.pendingImport &&
              transaction.envelopeId === envelope._id &&
              transaction.occurredAt >= monthStart,
          )
          .reduce((sum, transaction) => sum + transaction.amount, 0);

        const utilization =
          typeof envelope.softCeiling === "number" && envelope.softCeiling > 0
            ? spent / envelope.softCeiling
            : 0;

        return {
          envelopeId: envelope._id,
          name: envelope.name,
          emoji: envelope.emoji,
          isPrivate: envelope.isPrivate,
          softCeiling: envelope.softCeiling,
          spent,
          utilization,
        };
      })
      .sort((a, b) => b.spent - a.spent);
  },
});
