import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";
import { appendHabitEvent, getDedupedEventByIdempotencyKey, syncHabitProjection } from "../../habits/shared";

export const restoreArchivedHabit = mutation({
  args: {
    idempotencyKey: v.string(),
    habitId: v.id("habits"),
  },
  handler: async (ctx, args) => {
    const existing = await getDedupedEventByIdempotencyKey(ctx, args.idempotencyKey);
    if (existing) {
      if (typeof existing.payload === "object" && existing.payload !== null) {
        const restoredHabitId = (existing.payload as { restoredHabitId?: unknown }).restoredHabitId;
        if (typeof restoredHabitId === "string") {
          return { restoredHabitId, deduplicated: true };
        }
      }
      return { restoredHabitId: args.habitId as unknown as string, deduplicated: true };
    }

    const archived = await ctx.db.get(args.habitId);
    if (!archived || !archived.archivedAt) {
      throw new ConvexError("Archived habit not found");
    }

    const now = Date.now();
    const restoredHabitId = await ctx.db.insert("habits", {
      name: archived.name,
      cadence: archived.cadence,
      anchor: archived.anchor,
      difficulty: archived.difficulty,
      kind: archived.kind,
      targetValue: archived.targetValue,
      targetUnit: archived.targetUnit,
      timezone: archived.timezone,
      startDayKey: archived.startDayKey,
      endDayKey: archived.endDayKey,
      createdAt: now,
      updatedAt: now,
    });

    await appendHabitEvent(ctx, {
      type: "habit.created",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        habitId: restoredHabitId as unknown as string,
        name: archived.name,
        cadence: archived.cadence,
        anchor: archived.anchor,
        difficulty: archived.difficulty,
        kind: archived.kind,
        targetValue: archived.targetValue,
        targetUnit: archived.targetUnit,
        timezone: archived.timezone,
        startDayKey: archived.startDayKey,
        endDayKey: archived.endDayKey,
      },
      meta: {},
    });

    await syncHabitProjection(ctx, restoredHabitId);

    return {
      restoredHabitId: restoredHabitId as unknown as string,
      deduplicated: false,
    };
  },
});
