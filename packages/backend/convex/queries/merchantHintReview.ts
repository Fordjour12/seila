import { v } from "convex/values";

import { query } from "../_generated/server";

function normalizeMerchant(value?: string) {
  return (value || "").trim().toLowerCase();
}

export const merchantHintReview = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 12, 1), 50);
    const [events, transactions] = await Promise.all([
      ctx.db.query("events").collect(),
      ctx.db.query("transactions").collect(),
    ]);

    const latestHintByMerchant = new Map<string, { envelopeId: string; occurredAt: number }>();
    for (const event of events) {
      if (event.type !== "finance.merchantEnvelopeHintSet") continue;

      const merchantKey = normalizeMerchant(
        typeof event.payload.merchantKey === "string" ? event.payload.merchantKey : undefined,
      );
      const envelopeId =
        typeof event.payload.envelopeId === "string" ? event.payload.envelopeId : undefined;

      if (!merchantKey || !envelopeId) continue;

      const existing = latestHintByMerchant.get(merchantKey);
      if (!existing || event.occurredAt > existing.occurredAt) {
        latestHintByMerchant.set(merchantKey, { envelopeId, occurredAt: event.occurredAt });
      }
    }

    const rows = Array.from(latestHintByMerchant.entries()).map(([merchantKey, latest]) => {
      const merchantTransactions = transactions.filter((transaction) => {
        if (transaction.pendingImport || transaction.voidedAt) return false;
        return normalizeMerchant(transaction.merchantHint || transaction.note) === merchantKey;
      });

      const classified = merchantTransactions.filter((transaction) =>
        Boolean(transaction.envelopeId),
      );
      const matches = classified.filter(
        (transaction) => transaction.envelopeId === latest.envelopeId,
      );
      const sampleSize = classified.length;
      const confidence = sampleSize > 0 ? matches.length / sampleSize : 0;

      return {
        merchantKey,
        envelopeId: latest.envelopeId,
        confidence,
        sampleSize,
        lastUpdatedAt: latest.occurredAt,
      };
    });

    return rows
      .sort((a, b) => b.confidence - a.confidence || b.sampleSize - a.sampleSize)
      .slice(0, limit);
  },
});
