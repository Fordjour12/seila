"use node";

import { makeFunctionReference } from "convex/server";
import { internalAction } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

const quietTodayRef = makeFunctionReference<"query", {}, { isQuiet: boolean }>(
  "queries/quietToday:quietToday",
);

const recordTaskReminderRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    taskId: Id<"tasks">;
    scheduledFor: number;
    reason: "sent" | "suppressed_quiet" | "snoozed";
  },
  { recorded: boolean }
>("commands/tasks/recordTaskReminder:recordTaskReminder");

const tasksFilteredRef = makeFunctionReference<
  "query",
  { dueBucket?: "all" | "today" | "overdue" | "none" },
  Array<{
    _id: Id<"tasks">;
    dueAt?: number;
    status: "inbox" | "focus" | "deferred" | "completed" | "abandoned";
    remindersEnabled?: boolean;
    reminderOffsetMinutes?: number;
    reminderSnoozedUntil?: number;
  }>
>("queries/taskQueries:filteredTasks");

export const processTaskReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const quietToday = await ctx.runQuery(quietTodayRef, {});
    const candidates = await ctx.runQuery(tasksFilteredRef, { dueBucket: "today" });
    let sent = 0;
    let suppressed = 0;

    for (const task of candidates) {
      if (!task.dueAt) continue;
      if (task.status === "completed" || task.status === "abandoned") continue;
      if (!task.remindersEnabled) continue;
      const offset = task.reminderOffsetMinutes ?? 30;
      const scheduledFor = task.dueAt - offset * 60 * 1000;
      if (task.reminderSnoozedUntil && task.reminderSnoozedUntil > now) {
        await ctx.runMutation(recordTaskReminderRef, {
          idempotencyKey: `tasks.reminder.snoozed:${task._id}:${task.reminderSnoozedUntil}`,
          taskId: task._id,
          scheduledFor: task.reminderSnoozedUntil,
          reason: "snoozed",
        });
        continue;
      }
      if (now < scheduledFor) continue;

      if (quietToday?.isQuiet) {
        await ctx.runMutation(recordTaskReminderRef, {
          idempotencyKey: `tasks.reminder.suppressed:${task._id}:${scheduledFor}`,
          taskId: task._id,
          scheduledFor,
          reason: "suppressed_quiet",
        });
        suppressed += 1;
        continue;
      }

      await ctx.runMutation(recordTaskReminderRef, {
        idempotencyKey: `tasks.reminder.sent:${task._id}:${scheduledFor}`,
        taskId: task._id,
        scheduledFor,
        reason: "sent",
      });
      sent += 1;
    }

    return { sent, suppressed };
  },
});
