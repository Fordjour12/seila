import { describe, expect, test } from "bun:test";

import type { Command, LifeEvent } from "../index";
import {
  checkinReducer,
  handleCheckinCommand,
  initialCheckinState,
  type CheckinCommand as KernelCheckinCommand,
  type CheckinEvent as KernelCheckinEvent,
} from "../checkin";
import { createTraceHarness } from "../trace-harness";

type CheckinEvent = LifeEvent<
  "checkin.submitted" | "checkin.updated",
  {
    id: string;
    type: "daily" | "weekly";
    mood: 1 | 2 | 3 | 4 | 5;
    energy: 1 | 2 | 3 | 4 | 5;
    flags: string[];
    note?: string;
    weeklyAnswers?: {
      feltGood: string;
      feltHard: string;
      carryForward: string;
      aiSuggested?: string;
    };
  }
>;

type CheckinCommand =
  | Command<
      "checkin.submit",
      {
        type: "daily" | "weekly";
        mood: 1 | 2 | 3 | 4 | 5;
        energy: 1 | 2 | 3 | 4 | 5;
        flags: string[];
        note?: string;
        weeklyAnswers?: {
          feltGood: string;
          feltHard: string;
          carryForward: string;
          aiSuggested?: string;
        };
      }
    >
  | Command<
      "checkin.update",
      {
        checkinId: string;
        mood?: 1 | 2 | 3 | 4 | 5;
        energy?: 1 | 2 | 3 | 4 | 5;
        flags?: string[];
        note?: string;
      }
    >;

const checkinHarness = createTraceHarness<
  ReturnType<typeof checkinReducer>,
  CheckinEvent,
  CheckinCommand
>({
  initialState: initialCheckinState,
  reduce: checkinReducer as (
    state: ReturnType<typeof checkinReducer>,
    event: CheckinEvent,
  ) => ReturnType<typeof checkinReducer>,
  handleCommand: (events, command) => {
    const emitted = handleCheckinCommand(
      events as ReadonlyArray<KernelCheckinEvent>,
      command as KernelCheckinCommand,
    );
    return emitted as ReadonlyArray<CheckinEvent>;
  },
});

describe("checkin reducer", () => {
  test("submit daily checkin", () => {
    const result = checkinHarness
      .given([])
      .when({
        type: "checkin.submit",
        idempotencyKey: "checkin-1",
        requestedAt: Date.now(),
        payload: {
          type: "daily",
          mood: 4,
          energy: 3,
          flags: ["grateful", "focused"],
          note: "Feeling good today",
        },
        meta: {},
      });

    expect(result.state.checkins).toHaveLength(1);
    expect(result.state.checkins[0].type).toBe("daily");
    expect(result.state.checkins[0].mood).toBe(4);
    expect(result.state.checkins[0].energy).toBe(3);
    expect(result.state.checkins[0].flags).toEqual(["grateful", "focused"]);
    expect(result.state.checkins[0].note).toBe("Feeling good today");
    expect(result.state.moodTrend.averageMood).toBe(4);
    expect(result.state.moodTrend.averageEnergy).toBe(3);
    expect(result.state.moodTrend.daysTracked).toBe(1);
  });

  test("submit weekly checkin with answers", () => {
    const result = checkinHarness
      .given([])
      .when({
        type: "checkin.submit",
        idempotencyKey: "checkin-weekly-1",
        requestedAt: Date.now(),
        payload: {
          type: "weekly",
          mood: 3,
          energy: 2,
          flags: ["tired"],
          weeklyAnswers: {
            feltGood: "Finished the project",
            feltHard: "Not enough sleep",
            carryForward: "Keep exercising",
          },
        },
        meta: {},
      });

    expect(result.state.checkins).toHaveLength(1);
    expect(result.state.checkins[0].type).toBe("weekly");
    expect(result.state.checkins[0].weeklyAnswers?.feltGood).toBe("Finished the project");
    expect(result.state.checkins[0].weeklyAnswers?.feltHard).toBe("Not enough sleep");
    expect(result.state.checkins[0].weeklyAnswers?.carryForward).toBe("Keep exercising");
    expect(result.state.moodTrend.averageMood).toBe(3);
    expect(result.state.moodTrend.averageEnergy).toBe(2);
  });

  test("multiple checkins calculate correct averages", () => {
    const now = Date.now();
    const day1 = now - 2 * 24 * 60 * 60 * 1000;
    const day2 = now - 1 * 24 * 60 * 60 * 1000;

    const existingEvents: CheckinEvent[] = [
      {
        type: "checkin.submitted",
        occurredAt: day1,
        idempotencyKey: "checkin-1",
        payload: {
          id: "checkin-1",
          type: "daily",
          mood: 3,
          energy: 2,
          flags: [],
        },
        meta: {},
      },
      {
        type: "checkin.submitted",
        occurredAt: day2,
        idempotencyKey: "checkin-2",
        payload: {
          id: "checkin-2",
          type: "daily",
          mood: 4,
          energy: 3,
          flags: [],
        },
        meta: {},
      },
    ];

    const result = checkinHarness
      .given(existingEvents)
      .when({
        type: "checkin.submit",
        idempotencyKey: "checkin-3",
        requestedAt: now,
        payload: {
          type: "daily",
          mood: 5,
          energy: 4,
          flags: [],
        },
        meta: {},
      });

    expect(result.state.checkins).toHaveLength(3);
    expect(result.state.moodTrend.averageMood).toBe(4);
    expect(result.state.moodTrend.averageEnergy).toBe(3);
    expect(result.state.moodTrend.daysTracked).toBe(3);
  });

  test("update existing checkin", () => {
    const now = Date.now();

    const existingEvents: CheckinEvent[] = [
      {
        type: "checkin.submitted",
        occurredAt: now - 24 * 60 * 60 * 1000,
        idempotencyKey: "checkin-1",
        payload: {
          id: "checkin-1",
          type: "daily",
          mood: 2,
          energy: 1,
          flags: ["tired"],
          note: "Original note",
        },
        meta: {},
      },
    ];

    const result = checkinHarness
      .given(existingEvents)
      .when({
        type: "checkin.update",
        idempotencyKey: "checkin-update-1",
        requestedAt: now,
        payload: {
          checkinId: "checkin-1",
          mood: 3,
          energy: 2,
          note: "Updated note",
        },
        meta: {},
      });

    expect(result.state.checkins).toHaveLength(1);
    expect(result.state.checkins[0].mood).toBe(3);
    expect(result.state.checkins[0].energy).toBe(2);
    expect(result.state.checkins[0].note).toBe("Updated note");
    expect(result.state.checkins[0].flags).toEqual(["tired"]);
    expect(result.state.moodTrend.averageMood).toBe(3);
    expect(result.state.moodTrend.averageEnergy).toBe(2);
  });

  test("shame-free: no checkin is not tracked as negative state", () => {
    const result = checkinHarness.given([]).when({
      type: "checkin.submit",
      idempotencyKey: "checkin-1",
      requestedAt: Date.now(),
      payload: {
        type: "daily",
        mood: 1,
        energy: 1,
        flags: ["tired", "overwhelmed"],
      },
      meta: {},
    });

    expect(result.state.moodTrend.averageMood).toBe(1);
    expect(result.state.moodTrend.averageEnergy).toBe(1);
    expect(result.state.checkins.length).toBe(1);
  });
});
