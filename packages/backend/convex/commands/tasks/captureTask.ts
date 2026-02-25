import { v } from "convex/values";
import { mutation } from "../../_generated/server";

export const captureTask = mutation({
  args: {
    idempotencyKey: v.string(),
    title: v.string(),
    note: v.optional(v.string()),
    estimateMinutes: v.optional(v.number()),
    recurrence: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))),
    blockedByTaskId: v.optional(v.id("tasks")),
    blockedReason: v.optional(v.string()),
    subtasks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          completed: v.boolean(),
        }),
      ),
    ),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    dueAt: v.optional(v.number()),
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
    const title = args.title.trim();
    if (!title) {
      throw new Error("Task title cannot be empty");
    }

    const taskId = await ctx.db.insert("tasks", {
      title,
      note: args.note?.trim() || undefined,
      estimateMinutes: args.estimateMinutes,
      recurrence: args.recurrence,
      blockedByTaskId: args.blockedByTaskId,
      blockedReason: args.blockedReason?.trim() || undefined,
      subtasks: args.subtasks,
      priority: args.priority,
      dueAt: args.dueAt,
      status: "inbox",
      createdAt: occurredAt,
      updatedAt: occurredAt,
    });

    await ctx.db.insert("events", {
      type: "task.created",
      occurredAt,
      idempotencyKey: args.idempotencyKey,
      payload: {
        id: taskId,
        title,
        status: "inbox",
        ...(args.note?.trim() ? { note: args.note.trim() } : {}),
        ...(typeof args.estimateMinutes === "number" ? { estimateMinutes: args.estimateMinutes } : {}),
        ...(args.recurrence ? { recurrence: args.recurrence } : {}),
        ...(args.blockedByTaskId ? { blockedByTaskId: args.blockedByTaskId } : {}),
        ...(args.blockedReason?.trim() ? { blockedReason: args.blockedReason.trim() } : {}),
        ...(args.subtasks ? { subtasks: args.subtasks } : {}),
        ...(args.priority ? { priority: args.priority } : {}),
        ...(typeof args.dueAt === "number" ? { dueAt: args.dueAt } : {}),
      },
    });

    return taskId;
  },
});
