import { ConvexError, v } from "convex/values";
import { mutation } from "../../_generated/server";

export const snoozeTaskReminder = mutation({
  args: {
    idempotencyKey: v.string(),
    taskId: v.id("tasks"),
    snoozeMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new ConvexError("Task not found");
    if (!task.dueAt) throw new ConvexError("Task has no due date");

    const snoozedUntil = Date.now() + Math.max(args.snoozeMinutes, 5) * 60 * 1000;
    await ctx.db.patch(args.taskId, {
      reminderSnoozedUntil: snoozedUntil,
      updatedAt: Date.now(),
    });
    await ctx.db.insert("events", {
      type: "task.reminder_snoozed",
      occurredAt: Date.now(),
      idempotencyKey: args.idempotencyKey,
      payload: { id: args.taskId, snoozedUntil },
    });
    return { success: true, snoozedUntil };
  },
});
