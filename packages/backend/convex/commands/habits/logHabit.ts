import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";
import {
  appendHabitEvent,
  inferBreakGoal,
  inferBreakMetric,
  getDedupedEventByIdempotencyKey,
  syncHabitProjection,
  upsertHabitLog,
  dayKeyValidator,
  isHabitActiveOnDay,
} from "../../habits/shared";

export const logHabit = mutation({
  args: {
    idempotencyKey: v.string(),
    habitId: v.id("habits"),
    dayKey: dayKeyValidator,
    value: v.optional(v.number()),
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
    if (
      !isHabitActiveOnDay({
        dayKey: args.dayKey,
        startDayKey: habit.startDayKey,
        endDayKey: habit.endDayKey,
        pausedUntilDayKey: habit.pausedUntilDayKey,
      })
    ) {
      throw new ConvexError("Habit is outside its active date range");
    }

    const occurredAt = Date.now();
    const kind = habit.kind ?? "build";
    const targetType = habit.targetType ?? (typeof habit.targetValue === "number" ? "quantity" : "binary");
    const targetValue = habit.targetValue;
    const loggedValue = args.value;
    let completed = true;
    let nextValue = loggedValue;
    let status: "completed" | "skipped" = "completed";

    if (kind === "break") {
      const breakGoal = inferBreakGoal({ kind, breakGoal: habit.breakGoal, targetValue: habit.targetValue });
      const breakMetric = inferBreakMetric({
        breakMetric: habit.breakMetric,
        targetType,
        targetUnit: habit.targetUnit,
      });

      const currentLog = await ctx.db
        .query("habitLogs")
        .withIndex("by_habit_day", (q) => q.eq("habitId", args.habitId).eq("dayKey", args.dayKey))
        .first();

      const increment =
        typeof loggedValue === "number"
          ? loggedValue
          : breakMetric === "minutes"
            ? undefined
            : 1;
      if (increment === undefined || increment <= 0) {
        throw new ConvexError("A positive value is required for break logging");
      }

      const currentTotal = currentLog?.value ?? 0;
      nextValue = currentTotal + increment;
      const allowedLimit = breakGoal === "quit" ? 0 : (targetValue ?? 0);
      completed = nextValue <= allowedLimit;
      status = completed ? "completed" : "skipped";
    }

    if (kind === "build" && (targetType === "quantity" || targetType === "duration")) {
      if (typeof loggedValue !== "number") {
        throw new ConvexError("A value is required for quantity and duration habits");
      }
      if (typeof targetValue !== "number" || targetValue <= 0) {
        throw new ConvexError("Habit targetValue must be set for quantity and duration habits");
      }
      completed = loggedValue >= targetValue;
      status = completed ? "completed" : "skipped";
    }

    await appendHabitEvent(ctx, {
      type: completed ? "habit.completed" : "habit.skipped",
      occurredAt,
      idempotencyKey: args.idempotencyKey,
      payload: {
        habitId: args.habitId as unknown as string,
      },
      meta: {},
    });

    await upsertHabitLog(ctx, {
      habitId: args.habitId,
      dayKey: args.dayKey,
      status,
      occurredAt,
      value: nextValue,
      completed,
    });

    await ctx.db.patch(args.habitId, {
      lastEngagedAt: occurredAt,
      stalePromptSnoozedUntil: undefined,
    });

    await syncHabitProjection(ctx, args.habitId);

    return {
      habitId: args.habitId,
      deduplicated: false,
    };
  },
});
