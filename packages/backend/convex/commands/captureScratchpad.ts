import { ConvexError, v } from "convex/values";

import { mutation } from "../_generated/server";

export const captureScratchpad = mutation({
  args: {
    idempotencyKey: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (existing) {
      return { captured: true, deduplicated: true };
    }

    const text = args.text.trim();
    if (!text) {
      throw new ConvexError("Scratchpad text cannot be empty");
    }

    const now = Date.now();
    const entryId = await ctx.db.insert("scratchpadEntries", {
      text,
      createdAt: now,
    });

    await ctx.db.insert("events", {
      type: "scratchpad.captured",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        entryId,
      },
    });

    return { captured: true, deduplicated: false, entryId };
  },
});
