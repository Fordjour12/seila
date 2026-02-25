import { v } from "convex/values";
import { mutation } from "../../_generated/server";

const DAY_MS = 24 * 60 * 60 * 1000;

function nextDueFrom(current: number | undefined, recurrence: "daily" | "weekly" | "monthly") {
  const base = typeof current === "number" ? current : Date.now();
  if (recurrence === "daily") return base + DAY_MS;
  if (recurrence === "weekly") return base + 7 * DAY_MS;
  const date = new Date(base);
  date.setMonth(date.getMonth() + 1);
  return date.getTime();
}

export const completeTask = mutation({
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
      status: "completed",
      completedAt: occurredAt,
      updatedAt: occurredAt,
    });

    await ctx.db.insert("events", {
      type: "task.completed",
      occurredAt,
      idempotencyKey: args.idempotencyKey,
      payload: { id: args.taskId },
    });

    if (task.skipNextRecurrence) {
      await ctx.db.patch(args.taskId, {
        skipNextRecurrence: false,
        updatedAt: occurredAt,
      });
      return { success: true };
    }

    if (task.recurrence && task.recurrenceEnabled !== false) {
      const nextDueAt = nextDueFrom(task.dueAt, task.recurrence);
      const seriesId = task.seriesId || String(task._id);
      const nextTaskId = await ctx.db.insert("tasks", {
        title: task.title,
        note: task.note,
        estimateMinutes: task.estimateMinutes,
        recurrence: task.recurrence,
        seriesId,
        recurrenceEnabled: task.recurrenceEnabled ?? true,
        skipNextRecurrence: false,
        remindersEnabled: task.remindersEnabled ?? false,
        reminderOffsetMinutes: task.reminderOffsetMinutes,
        blockedByTaskId: task.blockedByTaskId,
        blockedReason: task.blockedReason,
        subtasks: task.subtasks?.map((item) => ({ ...item, completed: false })),
        priority: task.priority,
        dueAt: nextDueAt,
        status: "inbox",
        createdAt: occurredAt,
        updatedAt: occurredAt,
      });
      await ctx.db.insert("events", {
        type: "task.recurred",
        occurredAt,
        idempotencyKey: `${args.idempotencyKey}:recur`,
        payload: {
          id: nextTaskId,
          sourceTaskId: args.taskId,
          recurrence: task.recurrence,
          seriesId,
          dueAt: nextDueAt,
        },
      });
    }

    return { success: true };
  },
});
