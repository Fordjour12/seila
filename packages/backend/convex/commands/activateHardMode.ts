import type {
  HardModeConstraint,
  HardModePlan,
  HardModeScope,
} from "@seila/domain-kernel";
import type { Id } from "../_generated/dataModel";
import { makeFunctionReference } from "convex/server";
import { ConvexError, v } from "convex/values";

import { internalMutation, mutation } from "../_generated/server";
import {
  hardModeConstraintValidator,
  hardModePlanValidator,
  hardModeScopeValidator,
} from "../hardMode/validators";

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

function utcDayOffset(dayStart: number, offsetDays: number) {
  return dayStart + offsetDays * 24 * 60 * 60 * 1000;
}

export const activateHardMode = mutation({
  args: {
    idempotencyKey: v.string(),
    scope: hardModeScopeValidator,
    constraints: v.array(hardModeConstraintValidator),
    durationDays: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (existing) {
      const payload = existing.payload as { sessionId?: unknown };
      return {
        sessionId:
          typeof payload.sessionId === "string" ? payload.sessionId : undefined,
        deduplicated: true,
      };
    }

    if (!Number.isInteger(args.durationDays) || args.durationDays < 1 || args.durationDays > 14) {
      throw new ConvexError("durationDays must be an integer between 1 and 14");
    }

    const active = await ctx.db
      .query("hardModeSessions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();

    if (active) {
      throw new ConvexError("A hard mode session is already active");
    }

    const now = Date.now();
    const windowStart = now;
    const windowEnd = now + args.durationDays * 24 * 60 * 60 * 1000;

    const sessionId = await ctx.db.insert("hardModeSessions", {
      scope: args.scope,
      constraints: args.constraints,
      windowStart,
      windowEnd,
      isActive: true,
      createdAt: now,
    });

    await ctx.db.insert("events", {
      type: "hardMode.activated",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        sessionId,
        scope: args.scope,
        constraints: args.constraints,
        windowStart,
        windowEnd,
      },
    });

    const dayStart = startOfUtcDay(now);
    await ctx.scheduler.runAfter(0, generateHardModePlanRef, {
      sessionId,
      dayStart,
    });

    for (let day = 1; day < args.durationDays; day += 1) {
      await ctx.scheduler.runAt(utcDayOffset(dayStart, day), generateHardModePlanRef, {
        sessionId,
        dayStart: utcDayOffset(dayStart, day),
      });
    }

    return {
      sessionId,
      deduplicated: false,
    };
  },
});

export const applyGeneratedPlan = internalMutation({
  args: {
    sessionId: v.id("hardModeSessions"),
    plan: hardModePlanValidator,
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.isActive) {
      return { updated: false };
    }

    await ctx.db.patch(args.sessionId, {
      plan: args.plan,
    });

    await ctx.db.insert("events", {
      type: "hardMode.planGenerated",
      occurredAt: args.plan.generatedAt,
      idempotencyKey: `hardMode.planGenerated:${args.sessionId}:${args.plan.dayStart}`,
      payload: {
        sessionId: args.sessionId,
        plan: args.plan,
      },
    });

    return { updated: true };
  },
});
