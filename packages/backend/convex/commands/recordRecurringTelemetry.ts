import { v } from "convex/values";

import { internalMutation } from "../_generated/server";

export const recordRecurringTelemetry = internalMutation({
  args: {
    processed: v.number(),
    skippedDueToLimit: v.number(),
    dueCount: v.number(),
    maxExecutions: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("events", {
      type: "finance.recurring.runTelemetry",
      occurredAt: Date.now(),
      idempotencyKey: `finance.recurring.telemetry:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      payload: {
        processed: args.processed,
        skippedDueToLimit: args.skippedDueToLimit,
        dueCount: args.dueCount,
        maxExecutions: args.maxExecutions,
      },
    });
    return { recorded: true };
  },
});
