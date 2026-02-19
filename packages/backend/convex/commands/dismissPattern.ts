import { v } from "convex/values";

import { mutation } from "../_generated/server";

export const dismissPattern = mutation({
  args: {
    idempotencyKey: v.string(),
    patternId: v.id("patterns"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (existing) {
      return {
        dismissed: true,
        deduplicated: true,
      };
    }

    const pattern = await ctx.db.get(args.patternId);
    if (!pattern || pattern.dismissedAt) {
      return {
        dismissed: true,
        deduplicated: false,
      };
    }

    const now = Date.now();

    await ctx.db.patch(args.patternId, {
      dismissedAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("events", {
      type: "pattern.dismissed",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        patternId: args.patternId,
      },
    });

    return {
      dismissed: true,
      deduplicated: false,
    };
  },
});
