import { v } from "convex/values";

import { query } from "../_generated/server";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function startOfUtcDay(timestamp: number) {
  const date = new Date(timestamp);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

export const spendingTrend = query({
  args: {
    weeks: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const weeks = Math.min(Math.max(args.weeks ?? 6, 1), 16);
    const now = Date.now();
    const currentWeekStart = startOfUtcDay(now - ((new Date(now).getUTCDay() + 6) % 7) * 24 * 60 * 60 * 1000);
    const earliest = currentWeekStart - (weeks - 1) * WEEK_MS;

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_occurred_at", (q) => q.gte("occurredAt", earliest))
      .collect();

    const buckets = new Map<number, number>();
    for (let i = 0; i < weeks; i += 1) {
      buckets.set(currentWeekStart - i * WEEK_MS, 0);
    }

    for (const transaction of transactions) {
      if (transaction.voidedAt || transaction.pendingImport) {
        continue;
      }

      const offsetWeeks = Math.floor((currentWeekStart - startOfUtcDay(transaction.occurredAt)) / WEEK_MS);
      if (offsetWeeks < 0 || offsetWeeks >= weeks) {
        continue;
      }

      const bucketStart = currentWeekStart - offsetWeeks * WEEK_MS;
      buckets.set(bucketStart, (buckets.get(bucketStart) ?? 0) + transaction.amount);
    }

    return Array.from(buckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([weekStart, total]) => ({
        weekStart,
        total,
      }));
  },
});
