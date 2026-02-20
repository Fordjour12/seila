import { v } from "convex/values";
import { query } from "../_generated/server";

export const recentCheckins = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 30;
    const checkins = await ctx.db
      .query("checkins")
      .withIndex("by_occurredAt")
      .order("desc")
      .take(limit);
    return checkins;
  },
});
