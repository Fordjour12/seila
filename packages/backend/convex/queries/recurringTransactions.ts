import { v } from "convex/values";

import { query } from "../_generated/server";

type Cadence = "weekly" | "biweekly" | "monthly";
type RecurringState = {
  recurringId: string;
  amount: number;
  cadence: Cadence;
  nextDueAt: number;
  envelopeId?: string;
  merchantHint?: string;
  note?: string;
  createdAt: number;
  canceledAt?: number;
};

export const recurringTransactions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 20, 1), 100);
    const events = await ctx.db.query("events").collect();
    const byRecurringId = new Map<string, RecurringState>();

    for (const event of events.sort((a, b) => a.occurredAt - b.occurredAt)) {
      if (event.type === "finance.recurringTransactionScheduled") {
        const recurringId =
          typeof event.payload.recurringId === "string"
            ? event.payload.recurringId
            : String(event._id);
        byRecurringId.set(recurringId, {
          recurringId,
          amount: typeof event.payload.amount === "number" ? event.payload.amount : 0,
          cadence:
            typeof event.payload.cadence === "string"
              ? (event.payload.cadence as Cadence)
              : "monthly",
          nextDueAt:
            typeof event.payload.nextDueAt === "number"
              ? event.payload.nextDueAt
              : event.occurredAt,
          envelopeId:
            typeof event.payload.envelopeId === "string" ? event.payload.envelopeId : undefined,
          merchantHint:
            typeof event.payload.merchantHint === "string" ? event.payload.merchantHint : undefined,
          note: typeof event.payload.note === "string" ? event.payload.note : undefined,
          createdAt: event.occurredAt,
        });
        continue;
      }

      if (event.type === "finance.recurringTransactionUpdated") {
        const recurringId =
          typeof event.payload.recurringId === "string" ? event.payload.recurringId : "";
        const existing = recurringId ? byRecurringId.get(recurringId) : undefined;
        if (!existing) continue;

        byRecurringId.set(recurringId, {
          ...existing,
          cadence:
            typeof event.payload.cadence === "string"
              ? (event.payload.cadence as Cadence)
              : existing.cadence,
          nextDueAt:
            typeof event.payload.nextDueAt === "number"
              ? event.payload.nextDueAt
              : existing.nextDueAt,
          envelopeId:
            typeof event.payload.envelopeId === "string"
              ? event.payload.envelopeId
              : existing.envelopeId,
        });
        continue;
      }

      if (event.type === "finance.recurringTransactionCanceled") {
        const recurringId =
          typeof event.payload.recurringId === "string" ? event.payload.recurringId : "";
        const existing = recurringId ? byRecurringId.get(recurringId) : undefined;
        if (!existing) continue;
        byRecurringId.set(recurringId, {
          ...existing,
          canceledAt: event.occurredAt,
        });
      }
    }

    return Array.from(byRecurringId.values())
      .filter((recurring) => !recurring.canceledAt)
      .sort((a, b) => a.nextDueAt - b.nextDueAt)
      .slice(0, limit);
  },
});
