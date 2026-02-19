import { v } from "convex/values";
import { query } from "../_generated/server";

export const moodTrend = query({
  args: {
    days: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const days = args.days ?? 14;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const checkins = await ctx.db
      .query("checkins")
      .withIndex("by_occurredAt", (q) => q.gte("occurredAt", cutoff))
      .collect();

    if (checkins.length === 0) {
      return {
        averageMood: 0,
        averageEnergy: 0,
        daysTracked: 0,
      };
    }

    const moodSum = checkins.reduce((sum, c) => sum + c.mood, 0);
    const energySum = checkins.reduce((sum, c) => sum + c.energy, 0);

    const uniqueDays = new Set(
      checkins.map((c) => new Date(c.occurredAt).toISOString().split("T")[0]),
    ).size;

    return {
      averageMood: moodSum / checkins.length,
      averageEnergy: energySum / checkins.length,
      daysTracked: uniqueDays,
    };
  },
});
