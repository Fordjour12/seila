import { internalQuery, query } from "../_generated/server";

export const recoveryContext = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("recoveryContext").withIndex("by_updated_at").order("desc").first();
  },
});

export const internalRecoveryContext = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("recoveryContext").withIndex("by_updated_at").order("desc").first();
  },
});
