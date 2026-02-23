import { v } from "convex/values";

import { query } from "../_generated/server";

type Cadence = "weekly" | "biweekly" | "monthly";
type RecurringKind = "regular" | "subscription";
type RecurringState = {
  recurringId: string;
  amount: number;
  cadence: Cadence;
  nextDueAt: number;
  kind: RecurringKind;
  category?: string;
  envelopeId?: string;
  merchantHint?: string;
  note?: string;
  createdAt: number;
  canceledAt?: number;
};

function parseRecurringKind(value: unknown, fallback: RecurringKind): RecurringKind {
  if (value === "regular" || value === "subscription") {
    return value;
  }
  return fallback;
}

function cadenceMonthlyEquivalent(amount: number, cadence: Cadence) {
  if (cadence === "weekly") return Math.round(amount * 4.345);
  if (cadence === "biweekly") return Math.round(amount * 2.1725);
  return amount;
}

export const recurringOverview = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 200);
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
          kind: parseRecurringKind(event.payload.kind, "regular"),
          category: typeof event.payload.category === "string" ? event.payload.category : undefined,
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
          amount:
            typeof event.payload.amount === "number" ? event.payload.amount : existing.amount,
          cadence:
            typeof event.payload.cadence === "string"
              ? (event.payload.cadence as Cadence)
              : existing.cadence,
          nextDueAt:
            typeof event.payload.nextDueAt === "number"
              ? event.payload.nextDueAt
              : existing.nextDueAt,
          kind: parseRecurringKind(event.payload.kind, existing.kind),
          category: event.payload.categoryCleared
            ? undefined
            : typeof event.payload.category === "string"
              ? event.payload.category
              : existing.category,
          envelopeId:
            event.payload.envelopeCleared
              ? undefined
              : typeof event.payload.envelopeId === "string"
                ? event.payload.envelopeId
                : existing.envelopeId,
          merchantHint:
            typeof event.payload.merchantHint === "string"
              ? event.payload.merchantHint
              : existing.merchantHint,
          note: typeof event.payload.note === "string" ? event.payload.note : existing.note,
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

    const active = Array.from(byRecurringId.values())
      .filter((recurring) => !recurring.canceledAt)
      .sort((a, b) => a.nextDueAt - b.nextDueAt);

    const now = Date.now();
    const dueSoonCutoff = now + 7 * 24 * 60 * 60 * 1000;

    const subscription = active.filter((item) => item.kind === "subscription");
    const regular = active.filter((item) => item.kind !== "subscription");

    return {
      items: active.slice(0, limit),
      summary: {
        activeCount: active.length,
        dueSoonCount: active.filter((item) => item.nextDueAt <= dueSoonCutoff).length,
        monthlyEquivalentTotal: active.reduce(
          (sum, item) => sum + cadenceMonthlyEquivalent(item.amount, item.cadence),
          0,
        ),
        subscriptionCount: subscription.length,
        subscriptionMonthlyEquivalent: subscription.reduce(
          (sum, item) => sum + cadenceMonthlyEquivalent(item.amount, item.cadence),
          0,
        ),
        regularCount: regular.length,
        regularMonthlyEquivalent: regular.reduce(
          (sum, item) => sum + cadenceMonthlyEquivalent(item.amount, item.cadence),
          0,
        ),
      },
    };
  },
});
