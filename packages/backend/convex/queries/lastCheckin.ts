import { v } from "convex/values";
import { query } from "../_generated/server";

export const lastCheckin = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const checkins = await ctx.db
      .query("checkins")
      .withIndex("by_occurredAt")
      .order("desc")
      .take(1);

    if (checkins.length === 0) {
      return null;
    }

    const last = checkins[0];
    return {
      _id: last._id,
      _creationTime: last._creationTime,
      type: last.type,
      mood: last.mood,
      energy: last.energy,
      occurredAt: last.occurredAt,
    };
  },
});