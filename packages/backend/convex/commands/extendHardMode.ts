import { ConvexError, v } from "convex/values";
import { makeFunctionReference } from "convex/server";
import type { Id } from "../_generated/dataModel";

import { mutation } from "../_generated/server";

const generateHardModePlanRef = makeFunctionReference<
  "action",
  { sessionId: Id<"hardModeSessions">; dayStart: number },
  { generated: boolean }
>("actions/generateHardModePlan:generateHardModePlan");

function startOfUtcDay(timestamp: number) {
  const date = new Date(timestamp);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

export const extendHardMode = mutation({
  args: {
    idempotencyKey: v.string(),
    sessionId: v.id("hardModeSessions"),
    extendDays: v.number(),
    confirmExtend: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (existing) {
      return { extended: true, deduplicated: true };
    }

    if (!args.confirmExtend) {
      throw new ConvexError("Explicit extend confirmation is required");
    }

    if (!Number.isInteger(args.extendDays) || args.extendDays < 1 || args.extendDays > 14) {
      throw new ConvexError("extendDays must be an integer between 1 and 14");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.isActive) {
      throw new ConvexError("Active hard mode session not found");
    }

    const extensionMs = args.extendDays * 24 * 60 * 60 * 1000;
    const newWindowEnd = session.windowEnd + extensionMs;
    const now = Date.now();
    const previousEndDayStart = startOfUtcDay(session.windowEnd);

    await ctx.db.patch(args.sessionId, {
      windowEnd: newWindowEnd,
    });

    for (let day = 1; day <= args.extendDays; day += 1) {
      const dayStart = previousEndDayStart + day * 24 * 60 * 60 * 1000;
      await ctx.scheduler.runAt(dayStart, generateHardModePlanRef, {
        sessionId: args.sessionId,
        dayStart,
      });
    }

    await ctx.db.insert("events", {
      type: "hardMode.extended",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        sessionId: args.sessionId,
        newWindowEnd,
      },
    });

    return { extended: true, deduplicated: false, newWindowEnd };
  },
});
