import { v } from "convex/values";
import { mutation } from "../_generated/server";

const MAX_FOCUS_ITEMS = 3;

export const focusTask = mutation({
  args: {
    idempotencyKey: v.string(),
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const focusTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "focus"))
      .collect();

    const focusCount = focusTasks.length;

    if (focusCount >= MAX_FOCUS_ITEMS) {
      throw new Error("Focus list is full (max 3 items)");
    }

    const alreadyFocused = task.status === "focus";
    if (alreadyFocused) {
      return { success: true, message: "Task already in focus" };
    }

    const occurredAt = Date.now();

    await ctx.db.patch(args.taskId, {
      status: "focus",
      focusedAt: occurredAt,
    });

    await ctx.db.insert("events", {
      type: "task.focused",
      occurredAt,
      idempotencyKey: args.idempotencyKey,
      payload: { id: args.taskId },
    });

    return { success: true };
  },
});
