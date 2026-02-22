import { v } from "convex/values";

import { mutation } from "../../_generated/server";

export const triageScratchpad = mutation({
  args: {
    idempotencyKey: v.string(),
    entryId: v.id("scratchpadEntries"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (existing) {
      return { triaged: true, deduplicated: true };
    }

    const entry = await ctx.db.get(args.entryId);
    if (!entry || entry.triagedAt) {
      return { triaged: true, deduplicated: false };
    }

    const now = Date.now();
    await ctx.db.patch(args.entryId, { triagedAt: now });

    await ctx.db.insert("events", {
      type: "scratchpad.triaged",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        entryId: args.entryId,
      },
    });

    return { triaged: true, deduplicated: false };
  },
});
