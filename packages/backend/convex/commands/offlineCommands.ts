import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { jsonPayloadObjectValidator } from "../lib/payloadValidators";

export const processQueuedCommands = mutation({
  args: {
    commands: v.array(
      v.object({
        type: v.string(),
        payload: jsonPayloadObjectValidator,
        idempotencyKey: v.string(),
      }),
    ),
  },
  returns: v.object({
    processed: v.number(),
    failed: v.number(),
  }),
  handler: async (ctx, args) => {
    let processed = 0;
    let failed = 0;

    for (const cmd of args.commands) {
      try {
        const existing = await ctx.db
          .query("events")
          .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", cmd.idempotencyKey))
          .first();

        if (existing) {
          processed++;
          continue;
        }

        await ctx.db.insert("events", {
          type: cmd.type,
          occurredAt: Date.now(),
          idempotencyKey: cmd.idempotencyKey,
          payload: cmd.payload,
        });

        processed++;
      } catch (error) {
        console.error("Failed to process queued command:", cmd, error);
        failed++;
      }
    }

    return { processed, failed };
  },
});
