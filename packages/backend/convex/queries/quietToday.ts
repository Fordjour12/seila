import { query } from "../_generated/server";

function startOfLocalDay(now: number) {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export const quietToday = query({
  args: {},
  handler: async (ctx) => {
    const dayStart = startOfLocalDay(Date.now());

    const record = await ctx.db
      .query("quietDays")
      .withIndex("by_day_start", (q) => q.eq("dayStart", dayStart))
      .first();

    return {
      isQuiet: Boolean(record?.isQuiet),
      reason: record?.reason,
      dayStart,
    };
  },
});
