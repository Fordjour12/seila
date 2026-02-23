import { ConvexError, v } from "convex/values";

import { internalMutation, mutation } from "../../_generated/server";

export const setEnvelope = mutation({
  args: {
    idempotencyKey: v.string(),
    envelopeId: v.optional(v.id("envelopes")),
    name: v.string(),
    softCeiling: v.optional(v.number()),
    emoji: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const dedupe = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (dedupe) {
      return {
        deduplicated: true,
      };
    }

    const name = args.name.trim();
    if (!name) {
      throw new ConvexError("Envelope name cannot be empty");
    }

    const now = Date.now();

    if (args.envelopeId) {
      const existing = await ctx.db.get(args.envelopeId);
      if (!existing) {
        throw new ConvexError("Envelope not found");
      }

      await ctx.db.patch(args.envelopeId, {
        name,
        softCeiling: args.softCeiling,
        emoji: args.emoji,
        isPrivate: args.isPrivate ?? existing.isPrivate,
        updatedAt: now,
      });

      await ctx.db.insert("events", {
        type: "finance.envelopeCeilingUpdated",
        occurredAt: now,
        idempotencyKey: args.idempotencyKey,
        payload: {
          envelopeId: args.envelopeId,
          ...(args.softCeiling !== undefined ? { softCeiling: args.softCeiling } : {}),
        },
      });

      return {
        envelopeId: args.envelopeId,
        deduplicated: false,
      };
    }

    const envelopeId = await ctx.db.insert("envelopes", {
      name,
      softCeiling: args.softCeiling,
      emoji: args.emoji,
      isPrivate: args.isPrivate ?? false,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("events", {
      type: "finance.envelopeCreated",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        envelopeId,
        name,
        ...(args.softCeiling !== undefined ? { softCeiling: args.softCeiling } : {}),
        ...(args.emoji ? { emoji: args.emoji } : {}),
        isPrivate: args.isPrivate ?? false,
      },
    });

    return {
      envelopeId,
      deduplicated: false,
    };
  },
});

export const deleteEnvelope = mutation({
  args: {
    envelopeId: v.id("envelopes"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.envelopeId);
    if (!existing) {
      throw new ConvexError("Envelope not found");
    }

    await ctx.db.delete(args.envelopeId);

    await ctx.db.insert("events", {
      type: "finance.envelopeDeleted",
      occurredAt: Date.now(),
      idempotencyKey: `delete-envelope:${args.envelopeId}:${Date.now()}`,
      payload: {
        envelopeId: args.envelopeId,
        name: existing.name,
      },
    });

    return { deleted: true };
  },
});
