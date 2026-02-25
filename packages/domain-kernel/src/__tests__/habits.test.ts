import { describe, expect, test } from "../test-compat.js";

import { createTraceHarness } from "../trace-harness.js";
import {
  type HabitCommand,
  habitReducer,
  initialHabitState,
  replayHabitEvents,
  type HabitEvent,
  type HabitState,
} from "../habits.js";

const NOW = Date.now();

function commandToEvent(command: HabitCommand): HabitEvent {
  if (command.type === "createHabit") {
    return {
      type: "habit.created",
      occurredAt: command.requestedAt,
      idempotencyKey: command.idempotencyKey,
      payload: {
        habitId: "habit-1",
        name: command.payload.name,
        cadence: command.payload.cadence,
        anchor: command.payload.anchor,
        difficulty: command.payload.difficulty,
      },
      meta: {},
    };
  }

  if (command.type === "updateHabit") {
    return {
      type: "habit.updated",
      occurredAt: command.requestedAt,
      idempotencyKey: command.idempotencyKey,
      payload: {
        habitId: command.payload.habitId,
        name: command.payload.name,
        cadence: command.payload.cadence,
        anchor: command.payload.anchor,
        difficulty: command.payload.difficulty,
      },
      meta: {},
    };
  }

  if (command.type === "logHabit") {
    return {
      type: "habit.completed",
      occurredAt: command.requestedAt,
      idempotencyKey: command.idempotencyKey,
      payload: { habitId: command.payload.habitId },
      meta: {},
    };
  }

  if (command.type === "skipHabit") {
    return {
      type: "habit.skipped",
      occurredAt: command.requestedAt,
      idempotencyKey: command.idempotencyKey,
      payload: { habitId: command.payload.habitId },
      meta: {},
    };
  }

  if (command.type === "snoozeHabit") {
    return {
      type: "habit.snoozed",
      occurredAt: command.requestedAt,
      idempotencyKey: command.idempotencyKey,
      payload: {
        habitId: command.payload.habitId,
        snoozedUntil: command.payload.snoozedUntil,
      },
      meta: {},
    };
  }

  return {
    type: "habit.archived",
    occurredAt: command.requestedAt,
    idempotencyKey: command.idempotencyKey,
    payload: {
      habitId: command.payload.habitId,
    },
    meta: {},
  };
}

const habitTrace = createTraceHarness<HabitState, HabitEvent, HabitCommand>({
  initialState: initialHabitState,
  reduce: habitReducer,
  handleCommand: (_events, command) => [commandToEvent(command)],
});

