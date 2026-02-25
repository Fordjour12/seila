import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";
import { assertNoTaskDependencyCycle } from "./shared";

export const updateTask = mutation({
  args: {
    idempotencyKey: v.string(),
    taskId: v.id("tasks"),
    title: v.string(),
    note: v.optional(v.string()),
    estimateMinutes: v.optional(v.number()),
    recurrence: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))),
    seriesId: v.optional(v.string()),
    recurrenceEnabled: v.optional(v.boolean()),
    skipNextRecurrence: v.optional(v.boolean()),
    remindersEnabled: v.optional(v.boolean()),
    reminderOffsetMinutes: v.optional(v.number()),
    reminderSnoozedUntil: v.optional(v.number()),
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

    await assertNoTaskDependencyCycle(ctx, {
      taskId: args.taskId,
      blockedByTaskId: args.blockedByTaskId,
    });

    await ctx.db.patch(args.taskId, {
      title,
      note: args.note?.trim() || undefined,
      estimateMinutes: args.estimateMinutes,
      recurrence: args.recurrence,
      seriesId: args.seriesId,
      recurrenceEnabled: args.recurrenceEnabled,
      skipNextRecurrence: args.skipNextRecurrence,
      remindersEnabled: args.remindersEnabled,
      reminderOffsetMinutes: args.reminderOffsetMinutes,
      reminderSnoozedUntil: args.reminderSnoozedUntil,
      blockedByTaskId: args.blockedByTaskId,
      blockedReason: args.blockedReason?.trim() || undefined,
      subtasks: args.subtasks,
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
        ...(typeof args.estimateMinutes === "number" ? { estimateMinutes: args.estimateMinutes } : {}),
        ...(args.recurrence ? { recurrence: args.recurrence } : {}),
        ...(args.blockedByTaskId ? { blockedByTaskId: args.blockedByTaskId } : {}),
        ...(args.blockedReason?.trim() ? { blockedReason: args.blockedReason.trim() } : {}),
        ...(args.subtasks ? { subtasks: args.subtasks } : {}),
        ...(args.priority ? { priority: args.priority } : {}),
        ...(typeof args.dueAt === "number" ? { dueAt: args.dueAt } : {}),
      },
    });

    return { success: true, deduplicated: false };
  },
});
