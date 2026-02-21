import { applyHardModeFlagToPlan } from "@seila/domain-kernel";
import { v } from "convex/values";

import { mutation } from "../_generated/server";
import { hardModeFlagValidator } from "../hardMode/validators";

export const flagItem = mutation({
  args: {
    idempotencyKey: v.string(),
    sessionId: v.id("hardModeSessions"),
    itemId: v.string(),
    flag: hardModeFlagValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (existing) {
      return { applied: true, deduplicated: true };
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.plan) {
      return { applied: false, deduplicated: false };
    }

    const now = Date.now();
    const nextPlan = applyHardModeFlagToPlan(session.plan, args.itemId, args.flag, now);

    await ctx.db.patch(args.sessionId, {
      plan: nextPlan,
    });

    await ctx.db.insert("events", {
      type: "hardMode.itemFlagged",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        sessionId: args.sessionId,
        itemId: args.itemId,
        flag: args.flag,
      },
    });

    await ctx.db.insert("events", {
      type: "hardMode.planCorrected",
      occurredAt: now,
      idempotencyKey: `${args.idempotencyKey}:corrected`,
      payload: {
        sessionId: args.sessionId,
        flag: args.flag,
        itemId: args.itemId,
      },
    });

    return { applied: true, deduplicated: false };
  },
});
