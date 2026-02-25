import { query } from "../_generated/server";

export const monthlyCloseSummary = query({
  args: {},
  handler: async (ctx) => {
    const [envelopes, transactions] = await Promise.all([
      ctx.db.query("envelopes").collect(),
      ctx.db.query("transactions").collect(),
    ]);

    const now = new Date();
    const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0);

    const activeTransactions = transactions.filter(
      (transaction) =>
        !transaction.voidedAt && !transaction.pendingImport && transaction.occurredAt >= monthStart,
    );

    const totalSpent = activeTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const totalBudget = envelopes.reduce((sum, envelope) => sum + (envelope.softCeiling ?? 0), 0);

    const overspendAreas = envelopes
      .map((envelope) => {
        const spent = activeTransactions
          .filter((transaction) => transaction.envelopeId === envelope._id)
          .reduce((sum, transaction) => sum + transaction.amount, 0);
        const budget = envelope.softCeiling ?? 0;
        return {
          name: envelope.name,
          spent,
          budget,
          ratio: budget > 0 ? spent / budget : 0,
        };
      })
      .filter((row) => row.budget > 0 && row.ratio > 1)
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 3)
      .map((row) => row.name);

    const onTrackCount = envelopes.filter((envelope) => {
      if (!envelope.softCeiling || envelope.softCeiling <= 0) {
        return false;
      }
      const spent = activeTransactions
        .filter((transaction) => transaction.envelopeId === envelope._id)
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      return spent <= envelope.softCeiling;
    }).length;

    const win =
      envelopes.length === 0
        ? "Set up your first envelope to start tracking progress."
        : `You stayed within budget in ${onTrackCount} envelope${onTrackCount === 1 ? "" : "s"}.`;

    const focus =
      overspendAreas.length > 0
        ? `Tighten ${overspendAreas[0]} next month with a smaller weekly cap.`
        : "Carry current envelope limits forward and keep logging consistently.";

    return {
      monthStart,
      totalSpent,
      totalBudget,
      overspendAreas,
      win,
      focus,
    };
  },
});
