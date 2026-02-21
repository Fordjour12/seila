import { query } from "../_generated/server";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function weekStart(now: number) {
  const date = new Date(now);
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime() - day * 24 * 60 * 60 * 1000;
}

export const currentWeeklyMoneyCheckin = query({
  args: {},
  handler: async (ctx) => {
    const start = weekStart(Date.now());
    const checkin = await ctx.db
      .query("weeklyMoneyCheckins")
      .withIndex("by_week", (q) => q.eq("weekStart", start))
      .first();
    return checkin
      ? {
          checkinId: checkin._id,
          weekStart: checkin.weekStart,
          wins: checkin.wins,
          overspendAreas: checkin.overspendAreas,
          correction: checkin.correction,
          focus: checkin.focus,
        }
      : null;
  },
});

