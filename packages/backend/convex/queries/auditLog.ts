import { v } from "convex/values";
import { query } from "../_generated/server";

const MODULE_TYPES = [
  "habit",
  "checkin",
  "task",
  "review",
  "finance",
  "pattern",
  "suggestion",
  "hardmode",
] as const;
const MODULE_TYPE_VALIDATORS = MODULE_TYPES.map((module) => v.literal(module));

export const allEvents = query({
  args: {
    module: v.optional(v.union(...MODULE_TYPE_VALIDATORS)),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const offset = args.offset ?? 0;

    let events = await ctx.db
      .query("events")
      .collect();

    events = events.sort((a, b) => b.occurredAt - a.occurredAt);

    const modulePrefix = args.module;
    if (modulePrefix) {
      events = events.filter((e) => e.type.startsWith(modulePrefix));
    }

    return events.slice(offset, offset + limit);
  },
});

export const eventsByModule = query({
  args: {
    module: v.union(...MODULE_TYPE_VALIDATORS),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const prefix = args.module;

    const events = await ctx.db
      .query("events")
      .collect();

    return events
      .sort((a, b) => b.occurredAt - a.occurredAt)
      .filter((e) => e.type.startsWith(prefix))
      .slice(0, limit);
  },
});

export const eventCount = query({
  args: {
    module: v.optional(v.union(...MODULE_TYPE_VALIDATORS)),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const events = await ctx.db.query("events").collect();

    const modulePrefix = args.module;
    if (modulePrefix) {
      return events.filter((e) => e.type.startsWith(modulePrefix)).length;
    }

    return events.length;
  },
});

export const exportEvents = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    module: v.optional(v.union(...MODULE_TYPE_VALIDATORS)),
  },
  handler: async (ctx, args) => {
    let events = await ctx.db
      .query("events")
      .collect();

    events = events.sort((a, b) => b.occurredAt - a.occurredAt);

    const startDate = args.startDate;
    if (typeof startDate === "number") {
      events = events.filter((e) => e.occurredAt >= startDate);
    }

    const endDate = args.endDate;
    if (typeof endDate === "number") {
      events = events.filter((e) => e.occurredAt <= endDate);
    }

    const modulePrefix = args.module;
    if (modulePrefix) {
      events = events.filter((e) => e.type.startsWith(modulePrefix));
    }

    return events.map((e) => ({
      type: e.type,
      occurredAt: e.occurredAt,
      occurredAtISO: new Date(e.occurredAt).toISOString(),
      idempotencyKey: e.idempotencyKey,
      payload: e.payload,
    }));
  },
});
