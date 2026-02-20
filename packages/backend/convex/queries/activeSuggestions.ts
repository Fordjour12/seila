import { query } from "../_generated/server";

export const activeSuggestions = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const suggestions = await ctx.db
      .query("suggestions")
      .withIndex("by_dismissed_at", (q) => q.eq("dismissedAt", undefined))
      .collect();

    return suggestions
      .filter((suggestion) => !suggestion.expiresAt || suggestion.expiresAt > now)
      .sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }

        return b.createdAt - a.createdAt;
      })
      .slice(0, 3);
  },
});
