import {
  replayHabitEvents,
  type HabitAnchor,
  type HabitCadence,
  type HabitDifficulty,
  type HabitEvent,
} from "@seila/domain-kernel";
import { v, ConvexError } from "convex/values";

import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export const cadenceValidator = v.union(
  v.literal("daily"),
  v.literal("weekdays"),
  v.object({ customDays: v.array(v.number()) }),
);

export const anchorValidator = v.union(
  v.literal("morning"),
  v.literal("afternoon"),
  v.literal("evening"),
  v.literal("anytime"),
);

export const difficultyValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
);

const HABIT_EVENT_TYPES = new Set([
  "habit.created",
  "habit.completed",
  "habit.skipped",
  "habit.snoozed",
  "habit.archived",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseCadence(value: unknown): HabitCadence | null {
  if (value === "daily" || value === "weekdays") {
    return value;
  }

  if (isRecord(value) && Array.isArray(value.customDays)) {
    const customDays = value.customDays.filter((day): day is number => typeof day === "number");
    if (customDays.length > 0) {
      return { customDays };
    }
  }

  return null;
}

function parseStringEnum<T extends string>(value: unknown, allowed: ReadonlyArray<T>): T | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  if (allowed.includes(value as T)) {
    return value as T;
  }

  return undefined;
}

function eventFromDoc(doc: Doc<"events">): HabitEvent | null {
  if (!HABIT_EVENT_TYPES.has(doc.type) || !isRecord(doc.payload)) {
    return null;
  }

  const habitId = doc.payload.habitId;
  if (typeof habitId !== "string") {
    return null;
  }

  if (doc.type === "habit.created") {
    const name = doc.payload.name;
    const cadence = parseCadence(doc.payload.cadence);

    if (typeof name !== "string" || !cadence) {
      return null;
    }

    return {
      type: "habit.created",
      occurredAt: doc.occurredAt,
      idempotencyKey: doc.idempotencyKey,
      payload: {
        habitId,
        name,
        cadence,
        anchor: parseStringEnum<HabitAnchor>(doc.payload.anchor, [
          "morning",
          "afternoon",
          "evening",
          "anytime",
        ]),
        difficulty: parseStringEnum<HabitDifficulty>(doc.payload.difficulty, ["low", "medium", "high"]),
      },
      meta: {},
    };
  }

  if (doc.type === "habit.completed") {
    return {
      type: "habit.completed",
      occurredAt: doc.occurredAt,
      idempotencyKey: doc.idempotencyKey,
      payload: { habitId },
      meta: {},
    };
  }

  if (doc.type === "habit.skipped") {
    return {
      type: "habit.skipped",
      occurredAt: doc.occurredAt,
      idempotencyKey: doc.idempotencyKey,
      payload: { habitId },
      meta: {},
    };
  }

  if (doc.type === "habit.snoozed") {
    const snoozedUntil = doc.payload.snoozedUntil;
    if (typeof snoozedUntil !== "number") {
      return null;
    }

    return {
      type: "habit.snoozed",
      occurredAt: doc.occurredAt,
      idempotencyKey: doc.idempotencyKey,
      payload: {
        habitId,
        snoozedUntil,
      },
      meta: {},
    };
  }

  return {
    type: "habit.archived",
    occurredAt: doc.occurredAt,
    idempotencyKey: doc.idempotencyKey,
    payload: { habitId },
    meta: {},
  };
}

export async function getDedupedEventByIdempotencyKey(
  ctx: MutationCtx | QueryCtx,
  idempotencyKey: string,
) {
  return await ctx.db
    .query("events")
    .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", idempotencyKey))
    .first();
}

export async function listHabitEvents(ctx: MutationCtx | QueryCtx, habitId?: string) {
  const allEvents = await ctx.db.query("events").collect();

  const habitEvents = allEvents
    .map(eventFromDoc)
    .filter((event): event is HabitEvent => event !== null)
    .sort((a, b) => a.occurredAt - b.occurredAt);

  if (!habitId) {
    return habitEvents;
  }

  return habitEvents.filter((event) => event.payload.habitId === habitId);
}

export async function appendHabitEvent(ctx: MutationCtx, event: HabitEvent) {
  return await ctx.db.insert("events", {
    type: event.type,
    occurredAt: event.occurredAt,
    idempotencyKey: event.idempotencyKey,
    payload: event.payload,
  });
}

export function assertValidCustomCadence(cadence: HabitCadence) {
  if (typeof cadence === "string") {
    return;
  }

  if (cadence.customDays.length === 0) {
    throw new ConvexError("customDays cannot be empty");
  }

  for (const day of cadence.customDays) {
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      throw new ConvexError("customDays must use integers 0-6");
    }
  }
}

function pickLatestTimestamp(events: ReadonlyArray<HabitEvent>, type: HabitEvent["type"]) {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    if (events[i].type === type) {
      return events[i].occurredAt;
    }
  }

  return undefined;
}

function pickLatestSnoozedUntil(events: ReadonlyArray<HabitEvent>) {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    if (event.type === "habit.snoozed") {
      return event.payload.snoozedUntil;
    }
  }

  return undefined;
}

export async function syncHabitProjection(ctx: MutationCtx, habitId: Id<"habits">) {
  const habitKey = habitId as unknown as string;
  const habitEvents = await listHabitEvents(ctx, habitKey);
  const state = replayHabitEvents(habitEvents);
  const activeHabit = state.activeHabits[habitKey];

  const existingHabit = await ctx.db.get(habitId);
  if (!existingHabit) {
    return;
  }

  const lastCompletedAt = pickLatestTimestamp(habitEvents, "habit.completed");
  const lastSkippedAt = pickLatestTimestamp(habitEvents, "habit.skipped");
  const snoozedUntil = pickLatestSnoozedUntil(habitEvents);
  const archivedAt = pickLatestTimestamp(habitEvents, "habit.archived");

  if (!activeHabit) {
    await ctx.db.patch(habitId, {
      archivedAt: archivedAt ?? Date.now(),
      updatedAt: Date.now(),
      lastCompletedAt,
      lastSkippedAt,
      snoozedUntil,
    });
    return;
  }

  await ctx.db.patch(habitId, {
    name: activeHabit.name,
    cadence: activeHabit.cadence,
    anchor: activeHabit.anchor,
    difficulty: activeHabit.difficulty,
    updatedAt: Date.now(),
    lastCompletedAt,
    lastSkippedAt,
    snoozedUntil,
  });
}
