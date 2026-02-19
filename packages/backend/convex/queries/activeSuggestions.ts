import { query } from "../_generated/server";

export const activeSuggestions = query({
  args: {},
  handler: async (ctx) => {
    const suggestions = await ctx.db
      .query("suggestions")
      .withIndex("by_dismissed_at", (q) => q.eq("dismissedAt", undefined))
      .collect();

    return suggestions
      .sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }

        return b.createdAt - a.createdAt;
      })
      .slice(0, 3);
  },
});
