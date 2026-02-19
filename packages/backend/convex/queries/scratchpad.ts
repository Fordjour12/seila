import { query } from "../_generated/server";

export const todayScratchpad = query({
  args: {},
  handler: async (ctx) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const dayStart = start.getTime();

    const entries = await ctx.db
      .query("scratchpadEntries")
      .withIndex("by_created_at", (q) => q.gte("createdAt", dayStart))
      .collect();

    return entries
      .filter((entry) => !entry.triagedAt)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 25);
  },
});