describe("habit reducer", () => {
  test("createHabit adds active habit", () => {
    const trace = habitTrace
      .given([])
      .when({
        type: "createHabit",
        idempotencyKey: "cmd-create",
        requestedAt: NOW,
        payload: {
          name: "Walk",
          cadence: "daily",
          anchor: "morning",
          difficulty: "low",
        },
        meta: {},
      })
      .expect({
        activeHabits: {
          "habit-1": {
            habitId: "habit-1",
            name: "Walk",
            cadence: "daily",
            anchor: "morning",
            difficulty: "low",
          },
        },
        todayLog: {},
      });

    expect(trace.pass).toBe(true);
  });

  test("logHabit marks habit completed", () => {
    const created = commandToEvent({
      type: "createHabit",
      idempotencyKey: "cmd-create-2",
      requestedAt: NOW,
      payload: { name: "Read", cadence: "daily" },
      meta: {},
    });

    const trace = habitTrace
      .given([created])
      .when({
        type: "logHabit",
        idempotencyKey: "cmd-log",
        requestedAt: NOW + 1,
        payload: { habitId: "habit-1" },
        meta: {},
      })
      .expect({
        activeHabits: {
          "habit-1": {
            habitId: "habit-1",
            name: "Read",
            cadence: "daily",
            anchor: undefined,
            difficulty: undefined,
          },
        },
        todayLog: {
          "habit-1": {
            status: "completed",
            occurredAt: NOW + 1,
          },
        },
      });

    expect(trace.pass).toBe(true);
  });

  test("skipHabit marks habit skipped", () => {
    const created = commandToEvent({
      type: "createHabit",
      idempotencyKey: "cmd-create-3",
      requestedAt: NOW,
      payload: { name: "Journal", cadence: "daily" },
      meta: {},
    });

    const trace = habitTrace
      .given([created])
      .when({
        type: "skipHabit",
        idempotencyKey: "cmd-skip",
        requestedAt: NOW + 2,
        payload: { habitId: "habit-1" },
        meta: {},
      })
      .expect({
        activeHabits: {
          "habit-1": {
            habitId: "habit-1",
            name: "Journal",
            cadence: "daily",
            anchor: undefined,
            difficulty: undefined,
          },
        },
        todayLog: {
          "habit-1": {
            status: "skipped",
            occurredAt: NOW + 2,
          },
        },
      });

    expect(trace.pass).toBe(true);
  });

  test("snoozeHabit marks habit snoozed", () => {
    const created = commandToEvent({
      type: "createHabit",
      idempotencyKey: "cmd-create-4",
      requestedAt: NOW,
      payload: { name: "Stretch", cadence: "daily" },
      meta: {},
    });

    const snoozedUntil = NOW + 60 * 60 * 1000;
    const trace = habitTrace
      .given([created])
      .when({
        type: "snoozeHabit",
        idempotencyKey: "cmd-snooze",
        requestedAt: NOW + 3,
        payload: {
          habitId: "habit-1",
          snoozedUntil,
        },
        meta: {},
      })
      .expect({
        activeHabits: {
          "habit-1": {
            habitId: "habit-1",
            name: "Stretch",
            cadence: "daily",
            anchor: undefined,
            difficulty: undefined,
          },
        },
        todayLog: {
          "habit-1": {
            status: "snoozed",
            occurredAt: NOW + 3,
            snoozedUntil,
          },
        },
      });

    expect(trace.pass).toBe(true);
  });

  test("archiveHabit removes habit from active list", () => {
    const created = commandToEvent({
      type: "createHabit",
      idempotencyKey: "cmd-create-5",
      requestedAt: NOW,
      payload: { name: "Meditate", cadence: "daily" },
      meta: {},
    });

    const trace = habitTrace
      .given([created])
      .when({
        type: "archiveHabit",
        idempotencyKey: "cmd-archive",
        requestedAt: NOW + 4,
        payload: { habitId: "habit-1" },
        meta: {},
      })
      .expect({
        activeHabits: {},
        todayLog: {},
      });

    expect(trace.pass).toBe(true);
  });

  test("updateHabit updates habit profile", () => {
    const created = commandToEvent({
      type: "createHabit",
      idempotencyKey: "cmd-create-6",
      requestedAt: NOW,
      payload: { name: "Meditate", cadence: "daily", anchor: "evening" },
      meta: {},
    });

    const trace = habitTrace
      .given([created])
      .when({
        type: "updateHabit",
        idempotencyKey: "cmd-update",
        requestedAt: NOW + 5,
        payload: {
          habitId: "habit-1",
          name: "Meditate (10 min)",
          cadence: "weekdays",
          anchor: "morning",
          difficulty: "medium",
        },
        meta: {},
      })
      .expect({
        activeHabits: {
          "habit-1": {
            habitId: "habit-1",
            name: "Meditate (10 min)",
            cadence: "weekdays",
            anchor: "morning",
            difficulty: "medium",
          },
        },
        todayLog: {},
      });

    expect(trace.pass).toBe(true);
  });

  test("create/update preserve target and timezone fields", () => {
    const created = commandToEvent({
      type: "createHabit",
      idempotencyKey: "cmd-create-target",
      requestedAt: NOW,
      payload: {
        name: "Read",
        cadence: "daily",
        targetValue: 20,
        targetUnit: "pages",
        timezone: "Africa/Accra",
      },
      meta: {},
    });

    const updated = commandToEvent({
      type: "updateHabit",
      idempotencyKey: "cmd-update-target",
      requestedAt: NOW + 1000,
      payload: {
        habitId: "habit-1",
        name: "Read Deeply",
        cadence: "daily",
        targetValue: 30,
        targetUnit: "pages",
        timezone: "America/New_York",
      },
      meta: {},
    });

    const state = replayHabitEvents([created, updated]);
    expect(state.activeHabits["habit-1"]?.targetValue).toBe(30);
    expect(state.activeHabits["habit-1"]?.targetUnit).toBe("pages");
    expect(state.activeHabits["habit-1"]?.timezone).toBe("America/New_York");
  });

  test("shame-free invariant: no missed status is derived", () => {
    const yesterday = NOW - 24 * 60 * 60 * 1000;
    const state = replayHabitEvents(
      [
        {
          type: "habit.created",
          occurredAt: yesterday,
          idempotencyKey: "evt-1",
          payload: {
            habitId: "habit-1",
            name: "Walk",
            cadence: "daily",
          },
          meta: {},
        },
      ],
      { forDate: NOW },
    );

    expect(state.activeHabits["habit-1"]).toBeDefined();
    expect(state.todayLog["habit-1"]).toBeUndefined();
  });
});
