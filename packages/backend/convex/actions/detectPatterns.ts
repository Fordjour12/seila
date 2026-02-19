"use node";

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { makeFunctionReference } from "convex/server";

import { passesPatternTonePolicy } from "../patterns/tonePolicy";

type Candidate = {
  type: "mood_habit" | "energy_checkin_timing" | "spending_mood";
  correlation: number;
  confidence: number;
  headline: string;
  subtext: string;
};

const MIN_CONFIDENCE = 0.62;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const recoveryContextRef = makeFunctionReference<
  "query",
  {},
  {
    hardDayLooksLike?: string;
    knownTriggers: string[];
    restDefinition?: string;
  } | null
>("queries/recoveryContext:internalRecoveryContext");

function startOfUtcDay(timestamp: number) {
  const date = new Date(timestamp);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function createMoodHabitCandidate(input: {
  checkins: Array<{ mood: number; occurredAt: number }>;
  events: Array<{ type: string; occurredAt: number }>;
}): Candidate | null {
  const checkinByDay = new Map<number, number>();
  for (const checkin of input.checkins) {
    checkinByDay.set(startOfUtcDay(checkin.occurredAt), checkin.mood);
  }

  const habitCompletionDays = new Set<number>();
  for (const event of input.events) {
    if (event.type === "habit.completed") {
      habitCompletionDays.add(startOfUtcDay(event.occurredAt));
    }
  }

  const withHabit: number[] = [];
  const withoutHabit: number[] = [];

  for (const [day, mood] of checkinByDay.entries()) {
    if (habitCompletionDays.has(day)) {
      withHabit.push(mood);
    } else {
      withoutHabit.push(mood);
    }
  }

  if (withHabit.length < 3 || withoutHabit.length < 3) {
    return null;
  }

  const avgWith = average(withHabit);
  const avgWithout = average(withoutHabit);
  const delta = avgWith - avgWithout;

  if (Math.abs(delta) < 0.2) {
    return null;
  }

  const confidence = Math.min(0.95, 0.65 + Math.abs(delta) / 2.2);

  if (confidence < MIN_CONFIDENCE) {
    return null;
  }

  return {
    type: "mood_habit",
    correlation: delta,
    confidence,
    headline:
      delta >= 0
        ? "Mood tends to be higher on days you complete habits"
        : "Mood tends to be steadier on days with lighter habit activity",
    subtext: `Average mood difference: ${delta.toFixed(2)} points over the last 30 days.`,
  };
}

function createEnergyTimingCandidate(input: {
  checkins: Array<{ energy: number; occurredAt: number }>;
}): Candidate | null {
  const late: number[] = [];
  const early: number[] = [];

  for (const checkin of input.checkins) {
    const hour = new Date(checkin.occurredAt).getUTCHours();
    if (hour >= 21) {
      late.push(checkin.energy);
    } else {
      early.push(checkin.energy);
    }
  }

  if (late.length < 3 || early.length < 3) {
    return null;
  }

  const avgLate = average(late);
  const avgEarly = average(early);
  const delta = avgEarly - avgLate;

  if (Math.abs(delta) < 0.25) {
    return null;
  }

  const confidence = Math.min(0.94, 0.62 + Math.abs(delta) / 2);

  if (confidence < MIN_CONFIDENCE) {
    return null;
  }

  return {
    type: "energy_checkin_timing",
    correlation: delta,
    confidence,
    headline:
      delta >= 0
        ? "Earlier check-ins tend to align with higher energy"
        : "Later check-ins may be matching your energy rhythm",
    subtext: `Energy gap across check-in timing windows: ${delta.toFixed(2)} points.`,
  };
}

function createSpendingMoodCandidate(input: {
  checkins: Array<{ mood: number; occurredAt: number }>;
  transactions: Array<{ amount: number; occurredAt: number; pendingImport: boolean; voidedAt?: number }>;
}): Candidate | null {
  const spendingByDay = new Map<number, number>();
  for (const transaction of input.transactions) {
    if (transaction.pendingImport || transaction.voidedAt) {
      continue;
    }

    const day = startOfUtcDay(transaction.occurredAt);
    spendingByDay.set(day, (spendingByDay.get(day) ?? 0) + transaction.amount);
  }

  const lowMoodSpend: number[] = [];
  const otherMoodSpend: number[] = [];

  for (const checkin of input.checkins) {
    const day = startOfUtcDay(checkin.occurredAt);
    const spend = spendingByDay.get(day) ?? 0;

    if (checkin.mood <= 2) {
      lowMoodSpend.push(spend);
    } else {
      otherMoodSpend.push(spend);
    }
  }

  if (lowMoodSpend.length < 2 || otherMoodSpend.length < 3) {
    return null;
  }

  const lowAvg = average(lowMoodSpend);
  const otherAvg = average(otherMoodSpend);

  if (otherAvg === 0) {
    return null;
  }

  const ratio = lowAvg / otherAvg;
  const delta = lowAvg - otherAvg;

  if (ratio < 1.25) {
    return null;
  }

  const confidence = Math.min(0.92, 0.6 + (ratio - 1) / 1.4);

  if (confidence < MIN_CONFIDENCE) {
    return null;
  }

  return {
    type: "spending_mood",
    correlation: delta,
    confidence,
    headline: "Spending appears higher on lower-mood days",
    subtext: `Low-mood day spend averages ${(ratio * 100).toFixed(0)}% of other days.`,
  };
}

export const detectPatterns: ReturnType<typeof internalAction> = internalAction({
  args: {},
  handler: async (ctx): Promise<{ scanned: number; created: number }> => {
    const now = Date.now();
    const since = now - THIRTY_DAYS_MS;

    const [events, checkins, transactions, recoveryContext]: [
      Array<{ type: string; occurredAt: number }>,
      Array<{ mood: number; energy: number; occurredAt: number }>,
      Array<{ amount: number; occurredAt: number; pendingImport: boolean; voidedAt?: number }>,
      {
        hardDayLooksLike?: string;
        knownTriggers: string[];
        restDefinition?: string;
      } | null,
    ] = await Promise.all([
      ctx.runQuery(internal.queries.activePatterns.getRecentEventsForPatterns, {
        since,
      }),
      ctx.runQuery(internal.queries.activePatterns.getRecentCheckinsForPatterns, {
        since,
      }),
      ctx.runQuery(internal.queries.activePatterns.getRecentTransactionsForPatterns, {
        since,
      }),
      ctx.runQuery(recoveryContextRef, {}),
    ]);

    const candidates = [
      createMoodHabitCandidate({ checkins, events }),
      createEnergyTimingCandidate({ checkins }),
      createSpendingMoodCandidate({ checkins, transactions }),
    ]
      .filter((candidate): candidate is Candidate => candidate !== null)
      .filter((candidate) => candidate.confidence >= MIN_CONFIDENCE)
      .filter((candidate) => passesPatternTonePolicy(candidate))
      .map((candidate) => {
        if (!recoveryContext?.hardDayLooksLike) {
          return candidate;
        }

        return {
          ...candidate,
          subtext: `${candidate.subtext} Context note: ${recoveryContext.hardDayLooksLike}`.slice(0, 220),
        };
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    let created = 0;

    for (const candidate of candidates) {
      const persisted = await ctx.runMutation(
        internal.queries.activePatterns.upsertDetectedPattern,
        {
          type: candidate.type,
          correlation: candidate.correlation,
          confidence: candidate.confidence,
          headline: candidate.headline,
          subtext: candidate.subtext,
          detectedAt: now,
          expiresAt: now + 30 * DAY_MS,
        },
      );

      if (persisted.created) {
        created += 1;
      }
    }

    await ctx.runMutation(internal.queries.activePatterns.expireOldPatterns, {
      now,
    });

    return {
      scanned: candidates.length,
      created,
    };
  },
});
