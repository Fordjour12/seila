import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";

export const updateTask = mutation({
  args: {
    idempotencyKey: v.string(),
    taskId: v.id("tasks"),
    title: v.string(),
    note: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    dueAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (existing) {
      return { success: true, deduplicated: true };
    }

    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new ConvexError("Task not found");
    }

    const title = args.title.trim();
    if (!title) {
      throw new ConvexError("Task title cannot be empty");
    }

    const occurredAt = Date.now();

    await ctx.db.patch(args.taskId, {
      title,
      note: args.note?.trim() || undefined,
      priority: args.priority,
      dueAt: args.dueAt,
      updatedAt: occurredAt,
    });

    await ctx.db.insert("events", {
      type: "task.updated",
      occurredAt,
      idempotencyKey: args.idempotencyKey,
      payload: {
        id: args.taskId,
        title,
        ...(args.note?.trim() ? { note: args.note.trim() } : {}),
        ...(args.priority ? { priority: args.priority } : {}),
        ...(typeof args.dueAt === "number" ? { dueAt: args.dueAt } : {}),
      },
    });

    return { success: true, deduplicated: false };
  },
});
