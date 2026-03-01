import { internalQuery, query } from "../_generated/server";
import { v } from "convex/values";
import { dayKeyValidator, isHabitActiveOnDay, isHabitScheduledOnDay } from "../habits/shared";
import { replayHabitEvents } from "@seila/domain-kernel";
import { listHabitEvents } from "../habits/shared";

function timePreferenceRank(value?: "morning" | "afternoon" | "evening" | "flexible") {
  if (value === "morning") return 0;
  if (value === "afternoon") return 1;
  if (value === "evening") return 2;
  return 3;
}

function energyRank(value?: "low" | "medium" | "high") {
  if (value === "low") return 0;
  if (value === "medium") return 1;
  return 2;
}

function sortHabits<T extends { name: string; timePreference?: any; energyLevel?: any }>(items: T[]) {
  return items.sort((a, b) => {
    const timeDelta = timePreferenceRank(a.timePreference) - timePreferenceRank(b.timePreference);
    if (timeDelta !== 0) return timeDelta;
    const energyDelta = energyRank(a.energyLevel) - energyRank(b.energyLevel);
    if (energyDelta !== 0) return energyDelta;
    return a.name.localeCompare(b.name);
  });
}

export const todayHabits = query({
  args: {
    dayKey: dayKeyValidator,
    lowEnergyMode: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const todayLogs = await ctx.db
      .query("habitLogs")
      .withIndex("by_day_key", (q) => q.eq("dayKey", args.dayKey))
      .collect();
    const logByHabitId = new Map(todayLogs.map((log) => [String(log.habitId), log]));
    const habitDocs = await ctx.db.query("habits").collect();

    const items = habitDocs
      .filter((habit) => !habit.archivedAt)
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
      .map((habit) => {
        const today = logByHabitId.get(String(habit._id));
        const breakGoal =
          habit.breakGoal ?? ((habit.kind ?? "build") === "break" ? (habit.targetValue === 0 ? "quit" : "limit") : undefined);
        const breakMetric =
          habit.breakMetric ??
          ((habit.kind ?? "build") === "break"
            ? habit.targetType === "duration" || habit.targetUnit === "minutes"
              ? "minutes"
              : "times"
            : undefined);
        const isBreakHabit = (habit.kind ?? "build") === "break";
        const todayTotal = today?.value ?? 0;
        const breakLimit = breakGoal === "quit" ? 0 : (habit.targetValue ?? 0);
        const derivedBreakCompleted = isBreakHabit ? todayTotal <= breakLimit : undefined;
        const todayStatus = today?.status ?? (derivedBreakCompleted ? "completed" : undefined);

        return {
          habitId: habit._id,
          name: habit.name,
          cadence: habit.cadence,
          anchor: habit.anchor,
          difficulty: habit.difficulty,
          kind: habit.kind,
          breakGoal,
          breakMetric,
          targetValue: habit.targetValue,
          targetUnit: habit.targetUnit,
          targetType: habit.targetType ?? (typeof habit.targetValue === "number" ? "quantity" : "binary"),
          frequencyType: habit.frequencyType,
          frequencyConfig: habit.frequencyConfig,
          identityTags: habit.identityTags ?? [],
          energyLevel: habit.energyLevel ?? habit.difficulty ?? "low",
          timePreference: habit.timePreference ?? (habit.anchor === "anytime" ? "flexible" : habit.anchor),
          timezone: habit.timezone,
          startDayKey: habit.startDayKey,
          endDayKey: habit.endDayKey,
          pausedUntilDayKey: habit.pausedUntilDayKey,
          todayStatus,
          todayOccurredAt: today?.occurredAt,
          todayValue: today?.value,
          completed: today?.completed ?? derivedBreakCompleted,
          snoozedUntil: today?.snoozedUntil,
        };
      })
      .filter((habit) => !args.lowEnergyMode || habit.energyLevel === "low");

    return sortHabits(items);
  },
});

export const internalTodayHabits = internalQuery({
  args: {
    dayKey: dayKeyValidator,
    lowEnergyMode: v.optional(v.boolean()),
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

    const items = habitDocs
      .filter((habit) => !habit.archivedAt)
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
      .map((habit) => {
        const habitKey = habit._id as unknown as string;
        const today = logByHabitId.get(String(habit._id)) ?? state.todayLog[habitKey];
        const breakGoal =
          habit.breakGoal ?? ((habit.kind ?? "build") === "break" ? (habit.targetValue === 0 ? "quit" : "limit") : undefined);
        const breakMetric =
          habit.breakMetric ??
          ((habit.kind ?? "build") === "break"
            ? habit.targetType === "duration" || habit.targetUnit === "minutes"
              ? "minutes"
              : "times"
            : undefined);
        const isBreakHabit = (habit.kind ?? "build") === "break";
        const todayValue =
          today && typeof today === "object" && "value" in today
            ? (today as { value?: number }).value
            : undefined;
        const todayTotal = todayValue ?? 0;
        const breakLimit = breakGoal === "quit" ? 0 : (habit.targetValue ?? 0);
        const derivedBreakCompleted = isBreakHabit ? todayTotal <= breakLimit : undefined;
        const todayStatus = today?.status ?? (derivedBreakCompleted ? "completed" : undefined);
        return {
          habitId: habit._id,
          name: habit.name,
          cadence: habit.cadence,
          anchor: habit.anchor,
          difficulty: habit.difficulty,
          kind: habit.kind,
          breakGoal,
          breakMetric,
          targetValue: habit.targetValue,
          targetUnit: habit.targetUnit,
          targetType: habit.targetType ?? (typeof habit.targetValue === "number" ? "quantity" : "binary"),
          frequencyType: habit.frequencyType,
          frequencyConfig: habit.frequencyConfig,
          identityTags: habit.identityTags ?? [],
          energyLevel: habit.energyLevel ?? habit.difficulty ?? "low",
          timePreference: habit.timePreference ?? (habit.anchor === "anytime" ? "flexible" : habit.anchor),
          timezone: habit.timezone,
          startDayKey: habit.startDayKey,
          endDayKey: habit.endDayKey,
          pausedUntilDayKey: habit.pausedUntilDayKey,
          todayStatus,
          todayOccurredAt: today?.occurredAt,
          todayValue,
          completed:
            today && typeof today === "object" && "completed" in today
              ? (today as { completed?: boolean }).completed ?? derivedBreakCompleted
              : derivedBreakCompleted,
          snoozedUntil: today?.snoozedUntil,
        };
      })
      .filter((habit) => !args.lowEnergyMode || habit.energyLevel === "low");

    return sortHabits(items);
  },
});
