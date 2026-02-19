import { v } from "convex/values";

import { query } from "../_generated/server";

export const reviewHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    return await ctx.db
      .query("reviews")
      .withIndex("by_phase", (q) => q.eq("phase", "closed"))
      .order("desc")
      .take(limit);
  },
});

export const lastReview = query({
  args: {},
  handler: async (ctx) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_phase", (q) => q.eq("phase", "closed"))
      .order("desc")
      .take(1);

    return reviews[0] ?? null;
  },
});
