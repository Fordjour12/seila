import type { HabitCadence } from "@seila/domain-kernel";
import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";
import {
  anchorValidator,
  appendHabitEvent,
  assertValidCustomCadence,
  cadenceValidator,
  difficultyValidator,
  getDedupedEventByIdempotencyKey,
  syncHabitProjection,
} from "../../habits/shared";

export const createHabit = mutation({
  args: {
    idempotencyKey: v.string(),
    name: v.string(),
    cadence: cadenceValidator,
    anchor: v.optional(anchorValidator),
    difficulty: v.optional(difficultyValidator),
  },
  handler: async (ctx, args) => {
    const existing = await getDedupedEventByIdempotencyKey(ctx, args.idempotencyKey);
    if (existing) {
      if (typeof existing.payload === "object" && existing.payload !== null) {
        const habitId = (existing.payload as { habitId?: unknown }).habitId;
        if (typeof habitId === "string") {
          return {
            habitId,
            deduplicated: true,
          };
        }
      }
      throw new ConvexError("Duplicate idempotency key already used by another command");
    }

    const name = args.name.trim();
    if (!name) {
      throw new ConvexError("Habit name cannot be empty");
    }

    assertValidCustomCadence(args.cadence as HabitCadence);

    const now = Date.now();
    const habitId = await ctx.db.insert("habits", {
      name,
      cadence: args.cadence,
      anchor: args.anchor,
      difficulty: args.difficulty,
      createdAt: now,
      updatedAt: now,
    });

    const habitIdString = habitId as unknown as string;
    await appendHabitEvent(ctx, {
      type: "habit.created",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        habitId: habitIdString,
        name,
        cadence: args.cadence,
        anchor: args.anchor,
        difficulty: args.difficulty,
      },
      meta: {},
    });

    await syncHabitProjection(ctx, habitId);

    return {
      habitId: habitIdString,
      deduplicated: false,
    };
  },
});
