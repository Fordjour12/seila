import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";

export const eventsByDateRange = query({
  args: {
    since: v.number(),
    until: v.number(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db.query("events").collect();

    return events.filter((e) => e.occurredAt >= args.since && e.occurredAt <= args.until);
  },
});

export const recentCheckinsForWeeklySummary = query({
  args: {
    since: v.number(),
    until: v.number(),
  },
  handler: async (ctx, args) => {
    const checkins = await ctx.db
      .query("checkins")
      .withIndex("by_occurredAt", (q) => q.gte("occurredAt", args.since))
      .collect();

    return checkins.filter((c) => c.occurredAt <= args.until);
  },
});

export const habitsForWeeklySummary = query({
  args: {
    since: v.number(),
  },
  handler: async (ctx, args) => {
    const habits = await ctx.db.query("habits").collect();
    return habits.filter((h) => !h.archivedAt && h.createdAt <= args.since);
  },
});

export const tasksForWeeklySummary = query({
  args: {
    since: v.number(),
    until: v.number(),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", args.since))
      .collect();

    return tasks.filter(
      (t) =>
        t.createdAt <= args.until ||
        t.completedAt ||
        t.abandonedAt
    );
  },
});

export const internalEventsByDateRange = internalQuery({
  args: {
    since: v.number(),
    until: v.number(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db.query("events").collect();
    return events.filter((e) => e.occurredAt >= args.since && e.occurredAt <= args.until);
  },
});

export const internalCheckinsForWeeklySummary = internalQuery({
  args: {
    since: v.number(),
    until: v.number(),
  },
  handler: async (ctx, args) => {
    const checkins = await ctx.db
      .query("checkins")
      .withIndex("by_occurredAt", (q) => q.gte("occurredAt", args.since))
      .collect();
    return checkins.filter((c) => c.occurredAt <= args.until);
  },
});
