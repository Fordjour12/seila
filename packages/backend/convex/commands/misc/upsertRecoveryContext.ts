import { v } from "convex/values";

import { mutation } from "../../_generated/server";

export const upsertRecoveryContext = mutation({
  args: {
    idempotencyKey: v.string(),
    hardDayLooksLike: v.optional(v.string()),
    knownTriggers: v.array(v.string()),
    restDefinition: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingEvent = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (existingEvent) {
      return { updated: true, deduplicated: true };
    }

    const now = Date.now();
    const existingContext = await ctx.db
      .query("recoveryContext")
      .withIndex("by_updated_at")
      .order("desc")
      .first();

    if (existingContext) {
      await ctx.db.patch(existingContext._id, {
        hardDayLooksLike: args.hardDayLooksLike?.trim() || undefined,
        knownTriggers: args.knownTriggers.map((item) => item.trim()).filter(Boolean),
        restDefinition: args.restDefinition?.trim() || undefined,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("recoveryContext", {
        hardDayLooksLike: args.hardDayLooksLike?.trim() || undefined,
        knownTriggers: args.knownTriggers.map((item) => item.trim()).filter(Boolean),
        restDefinition: args.restDefinition?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.insert("events", {
      type: "recoveryContext.updated",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        knownTriggersCount: args.knownTriggers.length,
      },
    });

    return { updated: true, deduplicated: false };
  },
});
