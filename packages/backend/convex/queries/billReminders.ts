import { query } from "../_generated/server";

const DAY_MS = 24 * 60 * 60 * 1000;

export const billReminders = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("events").collect();
    const recurringMap = new Map<string, {
      recurringId: string;
      name: string;
      amount: number;
      nextDueAt: number;
      canceledAt?: number;
    }>();

    for (const event of events.sort((a, b) => a.occurredAt - b.occurredAt)) {
      if (event.type === "finance.recurringTransactionScheduled") {
        const recurringId = typeof event.payload.recurringId === "string" 
          ? event.payload.recurringId 
          : String(event._id);
        recurringMap.set(recurringId, {
          recurringId,
          name: typeof event.payload.merchantHint === "string" ? event.payload.merchantHint : "Unnamed",
          amount: typeof event.payload.amount === "number" ? event.payload.amount : 0,
          nextDueAt: typeof event.payload.nextDueAt === "number" ? event.payload.nextDueAt : event.occurredAt,
        });
      } else if (event.type === "finance.recurringTransactionUpdated") {
        const recurringId = typeof event.payload.recurringId === "string" ? event.payload.recurringId : "";
        const existing = recurringMap.get(recurringId);
        if (existing) {
          recurringMap.set(recurringId, {
            ...existing,
            amount: typeof event.payload.amount === "number" ? event.payload.amount : existing.amount,
            nextDueAt: typeof event.payload.nextDueAt === "number" ? event.payload.nextDueAt : existing.nextDueAt,
          });
        }
      } else if (event.type === "finance.recurringTransactionCanceled") {
        const recurringId = typeof event.payload.recurringId === "string" ? event.payload.recurringId : "";
        const existing = recurringMap.get(recurringId);
        if (existing) {
          recurringMap.set(recurringId, {
            ...existing,
            canceledAt: event.occurredAt,
          });
        }
      }
    }

    const now = Date.now();
    const dueSoon = Array.from(recurringMap.values())
      .filter((sub) => !sub.canceledAt && sub.nextDueAt <= now + 10 * DAY_MS)
      .sort((a, b) => a.nextDueAt - b.nextDueAt)
      .map((sub) => ({
        recurringId: sub.recurringId,
        name: sub.name,
        amount: sub.amount,
        nextDueAt: sub.nextDueAt,
      }));

    return { dueSoon };
  },
});
