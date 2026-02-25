import { internalMutation } from "../../_generated/server";
import { v } from "convex/values";

export const recordTaskReminder = internalMutation({
  args: {
    idempotencyKey: v.string(),
    taskId: v.id("tasks"),
    scheduledFor: v.number(),
    reason: v.union(v.literal("sent"), v.literal("suppressed_quiet"), v.literal("snoozed")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (existing) {
      return { recorded: false };
    }

    const now = Date.now();
    await ctx.db.insert("events", {
      type: "task.reminder",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        taskId: args.taskId,
        scheduledFor: args.scheduledFor,
        reason: args.reason,
      },
    });

    await ctx.db.patch(args.taskId, {
      lastReminderAt: now,
      reminderSnoozedUntil: args.reason === "snoozed" ? args.scheduledFor : undefined,
      updatedAt: now,
    });
    return { recorded: true };
  },
});
