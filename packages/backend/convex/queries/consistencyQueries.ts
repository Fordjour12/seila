import { query } from "../_generated/server";
import { v } from "convex/values";
import { dayKeyValidator, isHabitActiveOnDay, isHabitScheduledOnDay } from "../habits/shared";
import type { Doc } from "../_generated/dataModel";

const DAY_MS = 24 * 60 * 60 * 1000;

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

function dayRangeUtc(dayKey: string) {
  const start = parseDayKeyUtc(dayKey);
  return { start, end: start + DAY_MS - 1 };
}

function buildDayKeys(endDayKey: string, days: number) {
  const endUtc = parseDayKeyUtc(endDayKey);
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    keys.push(toDayKeyUtc(endUtc - i * DAY_MS));
  }
  return keys;
}

function isCompletedForDay(habit: Doc<"habits">, log?: Doc<"habitLogs">) {
  const kind = habit.kind ?? "build";
  if (kind === "break") {
    const breakGoal = habit.breakGoal ?? (habit.targetValue === 0 ? "quit" : "limit");
    const limit = breakGoal === "quit" ? 0 : (habit.targetValue ?? 0);
    const value = log?.value ?? 0;
    return value <= limit;
  }
  if ((habit.targetType ?? "binary") === "binary") {
    return log?.status === "completed";
  }
  return log?.status === "completed";
}

export const habitsConsistency = query({
  args: {
    dayKey: dayKeyValidator,
    windowDays: v.optional(v.number()),
    trendDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const windowDays = Math.min(Math.max(args.windowDays ?? 30, 7), 90);
    const trendDays = Math.min(Math.max(args.trendDays ?? 14, 7), 120);
    const windowKeys = buildDayKeys(args.dayKey, windowDays);
    const trendKeys = buildDayKeys(args.dayKey, trendDays);
    const firstWindowKey = windowKeys[0];

    const [habits, logs] = await Promise.all([
      ctx.db.query("habits").collect(),
      ctx.db
        .query("habitLogs")
        .withIndex("by_day_key", (q) => q.gte("dayKey", firstWindowKey).lte("dayKey", args.dayKey))
        .collect(),
    ]);

    const activeHabits = habits.filter((habit) => !habit.archivedAt);
    const logByHabitDay = new Map(logs.map((log) => [`${String(log.habitId)}:${log.dayKey}`, log]));

    let scheduledDays = 0;
    let completedScheduledDays = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    let runningStreak = 0;

    const dayBreakdown = windowKeys.map((dayKey) => {
      let scheduled = 0;
      let completed = 0;

      for (const habit of activeHabits) {
        const isActive = isHabitActiveOnDay({
          dayKey,
          startDayKey: habit.startDayKey,
          endDayKey: habit.endDayKey,
          pausedUntilDayKey: habit.pausedUntilDayKey,
        });
        if (
          !isActive ||
          !isHabitScheduledOnDay({
            dayKey,
            cadence: habit.cadence,
            frequencyType: habit.frequencyType,
            frequencyConfig: habit.frequencyConfig,
            startDayKey: habit.startDayKey,
          })
        ) {
          continue;
        }

        scheduled += 1;
        const log = logByHabitDay.get(`${String(habit._id)}:${dayKey}`);
        if (isCompletedForDay(habit, log)) {
          completed += 1;
        }
      }

      scheduledDays += scheduled;
      completedScheduledDays += completed;

      if (scheduled > 0) {
        if (completed === scheduled) {
          runningStreak += 1;
          bestStreak = Math.max(bestStreak, runningStreak);
        } else {
          runningStreak = 0;
        }
      }

      return { dayKey, scheduled, completed };
    });
    const dayBreakdownByKey = new Map(dayBreakdown.map((day) => [day.dayKey, day]));

    for (let i = dayBreakdown.length - 1; i >= 0; i -= 1) {
      const day = dayBreakdown[i];
      if (day.scheduled === 0) {
        continue;
      }
      if (day.completed === day.scheduled) {
        currentStreak += 1;
        continue;
      }
      break;
    }

    const last14 = dayBreakdown.slice(-14);
    const missedLast14 = last14.reduce((sum, day) => sum + Math.max(day.scheduled - day.completed, 0), 0);

    const trend = trendKeys.map((dayKey) => {
      const day = dayBreakdownByKey.get(dayKey);
      const scheduled = day?.scheduled ?? 0;
      const completed = day?.completed ?? 0;
      return {
        dayKey,
        score: scheduled > 0 ? completed / scheduled : 0,
        scheduled,
        completed,
      };
    });

    return {
      windowDays,
      consistencyPct: scheduledDays > 0 ? Math.round((completedScheduledDays / scheduledDays) * 100) : 0,
      completedScheduledDays,
      scheduledDays,
      currentStreak,
      bestStreak,
      missedLast14,
      activeHabits: activeHabits.filter((habit) =>
        isHabitActiveOnDay({
          dayKey: args.dayKey,
          startDayKey: habit.startDayKey,
          endDayKey: habit.endDayKey,
          pausedUntilDayKey: habit.pausedUntilDayKey,
        }),
      ).length,
      trend,
    };
  },
});

