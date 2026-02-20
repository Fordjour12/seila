import { v } from "convex/values";
import { jsonPayloadObjectValidator } from "./lib/payloadValidators";

import { mutation, query } from "./_generated/server";

export const count = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const events = await ctx.db.query("events").collect();
    return events.length;
  },
});

export const appendTestEvent = mutation({
  args: {
    type: v.optional(v.string()),
    idempotencyKey: v.string(),
    payload: v.optional(jsonPayloadObjectValidator),
  },
  returns: v.id("events"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("events", {
      type: args.type ?? "test.event",
      occurredAt: Date.now(),
      idempotencyKey: args.idempotencyKey,
      payload: args.payload ?? { source: "native" },
    });
  },
});
