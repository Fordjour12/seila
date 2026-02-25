import { internalQuery, query } from "../_generated/server";
import { v } from "convex/values";

export const todayFocus = query({
  args: {},
  handler: async (ctx) => {
    const focusTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "focus"))
      .order("asc")
      .take(3);

    return focusTasks.sort((a, b) => {
      const priorityRank = { high: 0, medium: 1, low: 2 } as const;
      const ap = priorityRank[(a.priority || "medium") as keyof typeof priorityRank];
      const bp = priorityRank[(b.priority || "medium") as keyof typeof priorityRank];
      if (ap !== bp) return ap - bp;
      const ad = a.dueAt ?? Number.MAX_SAFE_INTEGER;
      const bd = b.dueAt ?? Number.MAX_SAFE_INTEGER;
      return ad - bd;
    });
  },
});

export const inbox = query({
  args: {},
  handler: async (ctx) => {
    const inboxTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "inbox"))
      .order("desc")
      .collect();

    return inboxTasks.sort((a, b) => {
      const ad = a.dueAt ?? Number.MAX_SAFE_INTEGER;
      const bd = b.dueAt ?? Number.MAX_SAFE_INTEGER;
      if (ad !== bd) return ad - bd;
      return b.createdAt - a.createdAt;
    });
  },
});

export const deferred = query({
  args: {},
  handler: async (ctx) => {
    const deferredTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "deferred"))
      .order("desc")
      .collect();

    return deferredTasks.sort((a, b) => {
      const ad = a.deferredUntil ?? Number.MAX_SAFE_INTEGER;
      const bd = b.deferredUntil ?? Number.MAX_SAFE_INTEGER;
      return ad - bd;
    });
  },
});

export const doneRecently = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    return tasks
      .filter((task) => task.status === "completed" || task.status === "abandoned")
      .sort((a, b) => {
        const at = a.completedAt || a.abandonedAt || a.updatedAt || 0;
        const bt = b.completedAt || b.abandonedAt || b.updatedAt || 0;
        return bt - at;
      })
      .slice(0, 20);
  },
});

export const taskHistory = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db.query("events").collect();
    return events
      .filter((event) => event.type.startsWith("task."))
      .filter((event) => {
        const payload = event.payload as { id?: unknown } | null;
        return payload && payload.id === args.taskId;
      })
      .sort((a, b) => b.occurredAt - a.occurredAt)
      .map((event) => ({
        type: event.type,
        occurredAt: event.occurredAt,
        payload: event.payload,
      }));
  },
});

export const internalInbox = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "inbox"))
      .order("desc")
      .collect();
  },
});

export const taskById = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  },
});
