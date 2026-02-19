"use node";

import { v } from "convex/values";
import { makeFunctionReference } from "convex/server";

import { api, internal } from "../_generated/api";
import { internalAction } from "../_generated/server";

type WeeklySummary = {
  bullets: string[];
  brightSpot: string;
  worthNoticing: string;
};

const DISALLOWED_TONE_FRAGMENTS = [
  "you failed",
  "failure",
  "lazy",
  "shame",
  "guilt",
  "must",
  "should",
  "need to",
  "have to",
];

const recoveryContextRef = makeFunctionReference<
  "query",
  {},
  {
    hardDayLooksLike?: string;
    knownTriggers: string[];
    restDefinition?: string;
  } | null
>("queries/recoveryContext:internalRecoveryContext");

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function passesWeeklySummaryTonePolicy(summary: WeeklySummary) {
  const combined = `${summary.bullets.join(" ")} ${summary.brightSpot} ${summary.worthNoticing}`.toLowerCase();
  return !DISALLOWED_TONE_FRAGMENTS.some((fragment) => combined.includes(fragment));
}

function fallbackWeeklySummary(): WeeklySummary {
  return {
    bullets: ["A full week of activity was captured across your routines."],
    brightSpot: "You showed up and kept data flowing.",
    worthNoticing: "Your week had variation, which offers useful context for the next one.",
  };
}

export const generateWeeklySummary = internalAction({
  args: {
    reviewId: v.id("reviews"),
    weekStart: v.number(),
    weekEnd: v.number(),
  },
  handler: async (ctx, args): Promise<WeeklySummary> => {
    const [events, checkins, recoveryContext] = await Promise.all([
      ctx.runQuery(api.queries.weeklySummaryQueries.eventsByDateRange, {
        since: args.weekStart,
        until: args.weekEnd,
      }),
      ctx.runQuery(api.queries.weeklySummaryQueries.recentCheckinsForWeeklySummary, {
        since: args.weekStart,
        until: args.weekEnd,
      }),
      ctx.runQuery(recoveryContextRef, {}),
    ]);

    const bullets: string[] = [];

    const completedHabits = events.filter((event) => event.type === "habit.completed").length;
    if (completedHabits > 0) {
      bullets.push(`${completedHabits} habit completions logged`);
    }

    const checkinCount = checkins.length;
    if (checkinCount > 0) {
      bullets.push(`${checkinCount} check-ins completed`);
    }

    const completedTasks = events.filter((event) => event.type === "task.completed").length;
    if (completedTasks > 0) {
      bullets.push(`${completedTasks} tasks completed`);
    }

    const transactionLogs = events.filter((event) => event.type === "finance.transactionLogged").length;
    if (transactionLogs > 0) {
      bullets.push(`${transactionLogs} transactions logged`);
    }

    if (checkins.length > 0) {
      const moods = checkins.map((checkin) => checkin.mood);
      const avgMood = average(moods);
      if (avgMood >= 4) {
        bullets.push("Overall mood trending positive");
      } else if (avgMood <= 2) {
        bullets.push("Mood trend was lower this week");
      }
    }

    if (bullets.length > 5) {
      bullets.length = 5;
    }

    let brightSpot = "Your consistency with daily habits";
    let worthNoticing = "Energy levels varied throughout the week";

    if (checkins.length > 0) {
      const maxMoodEntry = checkins.reduce(
        (max, checkin) => (checkin.mood > max.mood ? checkin : max),
        checkins[0],
      );

      if (maxMoodEntry.mood >= 4) {
        brightSpot = `You felt your best on ${new Date(maxMoodEntry.occurredAt).toLocaleDateString("en-US", { weekday: "long" })}`;
      }
    }

    if (completedHabits > 5) {
      worthNoticing = "Strong habit completion streak this week";
    } else if (completedHabits === 0) {
      worthNoticing = "This week included fewer logged habit completions.";
    }

    if (recoveryContext?.restDefinition) {
      bullets.push(`Your rest definition: ${recoveryContext.restDefinition}`);
    }

    if (recoveryContext?.knownTriggers?.length) {
      const topTriggers = recoveryContext.knownTriggers.slice(0, 2).join(", ");
      bullets.push(`Known triggers to keep in view: ${topTriggers}`);
    }

    const summary: WeeklySummary = {
      bullets: bullets.slice(0, 5),
      brightSpot,
      worthNoticing,
    };

    const safeSummary = passesWeeklySummaryTonePolicy(summary)
      ? summary
      : fallbackWeeklySummary();

    await ctx.runMutation(internal.commands.reviewCommands.applyGeneratedSummary, {
      reviewId: args.reviewId,
      bullets: safeSummary.bullets,
      brightSpot: safeSummary.brightSpot,
      worthNoticing: safeSummary.worthNoticing,
    });

    return safeSummary;
  },
});
