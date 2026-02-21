import { v } from "convex/values";

import { query } from "../_generated/server";

function normalizeMerchant(value: string) {
  return value.trim().toLowerCase();
}

export const merchantEnvelopeHints = query({
  args: {
    merchantHints: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const requested = new Set((args.merchantHints ?? []).map(normalizeMerchant).filter(Boolean));
    const filterRequested = requested.size > 0;

    const events = await ctx.db.query("events").collect();
    const latestByMerchant = new Map<string, { envelopeId: string; occurredAt: number; source: string }>();

    for (const event of events) {
      if (event.type !== "finance.merchantEnvelopeHintSet") {
        continue;
      }

      const merchantKeyRaw = event.payload.merchantKey;
      const envelopeIdRaw = event.payload.envelopeId;
      const sourceRaw = event.payload.source;

      if (typeof merchantKeyRaw !== "string" || typeof envelopeIdRaw !== "string") {
        continue;
      }

      const merchantKey = normalizeMerchant(merchantKeyRaw);
      if (!merchantKey) {
        continue;
      }

      if (filterRequested && !requested.has(merchantKey)) {
        continue;
      }

      const current = latestByMerchant.get(merchantKey);
      if (!current || event.occurredAt > current.occurredAt) {
        latestByMerchant.set(merchantKey, {
          envelopeId: envelopeIdRaw,
          occurredAt: event.occurredAt,
          source: typeof sourceRaw === "string" ? sourceRaw : "unknown",
        });
      }
    }

    return Array.from(latestByMerchant.entries())
      .map(([merchantKey, value]) => ({
        merchantKey,
        envelopeId: value.envelopeId,
        occurredAt: value.occurredAt,
        source: value.source,
      }))
      .sort((a, b) => b.occurredAt - a.occurredAt);
  },
});
