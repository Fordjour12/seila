import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const abandonTask = mutation({
  args: {
    idempotencyKey: v.string(),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const occurredAt = Date.now();

    await ctx.db.patch(args.taskId, {
      status: "abandoned",
      abandonedAt: occurredAt,
    });

    await ctx.db.insert("events", {
      type: "task.abandoned",
      occurredAt,
      idempotencyKey: args.idempotencyKey,
      payload: { id: args.taskId },
    });

    return { success: true };
  },
});
