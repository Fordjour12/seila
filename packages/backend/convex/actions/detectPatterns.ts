"use node";

import { internalAction, type ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { makeFunctionReference } from "convex/server";

import { passesPatternTonePolicy } from "../patterns/tonePolicy";
import { readAiContext, writeAiContext } from "../lib/aiContext";
import { patternAgent } from "../agents/patternAgent";
import { tonePolicy } from "../lib/tonePolicy";
import { runAgentText } from "../lib/runAgentText";

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

/**
 * Uses the pattern agent to explain a candidate in plain language.
 * Falls back to the raw headline if agent fails.
 */
async function explainWithAgent(
  ctx: ActionCtx,
  candidate: Candidate,
): Promise<{ headline: string; subtext: string }> {
  try {
    const { thread } = await patternAgent.createThread(ctx);

    const result = await runAgentText(
      thread,
      `Explain this pattern in plain language.
               Pattern type: ${candidate.type}
               Correlation: ${candidate.correlation.toFixed(3)}
               Confidence: ${candidate.confidence.toFixed(2)}
               Raw headline: ${candidate.headline}
               Raw subtext: ${candidate.subtext}
               Max 2 sentences. Positive or neutral framing only.`,
    );

    const safe = tonePolicy(result.text);

    return {
      headline: safe.split(". ")[0] || candidate.headline,
      subtext: safe,
    };
  } catch {
    // Agent failure — fall back to rule-based headlines
    return {
      headline: candidate.headline,
      subtext: candidate.subtext,
    };
  }
}

export const detectPatterns: ReturnType<typeof internalAction> = internalAction({
  args: {},
  handler: async (ctx): Promise<{ scanned: number; created: number }> => {
    const aiContext = await readAiContext(ctx);
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
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    // Use agent to explain each candidate in plain language
    const explained = await Promise.all(
      candidates.map(async (candidate) => {
        const { headline, subtext } = await explainWithAgent(ctx, candidate);
        let finalSubtext = subtext;

        if (recoveryContext?.hardDayLooksLike) {
          finalSubtext = `${subtext} Context note: ${recoveryContext.hardDayLooksLike}`.slice(0, 220);
        }

        return { ...candidate, headline, subtext: finalSubtext };
      }),
    );

    let created = 0;

    for (const candidate of explained) {
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

    if (candidates.length > 0) {
      await writeAiContext(ctx, {
        workingModelPatch: {
          habitResonance: candidates.some((candidate) => candidate.type === "mood_habit")
            ? "Habit completion continues to correlate with better mood windows."
            : aiContext.workingModel.habitResonance,
        },
        memoryEntries: [
          {
            module: "patterns",
            observation: `Pattern scan surfaced ${candidates.length} candidates and created ${created}.`,
            confidence: "medium",
            source: "patternAgent",
          },
        ],
      });
    }

    return {
      scanned: candidates.length,
      created,
    };
  },
});
