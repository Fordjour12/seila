import { query } from "../_generated/server";
import { dayKeyValidator, isHabitActiveOnDay, isHabitScheduledOnDay } from "../habits/shared";
import type { Doc } from "../_generated/dataModel";

const DAY_MS = 24 * 60 * 60 * 1000;

type EnergyLevel = "low" | "medium" | "high";

function parseDayKeyUtc(dayKey: string) {
  const [year, month, day] = dayKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function toDayKeyUtc(ms: number) {
  const date = new Date(ms);
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildDayKeys(endDayKey: string, days: number) {
  const endUtc = parseDayKeyUtc(endDayKey);
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    keys.push(toDayKeyUtc(endUtc - i * DAY_MS));
  }
  return keys;
}

function toPercent(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function timePreferenceRank(value?: "morning" | "afternoon" | "evening" | "flexible") {
  if (value === "morning") return 0;
  if (value === "afternoon") return 1;
  if (value === "evening") return 2;
  return 3;
}

function isCompletedForDay(habit: Doc<"habits">, log?: Doc<"habitLogs">) {
  const kind = habit.kind ?? "build";
  if (kind === "break") {
    const breakGoal = habit.breakGoal ?? (habit.targetValue === 0 ? "quit" : "limit");
    const limit = breakGoal === "quit" ? 0 : (habit.targetValue ?? 0);
    const value = log?.value ?? 0;
    return value <= limit;
  }
  return log?.status === "completed";
}

export const gentleReturnSuggestion = query({
  args: {
    dayKey: dayKeyValidator,
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const habits = await ctx.db.query("habits").collect();

    const candidates = habits
      .filter((habit) => !habit.archivedAt)
      .filter((habit) => {
        const lastEngagedAt = habit.lastEngagedAt ?? habit.createdAt;
        const inactiveDays = Math.floor((now - lastEngagedAt) / DAY_MS);
        return inactiveDays >= 3;
      })
      .filter((habit) => (habit.energyLevel ?? habit.difficulty ?? "low") === "low")
      .filter((habit) => (habit.targetType ?? "binary") === "binary")
      .filter((habit) =>
        isHabitActiveOnDay({
          dayKey: args.dayKey,
          startDayKey: habit.startDayKey,
          endDayKey: habit.endDayKey,
          pausedUntilDayKey: habit.pausedUntilDayKey,
        }),
      )
      .filter((habit) =>
        isHabitScheduledOnDay({
          dayKey: args.dayKey,
          cadence: habit.cadence,
          frequencyType: habit.frequencyType,
          frequencyConfig: habit.frequencyConfig,
          startDayKey: habit.startDayKey,
        }),
      )
      .sort((a, b) => {
        const timeDelta =
          timePreferenceRank(a.timePreference ?? (a.anchor === "anytime" ? "flexible" : a.anchor)) -
          timePreferenceRank(b.timePreference ?? (b.anchor === "anytime" ? "flexible" : b.anchor));
        if (timeDelta !== 0) return timeDelta;
        return a.name.length - b.name.length || a.name.localeCompare(b.name);
      });

    const suggested = candidates[0];
    if (!suggested) {
      return null;
    }

    return {
      habitId: suggested._id,
      name: suggested.name,
      energyLevel: suggested.energyLevel ?? suggested.difficulty ?? "low",
      targetType: suggested.targetType ?? "binary",
    };
  },
});

export const habitAnalytics = query({
  args: {
    dayKey: dayKeyValidator,
  },
  handler: async (ctx, args) => {
    const habits = (await ctx.db.query("habits").collect()).filter((habit) => !habit.archivedAt);

    const keys30 = buildDayKeys(args.dayKey, 30);
    const keys7 = keys30.slice(-7);
    const firstWindowKey = keys30[0];

    const logs = await ctx.db
      .query("habitLogs")
      .withIndex("by_day_key", (q) => q.gte("dayKey", firstWindowKey).lte("dayKey", args.dayKey))
      .collect();

    const logByHabitDay = new Map(logs.map((log) => [`${String(log.habitId)}:${log.dayKey}`, log]));

    const computeRate = (keys: string[]) => {
      let scheduled = 0;
      let completed = 0;
      for (const key of keys) {
        for (const habit of habits) {
          if (
            !isHabitActiveOnDay({
              dayKey: key,
              startDayKey: habit.startDayKey,
              endDayKey: habit.endDayKey,
              pausedUntilDayKey: habit.pausedUntilDayKey,
            })
          ) {
            continue;
          }
          if (
            !isHabitScheduledOnDay({
              dayKey: key,
              cadence: habit.cadence,
              frequencyType: habit.frequencyType,
              frequencyConfig: habit.frequencyConfig,
              startDayKey: habit.startDayKey,
            })
          ) {
            continue;
          }

          scheduled += 1;
          const log = logByHabitDay.get(`${String(habit._id)}:${key}`);
          if (isCompletedForDay(habit, log)) {
            completed += 1;
          }
        }
      }
      return { scheduled, completed, ratePct: toPercent(completed, scheduled) };
    };

    const energyBuckets: Record<EnergyLevel, { scheduled: number; completed: number }> = {
      low: { scheduled: 0, completed: 0 },
      medium: { scheduled: 0, completed: 0 },
      high: { scheduled: 0, completed: 0 },
    };

    const identityBuckets = new Map<string, { scheduled: number; completed: number }>();

    for (const key of keys30) {
      for (const habit of habits) {
        if (
          !isHabitActiveOnDay({
            dayKey: key,
            startDayKey: habit.startDayKey,
            endDayKey: habit.endDayKey,
            pausedUntilDayKey: habit.pausedUntilDayKey,
          })
        ) {
          continue;
        }
        if (
          !isHabitScheduledOnDay({
            dayKey: key,
            cadence: habit.cadence,
            frequencyType: habit.frequencyType,
            frequencyConfig: habit.frequencyConfig,
            startDayKey: habit.startDayKey,
          })
        ) {
          continue;
        }

        const habitKey = `${String(habit._id)}:${key}`;
        const completed = isCompletedForDay(habit, logByHabitDay.get(habitKey));
        const energy = (habit.energyLevel ?? habit.difficulty ?? "low") as EnergyLevel;

        energyBuckets[energy].scheduled += 1;
        if (completed) {
          energyBuckets[energy].completed += 1;
        }

        const tags = habit.identityTags && habit.identityTags.length > 0 ? habit.identityTags : ["Uncategorized"];
        for (const tag of tags) {
          const current = identityBuckets.get(tag) ?? { scheduled: 0, completed: 0 };
          current.scheduled += 1;
          if (completed) {
            current.completed += 1;
          }
          identityBuckets.set(tag, current);
        }
      }
    }

    const identityBreakdown = Array.from(identityBuckets.entries())
      .map(([tag, totals]) => ({
        tag,
        scheduled: totals.scheduled,
        completed: totals.completed,
        ratePct: toPercent(totals.completed, totals.scheduled),
      }))
      .sort((a, b) => b.ratePct - a.ratePct);

    const strongestIdentity = identityBreakdown[0];
    const weakestIdentity = identityBreakdown[identityBreakdown.length - 1];

    return {
      completion7d: computeRate(keys7),
      completion30d: computeRate(keys30),
      energyCompletion: {
        low: toPercent(energyBuckets.low.completed, energyBuckets.low.scheduled),
        medium: toPercent(energyBuckets.medium.completed, energyBuckets.medium.scheduled),
        high: toPercent(energyBuckets.high.completed, energyBuckets.high.scheduled),
      },
      identityBreakdown,
      identityImbalance:
        strongestIdentity && weakestIdentity
          ? {
              strongestTag: strongestIdentity.tag,
              strongestRatePct: strongestIdentity.ratePct,
              weakestTag: weakestIdentity.tag,
              weakestRatePct: weakestIdentity.ratePct,
            }
          : null,
    };
  },
});
