import { ConvexError, v } from "convex/values";
import { mutation } from "../../_generated/server";

export const skipNextRecurrence = mutation({
  args: {
    idempotencyKey: v.string(),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new ConvexError("Task not found");
    if (!task.recurrence) throw new ConvexError("Task is not recurring");

    await ctx.db.patch(args.taskId, {
      skipNextRecurrence: true,
      updatedAt: Date.now(),
    });
    await ctx.db.insert("events", {
      type: "task.recurrence_skipped_next",
      occurredAt: Date.now(),
      idempotencyKey: args.idempotencyKey,
      payload: { id: args.taskId },
    });
    return { success: true };
  },
});