export const tasksConsistency = query({
  args: {
    dayKey: dayKeyValidator,
    windowDays: v.optional(v.number()),
    trendDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const windowDays = Math.min(Math.max(args.windowDays ?? 30, 7), 90);
    const trendDays = Math.min(Math.max(args.trendDays ?? 14, 7), 120);
    const windowKeys = buildDayKeys(args.dayKey, windowDays);
    const trendKeys = buildDayKeys(args.dayKey, trendDays);

    const startUtc = parseDayKeyUtc(windowKeys[0]);
    const endUtc = parseDayKeyUtc(args.dayKey) + DAY_MS - 1;

    const tasks = await ctx.db.query("tasks").collect();

    const createdInWindow = tasks.filter((task) => task.createdAt >= startUtc && task.createdAt <= endUtc).length;
    const completedInWindow = tasks.filter(
      (task) => typeof task.completedAt === "number" && task.completedAt >= startUtc && task.completedAt <= endUtc,
    ).length;

    const completionRatePct = createdInWindow > 0 ? Math.round((completedInWindow / createdInWindow) * 100) : 0;

    const completedDayKeys = new Set(
      tasks
        .filter(
          (task): task is typeof task & { completedAt: number } =>
            typeof task.completedAt === "number" && task.completedAt >= startUtc && task.completedAt <= endUtc,
        )
        .map((task) => toDayKeyUtc(task.completedAt)),
    );

    let currentStreak = 0;
    let bestStreak = 0;
    let runningStreak = 0;
    for (const dayKey of windowKeys) {
      if (completedDayKeys.has(dayKey)) {
        runningStreak += 1;
        bestStreak = Math.max(bestStreak, runningStreak);
      } else {
        runningStreak = 0;
      }
    }

    for (let i = windowKeys.length - 1; i >= 0; i -= 1) {
      if (completedDayKeys.has(windowKeys[i])) {
        currentStreak += 1;
        continue;
      }
      break;
    }

    const completionsByDay = new Map<string, number>();
    for (const task of tasks) {
      if (typeof task.completedAt !== "number" || task.completedAt < startUtc || task.completedAt > endUtc) {
        continue;
      }
      const dayKey = toDayKeyUtc(task.completedAt);
      completionsByDay.set(dayKey, (completionsByDay.get(dayKey) ?? 0) + 1);
    }

    const trend = trendKeys.map((dayKey) => ({
      dayKey,
      completed: completionsByDay.get(dayKey) ?? 0,
    }));

    return {
      windowDays,
      completionRatePct,
      createdInWindow,
      completedInWindow,
      currentStreak,
      bestStreak,
      trend,
    };
  },
});

