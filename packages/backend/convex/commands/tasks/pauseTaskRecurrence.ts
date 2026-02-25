import { ConvexError, v } from "convex/values";
import { mutation } from "../../_generated/server";

export const pauseTaskRecurrence = mutation({
  args: {
    idempotencyKey: v.string(),
    taskId: v.id("tasks"),
    paused: v.boolean(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new ConvexError("Task not found");
    if (!task.recurrence) throw new ConvexError("Task is not recurring");

    await ctx.db.patch(args.taskId, {
      recurrenceEnabled: !args.paused,
      updatedAt: Date.now(),
    });
    await ctx.db.insert("events", {
      type: args.paused ? "task.recurrence_paused" : "task.recurrence_resumed",
      occurredAt: Date.now(),
      idempotencyKey: args.idempotencyKey,
      payload: { id: args.taskId },
    });
    return { success: true };
  },
});
