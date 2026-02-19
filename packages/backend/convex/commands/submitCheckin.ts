import { v } from "convex/values";
import { mutation } from "../_generated/server";

const checkinFlags = v.array(
  v.union(
    v.literal("anxious"),
    v.literal("grateful"),
    v.literal("overwhelmed"),
    v.literal("calm"),
    v.literal("tired"),
    v.literal("motivated"),
    v.literal("stressed"),
    v.literal("peaceful"),
    v.literal("isolated"),
    v.literal("connected"),
    v.literal("uncertain"),
    v.literal("focused"),
  ),
);

const weeklyAnswers = v.object({
  feltGood: v.string(),
  feltHard: v.string(),
  carryForward: v.string(),
  aiSuggested: v.optional(v.string()),
});

export const submitCheckin = mutation({
  args: {
    idempotencyKey: v.string(),
    type: v.union(v.literal("daily"), v.literal("weekly")),
    mood: v.union(v.literal(1), v.literal(2), v.literal(3), v.literal(4), v.literal(5)),
    energy: v.union(v.literal(1), v.literal(2), v.literal(3), v.literal(4), v.literal(5)),
    flags: checkinFlags,
    note: v.optional(v.string()),
    weeklyAnswers: v.optional(weeklyAnswers),
  },
  returns: v.id("checkins"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (existing) {
      throw new Error("Duplicate check-in submission");
    }

    const occurredAt = Date.now();

    const checkinId = await ctx.db.insert("checkins", {
      type: args.type,
      mood: args.mood,
      energy: args.energy,
      flags: args.flags,
      note: args.note,
      occurredAt,
      weeklyAnswers: args.weeklyAnswers,
    });

    await ctx.db.insert("events", {
      type: "checkin.submitted",
      occurredAt,
      idempotencyKey: args.idempotencyKey,
      payload: {
        id: checkinId,
        type: args.type,
        mood: args.mood,
        energy: args.energy,
        flags: args.flags,
        note: args.note,
        weeklyAnswers: args.weeklyAnswers,
      },
    });

    return checkinId;
  },
});
