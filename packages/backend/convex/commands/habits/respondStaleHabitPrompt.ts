import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";
import {
  appendHabitEvent,
  dayKeyValidator,
  getDedupedEventByIdempotencyKey,
  syncHabitProjection,
} from "../../habits/shared";

const DAY_MS = 24 * 60 * 60 * 1000;

function addDays(dayKey: string, days: number) {
  const [year, month, day] = dayKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const nextYear = date.getFullYear();
  const nextMonth = `${date.getMonth() + 1}`.padStart(2, "0");
  const nextDay = `${date.getDate()}`.padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export const respondStaleHabitPrompt = mutation({
  args: {
    idempotencyKey: v.string(),
    habitId: v.id("habits"),
    dayKey: dayKeyValidator,
    action: v.union(v.literal("keep"), v.literal("pause_30"), v.literal("archive")),
  },
  handler: async (ctx, args) => {
    const existing = await getDedupedEventByIdempotencyKey(ctx, args.idempotencyKey);
    if (existing) {
      return {
        habitId: args.habitId,
        deduplicated: true,
      };
    }

    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.archivedAt) {
      throw new ConvexError("Habit not found or archived");
    }

    const now = Date.now();

    if (args.action === "keep") {
      await ctx.db.patch(args.habitId, {
        stalePromptSnoozedUntil: now + 14 * DAY_MS,
      });
    }

    if (args.action === "pause_30") {
      await ctx.db.patch(args.habitId, {
        pausedUntilDayKey: addDays(args.dayKey, 30),
        stalePromptSnoozedUntil: now + 30 * DAY_MS,
      });
    }

    if (args.action === "archive") {
      await appendHabitEvent(ctx, {
        type: "habit.archived",
        occurredAt: now,
        idempotencyKey: args.idempotencyKey,
        payload: {
          habitId: args.habitId as unknown as string,
        },
        meta: {},
      });

      await syncHabitProjection(ctx, args.habitId);

      return {
        habitId: args.habitId,
        deduplicated: false,
      };
    }

    await ctx.db.insert("events", {
      type: "habit.stale_prompt_responded",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        habitId: args.habitId as unknown as string,
        action: args.action,
        dayKey: args.dayKey,
      },
    });

    return {
      habitId: args.habitId,
      deduplicated: false,
    };
  },
});
