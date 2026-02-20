import { v } from "convex/values";

import { internalMutation } from "../_generated/server";

export const createSuggestionInternal = internalMutation({
  args: {
    policy: v.string(),
    headline: v.string(),
    subtext: v.string(),
    priority: v.number(),
    action: v.optional(
      v.object({
        type: v.union(v.literal("open_screen"), v.literal("run_command")),
        label: v.string(),
        payload: v.optional(v.any()),
      }),
    ),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const suggestionId = await ctx.db.insert("suggestions", {
      policy: args.policy,
      headline: args.headline,
      subtext: args.subtext,
      priority: args.priority,
      action: args.action,
      createdAt: now,
      expiresAt: args.expiresAt,
    });

    await ctx.db.insert("events", {
      type: "suggestion.created",
      occurredAt: now,
      idempotencyKey: `suggestion.created:${suggestionId}:${now}`,
      payload: {
        suggestionId,
        policy: args.policy,
      },
    });

    return { created: true, suggestionId };
  },
});
