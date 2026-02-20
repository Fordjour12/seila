import { v } from "convex/values";

import { internalMutation, internalQuery, query } from "../_generated/server";

export const activePatterns = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const patterns = await ctx.db
      .query("patterns")
      .withIndex("by_dismissed_at", (q) => q.eq("dismissedAt", undefined))
      .collect();

    return patterns
      .filter((pattern) => pattern.pinnedAt || pattern.expiresAt > now)
      .sort((a, b) => {
        const aPinned = typeof a.pinnedAt === "number";
        const bPinned = typeof b.pinnedAt === "number";

        if (aPinned !== bPinned) {
          return aPinned ? -1 : 1;
        }

        if (aPinned && bPinned && a.pinnedAt !== b.pinnedAt) {
          return (b.pinnedAt ?? 0) - (a.pinnedAt ?? 0);
        }

        if (b.confidence !== a.confidence) {
          return b.confidence - a.confidence;
        }

        return b.detectedAt - a.detectedAt;
      })
      .slice(0, 3);
  },
});

export const getRecentEventsForPatterns = internalQuery({
  args: {
    since: v.number(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db.query("events").collect();

    return events
      .filter((event) => event.occurredAt >= args.since)
      .map((event) => ({
        type: event.type,
        occurredAt: event.occurredAt,
      }));
  },
});

export const getRecentCheckinsForPatterns = internalQuery({
  args: {
    since: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("checkins")
      .withIndex("by_occurredAt", (q) => q.gte("occurredAt", args.since))
      .collect()
      .then((checkins) =>
        checkins.map((checkin) => ({
          mood: checkin.mood,
          energy: checkin.energy,
          occurredAt: checkin.occurredAt,
        })),
      );
  },
});

export const getRecentTransactionsForPatterns = internalQuery({
  args: {
    since: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_occurred_at", (q) => q.gte("occurredAt", args.since))
      .collect()
      .then((transactions) =>
        transactions.map((transaction) => ({
          amount: transaction.amount,
          occurredAt: transaction.occurredAt,
          pendingImport: transaction.pendingImport,
          voidedAt: transaction.voidedAt,
        })),
      );
  },
});

export const upsertDetectedPattern = internalMutation({
  args: {
    type: v.union(
      v.literal("mood_habit"),
      v.literal("energy_checkin_timing"),
      v.literal("spending_mood"),
    ),
    correlation: v.number(),
    confidence: v.number(),
    headline: v.string(),
    subtext: v.string(),
    detectedAt: v.number(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const activeOfType = await ctx.db
      .query("patterns")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();

    const existing = activeOfType
      .filter((pattern) => !pattern.dismissedAt)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0];

    if (existing) {
      await ctx.db.patch(existing._id, {
        correlation: args.correlation,
        confidence: args.confidence,
        headline: args.headline,
        subtext: args.subtext,
        detectedAt: args.detectedAt,
        expiresAt: args.expiresAt,
        updatedAt: Date.now(),
      });

      await ctx.db.insert("events", {
        type: "pattern.detected",
        occurredAt: args.detectedAt,
        idempotencyKey: `pattern.detected:${existing._id}:${args.detectedAt}`,
        payload: {
          patternId: existing._id,
          type: args.type,
          correlation: args.correlation,
          confidence: args.confidence,
          headline: args.headline,
          subtext: args.subtext,
        },
      });

      return {
        created: false,
        patternId: existing._id,
      };
    }

    const patternId = await ctx.db.insert("patterns", {
      type: args.type,
      correlation: args.correlation,
      confidence: args.confidence,
      headline: args.headline,
      subtext: args.subtext,
      detectedAt: args.detectedAt,
      surfacedAt: args.detectedAt,
      expiresAt: args.expiresAt,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("events", {
      type: "pattern.detected",
      occurredAt: args.detectedAt,
      idempotencyKey: `pattern.detected:${patternId}:${args.detectedAt}`,
      payload: {
        patternId,
        type: args.type,
        correlation: args.correlation,
        confidence: args.confidence,
        headline: args.headline,
        subtext: args.subtext,
      },
    });

    await ctx.db.insert("events", {
      type: "pattern.surfaced",
      occurredAt: args.detectedAt,
      idempotencyKey: `pattern.surfaced:${patternId}:${args.detectedAt}`,
      payload: {
        patternId,
      },
    });

    return {
      created: true,
      patternId,
    };
  },
});

export const expireOldPatterns = internalMutation({
  args: {
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const expired = await ctx.db
      .query("patterns")
      .withIndex("by_expires_at", (q) => q.lte("expiresAt", args.now))
      .collect();

    let dismissed = 0;

    for (const pattern of expired) {
      if (pattern.pinnedAt || pattern.dismissedAt) {
        continue;
      }

      await ctx.db.patch(pattern._id, {
        dismissedAt: args.now,
        updatedAt: args.now,
      });

      await ctx.db.insert("events", {
        type: "pattern.expired",
        occurredAt: args.now,
        idempotencyKey: `pattern.expired:${pattern._id}:${args.now}`,
        payload: {
          patternId: pattern._id,
        },
      });

      dismissed += 1;
    }

    return { dismissed };
  },
});

export const internalActivePatterns = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const patterns = await ctx.db
      .query("patterns")
      .withIndex("by_dismissed_at", (q) => q.eq("dismissedAt", undefined))
      .collect();

    return patterns
      .filter((pattern) => pattern.pinnedAt || pattern.expiresAt > now)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  },
});

export const getPatternByType = internalQuery({
  args: {
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const patterns = await ctx.db
      .query("patterns")
      .withIndex("by_type", (q) => q.eq("type", args.type as any))
      .collect();

    const active = patterns
      .filter((p) => !p.dismissedAt)
      .sort((a, b) => b.updatedAt - a.updatedAt);

    return active[0] ?? null;
  },
});
