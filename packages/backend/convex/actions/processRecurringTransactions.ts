"use node";

import { internalAction } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { makeFunctionReference } from "convex/server";

const recurringTransactionsRef = makeFunctionReference<
  "query",
  { limit?: number },
  Array<{
    recurringId: string;
    amount: number;
    cadence: "weekly" | "biweekly" | "monthly";
    nextDueAt: number;
    envelopeId?: string;
    merchantHint?: string;
    note?: string;
  }>
>("queries/recurringTransactions:recurringTransactions");

const logTransactionRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    amount: number;
    source: "manual" | "imported";
    envelopeId?: Id<"envelopes">;
    merchantHint?: string;
    note?: string;
  },
  { transactionId?: Id<"transactions">; deduplicated: boolean }
>("commands/transactions/logTransaction:logTransaction");

const updateRecurringTransactionRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    recurringId: string;
    cadence?: "weekly" | "biweekly" | "monthly";
    nextDueAt?: number;
    envelopeId?: Id<"envelopes">;
  },
  { recurringId?: string; deduplicated: boolean }
>("commands/recurring/updateRecurringTransaction:updateRecurringTransaction");

const recordRecurringTelemetryRef = makeFunctionReference<
  "mutation",
  { processed: number; skippedDueToLimit: number; dueCount: number; maxExecutions: number },
  { recorded: boolean }
>("commands/recurring/recordRecurringTelemetry:recordRecurringTelemetry");

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_EXECUTIONS_PER_RUN = 25;

function nextDueFrom(current: number, cadence: "weekly" | "biweekly" | "monthly") {
  if (cadence === "weekly") return current + 7 * DAY_MS;
  if (cadence === "biweekly") return current + 14 * DAY_MS;

  const currentDate = new Date(current);
  const nextDate = new Date(
    Date.UTC(
      currentDate.getUTCFullYear(),
      currentDate.getUTCMonth() + 1,
      currentDate.getUTCDate(),
      currentDate.getUTCHours(),
      currentDate.getUTCMinutes(),
      currentDate.getUTCSeconds(),
      currentDate.getUTCMilliseconds(),
    ),
  );
  return nextDate.getTime();
}

export const processRecurringTransactions = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const schedules = await ctx.runQuery(recurringTransactionsRef, {
      limit: 100,
    });

    const dueSchedules = schedules.filter((recurring) => recurring.nextDueAt <= now);
    let processed = 0;
    for (const recurring of dueSchedules) {
      if (processed >= MAX_EXECUTIONS_PER_RUN) {
        break;
      }

      const executionKey = `finance.recurring.execute:${recurring.recurringId}:${recurring.nextDueAt}`;
      await ctx.runMutation(logTransactionRef, {
        idempotencyKey: executionKey,
        amount: recurring.amount,
        source: "manual",
        envelopeId: recurring.envelopeId as Id<"envelopes"> | undefined,
        merchantHint: recurring.merchantHint,
        note: recurring.note ?? `Recurring ${recurring.cadence}`,
      });

      await ctx.runMutation(updateRecurringTransactionRef, {
        idempotencyKey: `${executionKey}:advance`,
        recurringId: recurring.recurringId,
        nextDueAt: nextDueFrom(recurring.nextDueAt, recurring.cadence),
      });

      processed += 1;
    }

    const skippedDueToLimit = Math.max(dueSchedules.length - processed, 0);
    await ctx.runMutation(recordRecurringTelemetryRef, {
      processed,
      skippedDueToLimit,
      dueCount: dueSchedules.length,
      maxExecutions: MAX_EXECUTIONS_PER_RUN,
    });

    return { processed, skippedDueToLimit };
  },
});
