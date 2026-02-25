import { v } from "convex/values";

import { mutation } from "../../_generated/server";
import { dayKeyValidator, isHabitActiveOnDay, upsertHabitLog } from "../../habits/shared";

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDayKey(dayKey: string) {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDayKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLastDays(dayKey: string, daysBack: number) {
  const end = parseDayKey(dayKey);
  const keys: string[] = [];
  for (let i = 1; i <= daysBack; i += 1) {
    keys.push(formatDayKey(new Date(end.getTime() - i * DAY_MS)));
  }
  return keys;
}

function weekday(dayKey: string) {
  return parseDayKey(dayKey).getDay();
}

function isScheduled(cadence: "daily" | "weekdays" | { customDays: number[] }, day: number) {
  if (cadence === "daily") return true;
  if (cadence === "weekdays") return day >= 1 && day <= 5;
  return cadence.customDays.includes(day);
}

export const resolveMissedHabits = mutation({
  args: {
    dayKey: dayKeyValidator,
    lookbackDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const lookbackDays = Math.min(Math.max(args.lookbackDays ?? 14, 1), 45);
    const dayKeys = getLastDays(args.dayKey, lookbackDays);
    const habits = await ctx.db.query("habits").collect();
    let marked = 0;

    for (const day of dayKeys) {
      const dayLogs = await ctx.db
        .query("habitLogs")
        .withIndex("by_day_key", (q) => q.eq("dayKey", day))
        .collect();
      const hasLog = new Set(dayLogs.map((log) => String(log.habitId)));
      const dayWeekday = weekday(day);

      for (const habit of habits) {
        if (habit.archivedAt) continue;
        if (
          !isHabitActiveOnDay({
            dayKey: day,
            startDayKey: habit.startDayKey,
            endDayKey: habit.endDayKey,
            pausedUntilDayKey: habit.pausedUntilDayKey,
          })
        ) {
          continue;
        }
        if (!isScheduled(habit.cadence, dayWeekday)) continue;
        if (hasLog.has(String(habit._id))) continue;

        await upsertHabitLog(ctx, {
          habitId: habit._id,
          dayKey: day,
          status: "missed",
          occurredAt: parseDayKey(day).getTime() + 23 * 60 * 60 * 1000,
        });
        marked += 1;
      }
    }

    return { marked };
  },
});
