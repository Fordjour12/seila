import { internalQuery, query } from "../_generated/server";
import { listHabitEvents } from "../habits/shared";
import { replayHabitEvents } from "@seila/domain-kernel";

export const todayHabits = query({
  args: {},
  handler: async (ctx) => {
    const events = await listHabitEvents(ctx);
    const state = replayHabitEvents(events, { forDate: Date.now() });
    const habitDocs = await ctx.db.query("habits").collect();

    return habitDocs
      .filter((habit) => !habit.archivedAt)
      .map((habit) => {
        const habitKey = habit._id as unknown as string;
        const today = state.todayLog[habitKey];

        return {
          habitId: habit._id,
          name: habit.name,
          cadence: habit.cadence,
          anchor: habit.anchor,
          difficulty: habit.difficulty,
          todayStatus: today?.status,
          todayOccurredAt: today?.occurredAt,
          snoozedUntil: today?.snoozedUntil,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const internalTodayHabits = internalQuery({
  args: {},
  handler: async (ctx) => {
    const events = await listHabitEvents(ctx);
    const state = replayHabitEvents(events, { forDate: Date.now() });
    const habitDocs = await ctx.db.query("habits").collect();

    return habitDocs
      .filter((habit) => !habit.archivedAt)
      .map((habit) => {
        const habitKey = habit._id as unknown as string;
        const today = state.todayLog[habitKey];
        return {
          habitId: habit._id,
          name: habit.name,
          cadence: habit.cadence,
          anchor: habit.anchor,
          difficulty: habit.difficulty,
          todayStatus: today?.status,
          todayOccurredAt: today?.occurredAt,
          snoozedUntil: today?.snoozedUntil,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});
