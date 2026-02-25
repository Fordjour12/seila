import { ConvexError, v } from "convex/values";
import { mutation } from "../../_generated/server";

export const updateTaskSeries = mutation({
  args: {
    idempotencyKey: v.string(),
    taskId: v.id("tasks"),
    applyTo: v.union(v.literal("this"), v.literal("future")),
    recurrence: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))),
    note: v.optional(v.string()),
    estimateMinutes: v.optional(v.number()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new ConvexError("Task not found");

    const now = Date.now();
    if (args.applyTo === "this") {
      await ctx.db.patch(args.taskId, {
        recurrence: args.recurrence ?? task.recurrence,
        note: args.note ?? task.note,
        estimateMinutes: args.estimateMinutes ?? task.estimateMinutes,
        priority: args.priority ?? task.priority,
        updatedAt: now,
      });
      return { updated: 1 };
    }

    const seriesId = task.seriesId || String(task._id);
    const tasks = await ctx.db.query("tasks").collect();
    const candidates = tasks.filter(
      (item) =>
        (item.seriesId || String(item._id)) === seriesId &&
        item.status !== "completed" &&
        item.status !== "abandoned" &&
        item.createdAt >= task.createdAt,
    );
    for (const item of candidates) {
      await ctx.db.patch(item._id, {
        recurrence: args.recurrence ?? item.recurrence,
        note: args.note ?? item.note,
        estimateMinutes: args.estimateMinutes ?? item.estimateMinutes,
        priority: args.priority ?? item.priority,
        updatedAt: now,
      });
    }
    return { updated: candidates.length };
  },
});
