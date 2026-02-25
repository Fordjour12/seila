import { query } from "../_generated/server";
import { v } from "convex/values";
import { dayKeyValidator } from "../habits/shared";

export const habitHistory = query({
  args: {
    habitId: v.id("habits"),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db.query("events").collect();
    return events
      .filter((event) => {
        const payload = event.payload as { habitId?: unknown } | null;
        return typeof payload?.habitId === "string" && payload.habitId === (args.habitId as unknown as string);
      })
      .filter((event) => event.type.startsWith("habit."))
      .sort((a, b) => b.occurredAt - a.occurredAt)
      .map((event) => ({
        type: event.type,
        occurredAt: event.occurredAt,
        payload: event.payload,
      }));
  },
});

export const habitLifecycle = query({
  args: {
    dayKey: dayKeyValidator,
  },
  handler: async (ctx, args) => {
    const habits = await ctx.db.query("habits").collect();
    const paused = habits
      .filter((habit) => !habit.archivedAt && !!habit.pausedUntilDayKey && habit.pausedUntilDayKey >= args.dayKey)
      .sort((a, b) => a.name.localeCompare(b.name));
    const archived = habits
      .filter((habit) => !!habit.archivedAt)
      .sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));
    return {
      paused: paused.map((habit) => ({
        habitId: habit._id,
        name: habit.name,
        pausedUntilDayKey: habit.pausedUntilDayKey,
        kind: habit.kind,
      })),
      archived: archived.map((habit) => ({
        habitId: habit._id,
        name: habit.name,
        archivedAt: habit.archivedAt,
        kind: habit.kind,
      })),
    };
  },
});
