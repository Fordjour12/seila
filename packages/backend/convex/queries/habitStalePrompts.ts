import { query } from "../_generated/server";
import { dayKeyValidator, isHabitActiveOnDay } from "../habits/shared";

const DAY_MS = 24 * 60 * 60 * 1000;

export const habitStalePrompts = query({
  args: {
    dayKey: dayKeyValidator,
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const habits = await ctx.db.query("habits").collect();

    return habits
      .filter((habit) => !habit.archivedAt)
      .filter((habit) =>
        isHabitActiveOnDay({
          dayKey: args.dayKey,
          startDayKey: habit.startDayKey,
          endDayKey: habit.endDayKey,
          pausedUntilDayKey: habit.pausedUntilDayKey,
        }),
      )
      .filter((habit) => {
        if (!habit.stalePromptSnoozedUntil) {
          return true;
        }
        return habit.stalePromptSnoozedUntil <= now;
      })
      .map((habit) => {
        const lastEngagedAt = habit.lastEngagedAt ?? habit.createdAt;
        const inactiveDays = Math.floor((now - lastEngagedAt) / DAY_MS);
        return {
          habitId: habit._id,
          name: habit.name,
          inactiveDays,
          stage: inactiveDays >= 28 ? ("overdue" as const) : ("stale" as const),
        };
      })
      .filter((habit) => habit.inactiveDays >= 14)
      .sort((a, b) => b.inactiveDays - a.inactiveDays)
      .slice(0, 4);
  },
});
