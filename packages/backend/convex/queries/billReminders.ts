import { query } from "../_generated/server";

const DAY_MS = 24 * 60 * 60 * 1000;

export const billReminders = query({
  args: {},
  handler: async (ctx) => {
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const now = Date.now();
    const dueSoon = subs
      .filter((sub) => sub.nextDueAt <= now + 10 * DAY_MS)
      .sort((a, b) => a.nextDueAt - b.nextDueAt)
      .map((sub) => ({
        subscriptionId: sub._id,
        name: sub.name,
        amount: sub.amount,
        nextDueAt: sub.nextDueAt,
      }));

    return { dueSoon };
  },
});

