import { v } from "convex/values";

import { mutation } from "../../_generated/server";

export const dismissSuggestion = mutation({
  args: {
    idempotencyKey: v.string(),
    suggestionId: v.id("suggestions"),
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

    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion || suggestion.dismissedAt) {
      return {
        dismissed: true,
        deduplicated: false,
      };
    }

    await ctx.db.patch(args.suggestionId, {
      dismissedAt: Date.now(),
    });

    await ctx.db.insert("events", {
      type: "suggestion.dismissed",
      occurredAt: Date.now(),
      idempotencyKey: args.idempotencyKey,
      payload: {
        suggestionId: args.suggestionId,
        policy: suggestion.policy,
      },
    });

    return {
      dismissed: true,
      deduplicated: false,
    };
  },
});
