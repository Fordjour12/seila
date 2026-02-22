import { query } from "../_generated/server";

export const savingsGoals = query({
  args: {},
  handler: async (ctx) => {
    const goals = await ctx.db
      .query("savingsGoals")
      .withIndex("by_archived_at", (q) => q.eq("archivedAt", undefined))
      .collect();

    return goals
      .map((goal) => ({
        goalId: goal._id,
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        envelopeId: goal.envelopeId,
        deadlineAt: goal.deadlineAt,
        progress: goal.targetAmount > 0 ? Math.min(goal.currentAmount / goal.targetAmount, 1) : 0,
      }))
      .sort((a, b) => a.progress - b.progress);
  },
});
