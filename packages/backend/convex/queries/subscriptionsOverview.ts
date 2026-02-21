import { query } from "../_generated/server";

const DAY_MS = 24 * 60 * 60 * 1000;

export const subscriptionsOverview = query({
  args: {},
  handler: async (ctx) => {
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const now = Date.now();
    const dueSoonCount = subscriptions.filter((sub) => sub.nextDueAt <= now + 14 * DAY_MS).length;
    const monthlyEquivalent = subscriptions.reduce((sum, sub) => {
      return sum + (sub.cadence === "yearly" ? Math.round(sub.amount / 12) : sub.amount);
    }, 0);

    return {
      count: subscriptions.length,
      dueSoonCount,
      monthlyEquivalent,
      items: subscriptions
        .map((sub) => ({
          subscriptionId: sub._id,
          name: sub.name,
          amount: sub.amount,
          cadence: sub.cadence,
          nextDueAt: sub.nextDueAt,
        }))
        .sort((a, b) => a.nextDueAt - b.nextDueAt),
    };
  },
});