export const habitConsistencyById = query({
  args: {
    habitId: v.id("habits"),
    dayKey: dayKeyValidator,
    windowDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const windowDays = Math.min(Math.max(args.windowDays ?? 30, 7), 90);
    const windowKeys = buildDayKeys(args.dayKey, windowDays);
    const firstWindowKey = windowKeys[0];
    const habit = await ctx.db.get(args.habitId);
    if (!habit) {
      return null;
    }

    const logs = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit_day", (q) => q.eq("habitId", args.habitId).gte("dayKey", firstWindowKey).lte("dayKey", args.dayKey))
      .collect();
    const logByDayKey = new Map(logs.map((log) => [log.dayKey, log]));

    let scheduledDays = 0;
    let completedDays = 0;
    let skippedDays = 0;
    let snoozedDays = 0;
    let missedDays = 0;
    let relapsedDays = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    let runningStreak = 0;

    const trend = windowKeys.map((dayKey) => {
      const active = isHabitActiveOnDay({
        dayKey,
        startDayKey: habit.startDayKey,
        endDayKey: habit.endDayKey,
        pausedUntilDayKey: habit.pausedUntilDayKey,
      });
      const scheduled =
        active &&
        isHabitScheduledOnDay({
          dayKey,
          cadence: habit.cadence,
          frequencyType: habit.frequencyType,
          frequencyConfig: habit.frequencyConfig,
          startDayKey: habit.startDayKey,
        });
      const log = logByDayKey.get(dayKey);
      const completed = scheduled && isCompletedForDay(habit, log);
      const skipped = scheduled && log?.status === "skipped";
      const snoozed = scheduled && log?.status === "snoozed";
      const missed = scheduled && log?.status === "missed";
      const relapsed = scheduled && log?.status === "relapsed";

      if (scheduled) {
        scheduledDays += 1;
        if (completed) {
          completedDays += 1;
          runningStreak += 1;
          bestStreak = Math.max(bestStreak, runningStreak);
        } else {
          runningStreak = 0;
        }
        if (skipped) skippedDays += 1;
        if (snoozed) snoozedDays += 1;
        if (missed) missedDays += 1;
        if (relapsed) relapsedDays += 1;
      }

      return {
        dayKey,
        scheduled,
        status: log?.status,
        score: completed ? 1 : 0,
      };
    });

    for (let i = trend.length - 1; i >= 0; i -= 1) {
      if (!trend[i].scheduled) {
        continue;
      }
      if (trend[i].score === 1) {
        currentStreak += 1;
        continue;
      }
      break;
    }

    return {
      habitId: habit._id,
      name: habit.name,
      cadence: habit.cadence,
      anchor: habit.anchor,
      difficulty: habit.difficulty,
      kind: habit.kind,
      windowDays,
      consistencyPct: scheduledDays > 0 ? Math.round((completedDays / scheduledDays) * 100) : 0,
      scheduledDays,
      completedDays,
      skippedDays,
      snoozedDays,
      missedDays,
      relapsedDays,
      currentStreak,
      bestStreak,
      trend,
    };
  },
});

export const taskConsistencyById = query({
  args: {
    taskId: v.id("tasks"),
    dayKey: dayKeyValidator,
    windowDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      return null;
    }

    const windowDays = Math.min(Math.max(args.windowDays ?? 30, 7), 90);
    const windowKeys = buildDayKeys(args.dayKey, windowDays);
    const firstWindowUtc = parseDayKeyUtc(windowKeys[0]);
    const endUtc = parseDayKeyUtc(args.dayKey) + DAY_MS - 1;
    const normalizedTitle = task.title.trim().toLowerCase();

    const allTasks = await ctx.db.query("tasks").collect();
    const matchingTasks = allTasks.filter((item) => item.title.trim().toLowerCase() === normalizedTitle);

    const createdInWindow = matchingTasks.filter(
      (item) => item.createdAt >= firstWindowUtc && item.createdAt <= endUtc,
    ).length;
    const completedInWindow = matchingTasks.filter(
      (item) =>
        typeof item.completedAt === "number" &&
        item.completedAt >= firstWindowUtc &&
        item.completedAt <= endUtc,
    ).length;

    const completionRatePct = createdInWindow > 0 ? Math.round((completedInWindow / createdInWindow) * 100) : 0;
    const completedByDay = new Map<string, number>();
    for (const item of matchingTasks) {
      if (typeof item.completedAt !== "number" || item.completedAt < firstWindowUtc || item.completedAt > endUtc) {
        continue;
      }
      const key = toDayKeyUtc(item.completedAt);
      completedByDay.set(key, (completedByDay.get(key) ?? 0) + 1);
    }

    let currentStreak = 0;
    let bestStreak = 0;
    let runningStreak = 0;
    for (const dayKey of windowKeys) {
      if ((completedByDay.get(dayKey) ?? 0) > 0) {
        runningStreak += 1;
        bestStreak = Math.max(bestStreak, runningStreak);
      } else {
        runningStreak = 0;
      }
    }
    for (let i = windowKeys.length - 1; i >= 0; i -= 1) {
      if ((completedByDay.get(windowKeys[i]) ?? 0) > 0) {
        currentStreak += 1;
        continue;
      }
      break;
    }

    return {
      taskId: task._id,
      title: task.title,
      status: task.status,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
      focusedAt: task.focusedAt,
      deferredUntil: task.deferredUntil,
      windowDays,
      completionRatePct,
      createdInWindow,
      completedInWindow,
      currentStreak,
      bestStreak,
      trend: windowKeys.map((dayKey) => ({
        dayKey,
        completed: completedByDay.get(dayKey) ?? 0,
      })),
    };
  },
});

