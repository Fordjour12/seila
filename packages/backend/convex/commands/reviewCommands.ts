import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { internalMutation, mutation } from "../_generated/server";

function getWeekBounds(): { weekStart: number; weekEnd: number } {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(now);
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return {
    weekStart: weekStart.getTime(),
    weekEnd: weekEnd.getTime(),
  };
}

export const startReview = mutation({
  args: {
    idempotencyKey: v.string(),
  },
  returns: v.id("reviews"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (existing) {
      const payload = existing.payload as { id?: unknown };
      if (payload.id) {
        return payload.id as Id<"reviews">;
      }
      throw new Error("Duplicate review start");
    }

    const { weekStart, weekEnd } = getWeekBounds();
    const occurredAt = Date.now();

    const reviewId = await ctx.db.insert("reviews", {
      weekStart,
      weekEnd,
      phase: "lookback",
      intentions: [],
      summaryGenerated: false,
      createdAt: occurredAt,
    });

    await ctx.db.insert("events", {
      type: "review.started",
      occurredAt,
      idempotencyKey: args.idempotencyKey,
      payload: {
        id: reviewId,
        weekStart,
        weekEnd,
      },
    });

    await ctx.scheduler.runAfter(
      0,
      internal.actions.generateWeeklySummary.generateWeeklySummary,
      {
        reviewId,
        weekStart,
        weekEnd,
      },
    );

    return reviewId;
  },
});

export const submitReflection = mutation({
  args: {
    idempotencyKey: v.string(),
    reviewId: v.id("reviews"),
    feltGood: v.string(),
    feltHard: v.string(),
    carryForward: v.string(),
    aiSuggested: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (existing) {
      return { success: true, deduplicated: true };
    }

    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    const occurredAt = Date.now();

    await ctx.db.patch(args.reviewId, {
      phase: "reflect",
      feltGood: args.feltGood,
      feltHard: args.feltHard,
      carryForward: args.carryForward,
      aiSuggested: args.aiSuggested,
    });

    await ctx.db.insert("events", {
      type: "review.reflectionSubmitted",
      occurredAt,
      idempotencyKey: args.idempotencyKey,
      payload: {
        id: args.reviewId,
        feltGood: args.feltGood,
        feltHard: args.feltHard,
        carryForward: args.carryForward,
        aiSuggested: args.aiSuggested,
      },
    });

    return { success: true, deduplicated: false };
  },
});

export const setIntentions = mutation({
  args: {
    idempotencyKey: v.string(),
    reviewId: v.id("reviews"),
    intentions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (existing) {
      return { success: true, deduplicated: true };
    }

    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    const occurredAt = Date.now();

    await ctx.db.patch(args.reviewId, {
      phase: "intentions",
      intentions: args.intentions,
    });

    await ctx.db.insert("events", {
      type: "review.intentionsSet",
      occurredAt,
      idempotencyKey: args.idempotencyKey,
      payload: {
        id: args.reviewId,
        intentions: args.intentions,
      },
    });

    return { success: true, deduplicated: false };
  },
});

export const closeReview = mutation({
  args: {
    idempotencyKey: v.string(),
    reviewId: v.id("reviews"),
    summary: v.optional(v.string()),
    brightSpot: v.optional(v.string()),
    worthNoticing: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (existing) {
      return { success: true, deduplicated: true };
    }

    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    const occurredAt = Date.now();

    const summaryPatch: {
      summary?: string;
      brightSpot?: string;
      worthNoticing?: string;
    } = {};

    if (typeof args.summary === "string") {
      summaryPatch.summary = args.summary;
    }
    if (typeof args.brightSpot === "string") {
      summaryPatch.brightSpot = args.brightSpot;
    }
    if (typeof args.worthNoticing === "string") {
      summaryPatch.worthNoticing = args.worthNoticing;
    }

    await ctx.db.patch(args.reviewId, {
      phase: "closed",
      closedAt: occurredAt,
      summaryGenerated: true,
      ...summaryPatch,
    });

    await ctx.db.insert("events", {
      type: "review.closed",
      occurredAt,
      idempotencyKey: args.idempotencyKey,
      payload: {
        id: args.reviewId,
        summaryGenerated: true,
      },
    });

    return { success: true, deduplicated: false };
  },
});

export const skipReview = mutation({
  args: {
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (existing) {
      return { success: true, deduplicated: true };
    }

    const { weekStart, weekEnd } = getWeekBounds();
    const occurredAt = Date.now();

    const activeReview = (await ctx.db.query("reviews").collect())
      .filter((review) => review.phase !== "closed")
      .sort((a, b) => b.createdAt - a.createdAt)[0];

    if (activeReview) {
      await ctx.db.patch(activeReview._id, {
        phase: "closed",
        skippedAt: occurredAt,
        closedAt: occurredAt,
      });
    }

    await ctx.db.insert("events", {
      type: "review.skipped",
      occurredAt,
      idempotencyKey: args.idempotencyKey,
      payload: {
        weekStart,
        weekEnd,
      },
    });

    return { success: true, deduplicated: false };
  },
});

export const applyGeneratedSummary = internalMutation({
  args: {
    reviewId: v.id("reviews"),
    bullets: v.array(v.string()),
    brightSpot: v.string(),
    worthNoticing: v.string(),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);
    if (!review || review.phase !== "lookback") {
      return { updated: false };
    }

    await ctx.db.patch(args.reviewId, {
      summaryGenerated: true,
      summary: args.bullets.join("\n"),
      brightSpot: args.brightSpot,
      worthNoticing: args.worthNoticing,
    });

    return { updated: true };
  },
});
