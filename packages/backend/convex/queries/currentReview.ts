import { query } from "../_generated/server";

export const currentReview = query({
  args: {},
  handler: async (ctx) => {
    const phaseOrder: Array<"lookback" | "reflect" | "intentions"> = [
      "lookback",
      "reflect",
      "intentions",
    ];

    for (const phase of phaseOrder) {
      const reviews = await ctx.db
        .query("reviews")
        .withIndex("by_phase", (q) => q.eq("phase", phase))
        .order("desc")
        .take(1);

      if (reviews.length > 0) {
        return reviews[0];
      }
    }

    return null;
  },
});