export const habitDayDetails = query({
  args: {
    dayKey: dayKeyValidator,
  },
  handler: async (ctx, args) => {
    const [habits, logs] = await Promise.all([
      ctx.db.query("habits").collect(),
      ctx.db
        .query("habitLogs")
        .withIndex("by_day_key", (q) => q.eq("dayKey", args.dayKey))
        .collect(),
    ]);

    const habitById = new Map(habits.map((habit) => [String(habit._id), habit]));
    const logsDetailed = logs
      .map((log) => {
        const habit = habitById.get(String(log.habitId));
        if (!habit) {
          return null;
        }
        return {
          habitId: log.habitId,
          name: habit.name,
          status: log.status,
          occurredAt: log.occurredAt,
          anchor: habit.anchor,
          difficulty: habit.difficulty,
          kind: habit.kind,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.name.localeCompare(b.name));

    const scheduledHabits = habits
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
      .map((habit) => ({
        habitId: habit._id,
        name: habit.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      dayKey: args.dayKey,
      logs: logsDetailed,
      scheduledHabits,
    };
  },
});

export const taskDayDetails = query({
  args: {
    dayKey: dayKeyValidator,
  },
  handler: async (ctx, args) => {
    const { start, end } = dayRangeUtc(args.dayKey);
    const tasks = await ctx.db.query("tasks").collect();

    const created = tasks
      .filter((task) => task.createdAt >= start && task.createdAt <= end)
      .map((task) => ({
        taskId: task._id,
        title: task.title,
        status: task.status,
        at: task.createdAt,
      }))
      .sort((a, b) => a.at - b.at);

    const completed = tasks
      .filter((task): task is typeof task & { completedAt: number } => typeof task.completedAt === "number")
      .filter((task) => task.completedAt >= start && task.completedAt <= end)
      .map((task) => ({
        taskId: task._id,
        title: task.title,
        status: task.status,
        at: task.completedAt,
      }))
      .sort((a, b) => a.at - b.at);

    const focused = tasks
      .filter((task): task is typeof task & { focusedAt: number } => typeof task.focusedAt === "number")
      .filter((task) => task.focusedAt >= start && task.focusedAt <= end)
      .map((task) => ({
        taskId: task._id,
        title: task.title,
        status: task.status,
        at: task.focusedAt,
      }))
      .sort((a, b) => a.at - b.at);

    const deferred = tasks
      .filter((task): task is typeof task & { deferredUntil: number } => typeof task.deferredUntil === "number")
      .filter((task) => task.deferredUntil >= start && task.deferredUntil <= end)
      .map((task) => ({
        taskId: task._id,
        title: task.title,
        status: task.status,
        at: task.deferredUntil,
      }))
      .sort((a, b) => a.at - b.at);

    return {
      dayKey: args.dayKey,
      created,
      completed,
      focused,
      deferred,
    };
  },
});
