import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";

export const bulkUpdateTransactions = mutation({
  args: {
    idempotencyKey: v.string(),
    transactionIds: v.array(v.id("transactions")),
    action: v.union(v.literal("void"), v.literal("assign_envelope")),
    envelopeId: v.optional(v.id("envelopes")),
  },
  handler: async (ctx, args) => {
    const dedupe = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (dedupe) return { deduplicated: true, updated: 0 };

    if (args.action === "assign_envelope" && !args.envelopeId) {
      throw new ConvexError("envelopeId is required for assign_envelope");
    }

    if (args.envelopeId) {
      const envelope = await ctx.db.get(args.envelopeId);
      if (!envelope) throw new ConvexError("Envelope not found");
    }

    let updated = 0;
    const now = Date.now();
    for (const transactionId of args.transactionIds) {
      const transaction = await ctx.db.get(transactionId);
      if (!transaction || transaction.voidedAt) continue;

      if (args.action === "void") {
        await ctx.db.patch(transactionId, {
          voidedAt: now,
          pendingImport: false,
          updatedAt: now,
        });
      } else {
        await ctx.db.patch(transactionId, {
          envelopeId: args.envelopeId,
          updatedAt: now,
        });
      }

      updated += 1;
    }

    await ctx.db.insert("events", {
      type: "finance.transactions.bulkUpdated",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        count: updated,
        action: args.action,
        ...(args.envelopeId ? { envelopeId: args.envelopeId } : {}),
      },
    });

    return { deduplicated: false, updated };
  },
});
