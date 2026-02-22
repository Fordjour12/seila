import { v } from "convex/values";
import { mutation } from "../../_generated/server";

export const captureTask = mutation({
  args: {
    idempotencyKey: v.string(),
    title: v.string(),
  },
  returns: v.id("tasks"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (existing) {
      throw new Error("Duplicate task capture");
    }

    const occurredAt = Date.now();

    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      status: "inbox",
      createdAt: occurredAt,
    });

    await ctx.db.insert("events", {
      type: "task.created",
      occurredAt,
      idempotencyKey: args.idempotencyKey,
      payload: {
        id: taskId,
        title: args.title,
        status: "inbox",
      },
    });

    return taskId;
  },
});
