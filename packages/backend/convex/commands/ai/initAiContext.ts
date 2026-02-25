import { v } from "convex/values";

import { mutation } from "../../_generated/server";
import { DEFAULT_AI_CONTEXT } from "../../lib/aiContext";

export const initAiContext = mutation({
  args: {
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    const dedupe = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (dedupe) {
      return { initialized: true, deduplicated: true };
    }

    const existing = await ctx.db
      .query("aiContext")
      .withIndex("by_last_updated")
      .order("desc")
      .first();

    if (!existing) {
      await ctx.db.insert("aiContext", {
        ...DEFAULT_AI_CONTEXT,
        lastUpdated: Date.now(),
      });
    }

    await ctx.db.insert("events", {
      type: "aiContext.initialized",
      occurredAt: Date.now(),
      idempotencyKey: args.idempotencyKey,
      payload: {
        initialized: true,
      },
    });

    return { initialized: true, deduplicated: false };
  },
});
