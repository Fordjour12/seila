import { v } from "convex/values";
import { mutation } from "../../_generated/server";

export const bulkUpdateTasks = mutation({
  args: {
    idempotencyKey: v.string(),
    taskIds: v.array(v.id("tasks")),
    action: v.union(
      v.literal("focus"),
      v.literal("defer"),
      v.literal("complete"),
      v.literal("abandon"),
      v.literal("reopen"),
      v.literal("setPriority"),
    ),
    deferUntil: v.optional(v.number()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
  },
  handler: async (ctx, args) => {
    const occurredAt = Date.now();
    let updated = 0;

    for (const taskId of args.taskIds) {
      const task = await ctx.db.get(taskId);
      if (!task) continue;

      if (args.action === "focus") {
        await ctx.db.patch(taskId, { status: "focus", focusedAt: occurredAt, updatedAt: occurredAt });
      }
      if (args.action === "defer") {
        await ctx.db.patch(taskId, {
          status: "deferred",
          deferredUntil: args.deferUntil,
          updatedAt: occurredAt,
        });
      }
      if (args.action === "complete") {
        await ctx.db.patch(taskId, { status: "completed", completedAt: occurredAt, updatedAt: occurredAt });
      }
      if (args.action === "abandon") {
        await ctx.db.patch(taskId, { status: "abandoned", abandonedAt: occurredAt, updatedAt: occurredAt });
      }
      if (args.action === "reopen") {
        await ctx.db.patch(taskId, {
          status: "inbox",
          reopenedAt: occurredAt,
          completedAt: undefined,
          abandonedAt: undefined,
          updatedAt: occurredAt,
        });
      }
      if (args.action === "setPriority" && args.priority) {
        await ctx.db.patch(taskId, { priority: args.priority, updatedAt: occurredAt });
      }

      updated += 1;
    }

    await ctx.db.insert("events", {
      type: "task.bulk_updated",
      occurredAt,
      idempotencyKey: args.idempotencyKey,
      payload: {
        action: args.action,
        count: updated,
      },
    });

    return { updated };
  },
});
