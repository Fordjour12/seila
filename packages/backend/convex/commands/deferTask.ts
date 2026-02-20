import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const deferTask = mutation({
  args: {
    idempotencyKey: v.string(),
    taskId: v.id("tasks"),
    deferUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const occurredAt = Date.now();

    await ctx.db.patch(args.taskId, {
      status: "deferred",
      deferredUntil: args.deferUntil,
    });

    await ctx.db.insert("events", {
      type: "task.deferred",
      occurredAt,
      idempotencyKey: args.idempotencyKey,
      payload: {
        id: args.taskId,
        ...(args.deferUntil !== undefined ? { deferUntil: args.deferUntil } : {}),
      },
    });

    return { success: true };
  },
});
