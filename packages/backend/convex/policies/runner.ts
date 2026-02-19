import {
  defaultPolicies,
  runPolicies,
  type DomainState,
  type HabitState,
  type TaskState,
  type CheckinState,
} from "@seila/domain-kernel";

import type { MutationCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import { internalMutation } from "../_generated/server";

function buildHabitState(habits: Doc<"habits">[], events: Doc<"events">[]): HabitState {
  const activeHabits: HabitState["activeHabits"] = {};

  for (const habit of habits) {
    if (habit.archivedAt) {
      continue;
    }

    const habitId = habit._id as unknown as string;
    activeHabits[habitId] = {
      habitId,
      name: habit.name,
      cadence: habit.cadence,
      anchor: habit.anchor,
      difficulty: habit.difficulty,
    };
  }

  const now = Date.now();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const dayStart = start.getTime();

  const todayLog: HabitState["todayLog"] = {};
  for (const event of events) {
    if (event.occurredAt < dayStart) {
      continue;
    }

    if (
      event.type !== "habit.completed" &&
      event.type !== "habit.skipped" &&
      event.type !== "habit.snoozed"
    ) {
      continue;
    }

    const payload = event.payload as { habitId?: unknown; snoozedUntil?: unknown };
    if (typeof payload.habitId !== "string") {
      continue;
    }

    if (event.type === "habit.completed") {
      todayLog[payload.habitId] = {
        status: "completed",
        occurredAt: event.occurredAt,
      };
      continue;
    }

    if (event.type === "habit.skipped") {
      todayLog[payload.habitId] = {
        status: "skipped",
        occurredAt: event.occurredAt,
      };
      continue;
    }

    todayLog[payload.habitId] = {
      status: "snoozed",
      occurredAt: event.occurredAt,
      snoozedUntil:
        typeof payload.snoozedUntil === "number" ? payload.snoozedUntil : undefined,
    };
  }

  return {
    activeHabits,
    todayLog,
  };
}

function buildCheckinState(checkins: Doc<"checkins">[]): CheckinState {
  const sorted = checkins.slice().sort((a, b) => a.occurredAt - b.occurredAt);
  const mapped = sorted.map((item) => ({
    id: item._id as unknown as string,
    type: item.type,
    mood: item.mood as 1 | 2 | 3 | 4 | 5,
    energy: item.energy as 1 | 2 | 3 | 4 | 5,
    flags: item.flags as CheckinState["checkins"][number]["flags"],
    note: item.note,
    occurredAt: item.occurredAt,
    weeklyAnswers: item.weeklyAnswers,
  }));

  const now = Date.now();
  const cutoff = now - 14 * 24 * 60 * 60 * 1000;
  const recent = mapped.filter((entry) => entry.occurredAt >= cutoff);

  if (recent.length === 0) {
    return {
      checkins: mapped,
      recentCheckins: [],
      moodTrend: {
        averageMood: 0,
        averageEnergy: 0,
        daysTracked: 0,
      },
    };
  }

  const moodSum = recent.reduce((sum, item) => sum + item.mood, 0);
  const energySum = recent.reduce((sum, item) => sum + item.energy, 0);
  const daysTracked = new Set(
    recent.map((entry) => new Date(entry.occurredAt).toISOString().split("T")[0]),
  ).size;

  return {
    checkins: mapped,
    recentCheckins: recent,
    moodTrend: {
      averageMood: moodSum / recent.length,
      averageEnergy: energySum / recent.length,
      daysTracked,
    },
  };
}

function buildTaskState(tasks: Doc<"tasks">[]): TaskState {
  const mapped = tasks.map((task) => ({
    id: task._id as unknown as string,
    title: task.title,
    status: task.status,
    createdAt: task.createdAt,
    focusedAt: task.focusedAt,
    deferredUntil: task.deferredUntil,
    completedAt: task.completedAt,
    abandonedAt: task.abandonedAt,
  }));

  return {
    tasks: mapped,
    inbox: mapped.filter((item) => item.status === "inbox"),
    focus: mapped.filter((item) => item.status === "focus"),
    deferred: mapped.filter((item) => item.status === "deferred"),
    completed: mapped.filter((item) => item.status === "completed"),
    abandoned: mapped.filter((item) => item.status === "abandoned"),
  };
}

function buildFinanceSnapshot(
  envelopes: Doc<"envelopes">[],
  transactions: Doc<"transactions">[],
) {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const monthStartMs = monthStart.getTime();

  return {
    envelopes: envelopes.map((envelope) => {
      const spent = transactions
        .filter(
          (transaction) =>
            !transaction.voidedAt &&
            !transaction.pendingImport &&
            transaction.envelopeId === envelope._id &&
            transaction.occurredAt >= monthStartMs,
        )
        .reduce((sum, transaction) => sum + transaction.amount, 0);

      const utilization =
        typeof envelope.softCeiling === "number" && envelope.softCeiling > 0
          ? spent / envelope.softCeiling
          : 0;

      return {
        id: envelope._id as unknown as string,
        name: envelope.name,
        utilization,
      };
    }),
  };
}

function buildPatternSnapshot(events: Doc<"events">[]) {
  let activeCount = 0;

  for (const event of events) {
    if (event.type === "pattern.surfaced") {
      activeCount += 1;
    }

    if (event.type === "pattern.dismissed" || event.type === "pattern.expired") {
      activeCount = Math.max(0, activeCount - 1);
    }
  }

  return { activeCount };
}

function buildWeeklyReviewSnapshot(events: Doc<"events">[]) {
  const latestReview = events
    .filter((event) => event.type === "review.closed" || event.type === "review.skipped")
    .sort((a, b) => b.occurredAt - a.occurredAt)[0];

  if (!latestReview) {
    return { due: true };
  }

  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return {
    due: Date.now() - latestReview.occurredAt >= sevenDays,
  };
}

async function buildDomainState(ctx: MutationCtx): Promise<DomainState> {
  const [habits, checkins, tasks, events, envelopes, transactions] = await Promise.all([
    ctx.db.query("habits").collect(),
    ctx.db.query("checkins").collect(),
    ctx.db.query("tasks").collect(),
    ctx.db.query("events").collect(),
    ctx.db.query("envelopes").collect(),
    ctx.db.query("transactions").collect(),
  ]);

  return {
    now: Date.now(),
    habits: buildHabitState(habits, events),
    checkins: buildCheckinState(checkins),
    tasks: buildTaskState(tasks),
    finance: buildFinanceSnapshot(envelopes, transactions),
    patterns: buildPatternSnapshot(events),
    weeklyReview: buildWeeklyReviewSnapshot(events),
  };
}

export const runPolicyEngine = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const quietToday = await ctx.db
      .query("quietDays")
      .withIndex("by_day_start", (q) => q.eq("dayStart", dayStart.getTime()))
      .first();

    if (quietToday?.isQuiet) {
      const activeQuiet = await ctx.db
        .query("suggestions")
        .withIndex("by_dismissed_at", (q) => q.eq("dismissedAt", undefined))
        .collect();

      for (const suggestion of activeQuiet) {
        await ctx.db.patch(suggestion._id, {
          dismissedAt: now,
        });
      }

      return {
        generated: 0,
        suppressedByQuietDay: true,
      };
    }

    const state = await buildDomainState(ctx);
    const nextSuggestions = runPolicies(state, defaultPolicies);

    const active = await ctx.db
      .query("suggestions")
      .withIndex("by_dismissed_at", (q) => q.eq("dismissedAt", undefined))
      .collect();

    const nextByPolicy = new Map(nextSuggestions.map((item) => [item.policy, item]));

    for (const activeSuggestion of active) {
      if (!nextByPolicy.has(activeSuggestion.policy as (typeof nextSuggestions)[number]["policy"])) {
        await ctx.db.patch(activeSuggestion._id, {
          dismissedAt: Date.now(),
        });
      }
    }

    const activeByPolicy = new Map(active.map((item) => [item.policy, item]));

    for (const suggestion of nextSuggestions) {
      const existing = activeByPolicy.get(suggestion.policy);

      if (existing) {
        if (
          existing.headline !== suggestion.headline ||
          existing.subtext !== suggestion.subtext ||
          existing.priority !== suggestion.priority
        ) {
          await ctx.db.patch(existing._id, {
            headline: suggestion.headline,
            subtext: suggestion.subtext,
            priority: suggestion.priority,
            action: suggestion.action,
          });
        }
        continue;
      }

      const suggestionId = await ctx.db.insert("suggestions", {
        policy: suggestion.policy,
        headline: suggestion.headline,
        subtext: suggestion.subtext,
        priority: suggestion.priority,
        action: suggestion.action,
        createdAt: Date.now(),
      });

      await ctx.db.insert("events", {
        type: "suggestion.surfaced",
        occurredAt: Date.now(),
        idempotencyKey: `suggestion.surfaced:${suggestion.policy}:${Date.now()}`,
        payload: {
          suggestionId,
          policy: suggestion.policy,
        },
      });
    }

    return {
      generated: nextSuggestions.length,
    };
  },
});
