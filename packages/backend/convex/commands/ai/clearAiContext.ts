import { v } from "convex/values";

import { mutation } from "../../_generated/server";
import { DEFAULT_AI_CONTEXT } from "../../lib/aiContext";

export const clearAiContext = mutation({
  args: {
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    const dedupe = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (dedupe) {
      return { cleared: true, deduplicated: true };
    }

    const existing = await ctx.db
      .query("aiContext")
      .withIndex("by_last_updated")
      .order("desc")
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...DEFAULT_AI_CONTEXT,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("aiContext", {
        ...DEFAULT_AI_CONTEXT,
        lastUpdated: Date.now(),
      });
    }

    await ctx.db.insert("events", {
      type: "aiContext.cleared",
      occurredAt: Date.now(),
      idempotencyKey: args.idempotencyKey,
      payload: {
        cleared: true,
      },
    });

    return { cleared: true, deduplicated: false };
  },
});
