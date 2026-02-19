import { v } from "convex/values";

import { internalQuery, query } from "../_generated/server";

export const hardModeSession = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("hardModeSessions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .first();
  },
});

export const getSessionById = internalQuery({
  args: {
    sessionId: v.id("hardModeSessions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});
