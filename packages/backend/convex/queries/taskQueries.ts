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

export const filteredTasks = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("inbox"),
        v.literal("focus"),
        v.literal("deferred"),
        v.literal("completed"),
        v.literal("abandoned"),
      ),
    ),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    dueBucket: v.optional(v.union(v.literal("all"), v.literal("today"), v.literal("overdue"), v.literal("none"))),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db.query("tasks").collect();
    const now = Date.now();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return tasks
      .filter((task) => (args.status ? task.status === args.status : true))
      .filter((task) => (args.priority ? task.priority === args.priority : true))
      .filter((task) => {
        if (!args.search?.trim()) return true;
        const q = args.search.trim().toLowerCase();
        return task.title.toLowerCase().includes(q) || (task.note || "").toLowerCase().includes(q);
      })
      .filter((task) => {
        const bucket = args.dueBucket || "all";
        if (bucket === "all") return true;
        if (bucket === "none") return !task.dueAt;
        if (!task.dueAt) return false;
        if (bucket === "today") return task.dueAt >= start.getTime() && task.dueAt <= end.getTime();
        return task.dueAt < now;
      })
      .sort((a, b) => (a.dueAt ?? Number.MAX_SAFE_INTEGER) - (b.dueAt ?? Number.MAX_SAFE_INTEGER));
  },
});

export const taskTimeBlockSuggestions = query({
  args: {
    startAt: v.optional(v.number()),
    horizonMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db.query("tasks").collect();
    const candidates = tasks
      .filter((task) => task.status === "focus" || task.status === "inbox")
      .filter((task) => !task.blockedByTaskId)
      .sort((a, b) => {
        const priorityRank = { high: 0, medium: 1, low: 2 } as const;
        const ap = priorityRank[(a.priority || "medium") as keyof typeof priorityRank];
        const bp = priorityRank[(b.priority || "medium") as keyof typeof priorityRank];
        if (ap !== bp) return ap - bp;
        return (a.dueAt ?? Number.MAX_SAFE_INTEGER) - (b.dueAt ?? Number.MAX_SAFE_INTEGER);
      });

    const start = args.startAt ?? Date.now();
    const horizon = Math.min(Math.max(args.horizonMinutes ?? 180, 30), 8 * 60);
    let cursor = start;
    const end = start + horizon * 60 * 1000;
    const suggestions: Array<{
      taskId: string;
      title: string;
      startAt: number;
      endAt: number;
      estimateMinutes: number;
      priority?: "low" | "medium" | "high";
    }> = [];

    for (const task of candidates) {
      const estimateMinutes = Math.min(Math.max(task.estimateMinutes ?? 30, 10), 120);
      const nextEnd = cursor + estimateMinutes * 60 * 1000;
      if (nextEnd > end) break;
      suggestions.push({
        taskId: String(task._id),
        title: task.title,
        startAt: cursor,
        endAt: nextEnd,
        estimateMinutes,
        priority: task.priority,
      });
      cursor = nextEnd;
    }

    return suggestions;
  },
});

export const taskOnTimeMetrics = query({
  args: {
    windowDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const windowDays = Math.min(Math.max(args.windowDays ?? 30, 7), 120);
    const since = Date.now() - windowDays * 24 * 60 * 60 * 1000;
    const tasks = await ctx.db.query("tasks").collect();
    const completed = tasks.filter(
      (task) => typeof task.completedAt === "number" && task.completedAt >= since,
    );
    const withDue = completed.filter((task) => typeof task.dueAt === "number");
    const onTime = withDue.filter((task) => (task.completedAt as number) <= (task.dueAt as number)).length;
    const overdueCompletions = withDue.length - onTime;
    return {
      windowDays,
      completed: completed.length,
      completedWithDue: withDue.length,
      onTimeCompleted: onTime,
      overdueCompletions,
      onTimeRatePct: withDue.length > 0 ? Math.round((onTime / withDue.length) * 100) : 0,
    };
  },
});

export const taskDataHealth = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    const missingUpdatedAt = tasks.filter((task) => !task.updatedAt).length;
    const missingPriority = tasks.filter((task) => !task.priority).length;
    const recurringWithoutSeries = tasks.filter((task) => task.recurrence && !task.seriesId).length;
    const invalidDependencies = tasks.filter(
      (task) =>
        !!task.blockedByTaskId &&
        !tasks.find((candidate) => String(candidate._id) === String(task.blockedByTaskId)),
    ).length;
    return {
      totalTasks: tasks.length,
      missingUpdatedAt,
      missingPriority,
      recurringWithoutSeries,
      invalidDependencies,
    };
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
