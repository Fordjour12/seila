import { internalQuery, query } from "../_generated/server";
import { dayKeyValidator, isHabitActiveOnDay } from "../habits/shared";
import { replayHabitEvents } from "@seila/domain-kernel";
import { listHabitEvents } from "../habits/shared";

export const todayHabits = query({
  args: {
    dayKey: dayKeyValidator,
  },
  handler: async (ctx, args) => {
    const todayLogs = await ctx.db
      .query("habitLogs")
      .withIndex("by_day_key", (q) => q.eq("dayKey", args.dayKey))
      .collect();
    const logByHabitId = new Map(todayLogs.map((log) => [String(log.habitId), log]));
    const habitDocs = await ctx.db.query("habits").collect();

    return habitDocs
      .filter((habit) => !habit.archivedAt)
      .filter((habit) =>
        isHabitActiveOnDay({
          dayKey: args.dayKey,
          startDayKey: habit.startDayKey,
          endDayKey: habit.endDayKey,
          pausedUntilDayKey: habit.pausedUntilDayKey,
        }),
      )
      .map((habit) => {
        const today = logByHabitId.get(String(habit._id));

        return {
          habitId: habit._id,
          name: habit.name,
          cadence: habit.cadence,
          anchor: habit.anchor,
          difficulty: habit.difficulty,
          kind: habit.kind,
          targetValue: habit.targetValue,
          targetUnit: habit.targetUnit,
          timezone: habit.timezone,
          startDayKey: habit.startDayKey,
          endDayKey: habit.endDayKey,
          pausedUntilDayKey: habit.pausedUntilDayKey,
          todayStatus: today?.status,
          todayOccurredAt: today?.occurredAt,
          snoozedUntil: today?.snoozedUntil,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const internalTodayHabits = internalQuery({
  args: {
    dayKey: dayKeyValidator,
  },
  handler: async (ctx, args) => {
    const events = await listHabitEvents(ctx);
    const state = replayHabitEvents(events, { forDate: Date.now() });
    const habitDocs = await ctx.db.query("habits").collect();
    const todayLogs = await ctx.db
      .query("habitLogs")
      .withIndex("by_day_key", (q) => q.eq("dayKey", args.dayKey))
      .collect();
    const logByHabitId = new Map(todayLogs.map((log) => [String(log.habitId), log]));

    return habitDocs
      .filter((habit) => !habit.archivedAt)
      .filter((habit) =>
        isHabitActiveOnDay({
          dayKey: args.dayKey,
          startDayKey: habit.startDayKey,
          endDayKey: habit.endDayKey,
          pausedUntilDayKey: habit.pausedUntilDayKey,
        }),
      )
      .map((habit) => {
        const habitKey = habit._id as unknown as string;
        const today = logByHabitId.get(String(habit._id)) ?? state.todayLog[habitKey];
        return {
          habitId: habit._id,
          name: habit.name,
          cadence: habit.cadence,
          anchor: habit.anchor,
          difficulty: habit.difficulty,
          kind: habit.kind,
          targetValue: habit.targetValue,
          targetUnit: habit.targetUnit,
          timezone: habit.timezone,
          startDayKey: habit.startDayKey,
          endDayKey: habit.endDayKey,
          pausedUntilDayKey: habit.pausedUntilDayKey,
          todayStatus: today?.status,
          todayOccurredAt: today?.occurredAt,
          snoozedUntil: today?.snoozedUntil,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});
