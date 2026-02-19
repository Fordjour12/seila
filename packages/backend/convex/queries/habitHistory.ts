import { v } from "convex/values";

import { query } from "../_generated/server";
import { listHabitEvents } from "../habits/shared";

export const habitHistory = query({
  args: {
    habitId: v.optional(v.id("habits")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const events = await listHabitEvents(ctx, args.habitId as unknown as string | undefined);
    const limit = Math.max(1, Math.min(args.limit ?? 50, 200));

    return events
      .sort((a, b) => b.occurredAt - a.occurredAt)
      .slice(0, limit)
      .map((event) => ({
        type: event.type,
        occurredAt: event.occurredAt,
        idempotencyKey: event.idempotencyKey,
        payload: event.payload,
      }));
  },
});
