import { internalQuery, query } from "../_generated/server";

export const todayFocus = query({
  args: {},
  handler: async (ctx) => {
    const focusTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "focus"))
      .order("asc")
      .take(3);

    return focusTasks;
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

    return inboxTasks;
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

    return deferredTasks;
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
