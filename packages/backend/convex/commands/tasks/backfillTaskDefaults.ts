import { mutation } from "../../_generated/server";
import { v } from "convex/values";

export const backfillTaskDefaults = mutation({
  args: {
    idempotencyKey: v.string(),
  },
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    let updated = 0;
    const now = Date.now();
    for (const task of tasks) {
      const patch: Partial<(typeof task)> = {};
      if (!task.updatedAt) patch.updatedAt = task.createdAt || now;
      if (!task.priority) patch.priority = "medium";
      if (task.recurrence && !task.seriesId) patch.seriesId = String(task._id);
      if (typeof task.recurrenceEnabled !== "boolean") patch.recurrenceEnabled = true;
      if (typeof task.skipNextRecurrence !== "boolean") patch.skipNextRecurrence = false;
      if (typeof task.remindersEnabled !== "boolean") patch.remindersEnabled = false;

      if (Object.keys(patch).length) {
        await ctx.db.patch(task._id, patch);
        updated += 1;
      }
    }
    await ctx.db.insert("events", {
      type: "task.backfill",
      occurredAt: now,
      idempotencyKey: `tasks.backfill:${now}`,
      payload: { updated },
    });
    return { updated };
  },
});
