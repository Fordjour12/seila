import { describe, expect, test } from "bun:test";

import { createTraceHarness } from "../trace-harness";
import {
  handleHardModeCommand,
  hardModeReducer,
  initialHardModeState,
  type HardModeCommand,
  type HardModeEvent,
  type HardModeState,
} from "../hard-mode";

const harness = createTraceHarness<HardModeState, HardModeEvent, HardModeCommand>({
  initialState: initialHardModeState,
  reduce: hardModeReducer,
  handleCommand: handleHardModeCommand,
});

function baseActivation(now: number): HardModeCommand {
  return {
    type: "hardMode.activate",
    idempotencyKey: "hm.activate.1",
    requestedAt: now,
    payload: {
      sessionId: "session-1",
      scope: {
        habits: true,
        tasks: true,
        checkin: true,
        finance: false,
      },
      constraints: [
        {
          id: "c-anchor",
          type: "allowed_habit_anchors",
          anchors: ["morning", "anytime"],
        },
      ],
      windowStart: now,
      windowEnd: now + 24 * 60 * 60 * 1000,
    },
    meta: {},
  };
}

function basePlanCommand(now: number): HardModeCommand {
  return {
    type: "hardMode.planGenerated",
    idempotencyKey: "hm.plan.1",
    requestedAt: now + 1,
    payload: {
      sessionId: "session-1",
      plan: {
        dayStart: now,
        generatedAt: now + 1,
        items: [
          {
            id: "habit-1",
            module: "habits",
            kind: "habit.log",
            title: "Morning walk",
            scheduledAt: now + 30 * 60 * 1000,
            confidence: 0.85,
            rationale: "Start with the habit that usually settles your day.",
            habitAnchor: "morning",
            status: "planned",
          },
          {
            id: "task-1",
            module: "tasks",
            kind: "task.focus",
            title: "Focus on top inbox task",
            scheduledAt: now + 2 * 60 * 60 * 1000,
            confidence: 0.7,
            rationale: "One clear focus task reduces context switching.",
            status: "planned",
          },
          {
            id: "checkin-1",
            module: "checkin",
            kind: "checkin.submit",
            title: "Check in once",
            scheduledAt: now + 5 * 60 * 60 * 1000,
            confidence: 0.8,
            rationale: "A short check-in keeps the plan adaptive.",
            status: "planned",
          },
          {
            id: "task-2",
            module: "tasks",
            kind: "task.focus",
            title: "Optional follow-up task",
            scheduledAt: now + 7 * 60 * 60 * 1000,
            confidence: 0.4,
            rationale: "Low-confidence item that can drop first if needed.",
            status: "planned",
          },
        ],
      },
    },
    meta: {},
  };
}

describe("hard mode kernel", () => {
  test("activates and stores session", () => {
    const now = Date.now();
    const result = harness.given([]).when(baseActivation(now));

    expect(result.state.currentSession?.id).toBe("session-1");
    expect(result.state.currentSession?.isActive).toBe(true);
  });

  test("not_now flag postpones item", () => {
    const now = Date.now();
    const activated = harness.given([]).when(baseActivation(now));
    const withPlan = harness.given(activated.events).when(basePlanCommand(now));

    const flagged = harness.given(withPlan.events).when({
      type: "hardMode.itemFlag",
      idempotencyKey: "hm.flag.not-now",
      requestedAt: now + 2,
      payload: {
        sessionId: "session-1",
        itemId: "task-1",
        flag: "not_now",
      },
      meta: {},
    });

    const before = withPlan.state.currentSession?.plan?.items.find((item) => item.id === "task-1");
    const after = flagged.state.currentSession?.plan?.items.find((item) => item.id === "task-1");

    expect(before).toBeDefined();
    expect(after).toBeDefined();
    expect(after!.scheduledAt).toBe((before?.scheduledAt ?? 0) + 2 * 60 * 60 * 1000);
  });

  test("not_aligned flag drops only targeted item", () => {
    const now = Date.now();
    const activated = harness.given([]).when(baseActivation(now));
    const withPlan = harness.given(activated.events).when(basePlanCommand(now));

    const flagged = harness.given(withPlan.events).when({
      type: "hardMode.itemFlag",
      idempotencyKey: "hm.flag.not-aligned",
      requestedAt: now + 2,
      payload: {
        sessionId: "session-1",
        itemId: "task-1",
        flag: "not_aligned",
      },
      meta: {},
    });

    const target = flagged.state.currentSession?.plan?.items.find((item) => item.id === "task-1");
    const other = flagged.state.currentSession?.plan?.items.find((item) => item.id === "checkin-1");

    expect(target?.status).toBe("dropped");
    expect(other?.status).toBe("planned");
  });

  test("too_much flag drops target and lowest-confidence fallback", () => {
    const now = Date.now();
    const activated = harness.given([]).when(baseActivation(now));
    const withPlan = harness.given(activated.events).when(basePlanCommand(now));

    const flagged = harness.given(withPlan.events).when({
      type: "hardMode.itemFlag",
      idempotencyKey: "hm.flag.too-much",
      requestedAt: now + 2,
      payload: {
        sessionId: "session-1",
        itemId: "task-1",
        flag: "too_much",
      },
      meta: {},
    });

    const target = flagged.state.currentSession?.plan?.items.find((item) => item.id === "task-1");
    const droppedLowConfidence = flagged.state.currentSession?.plan?.items.find(
      (item) => item.id === "task-2",
    );

    expect(target?.status).toBe("dropped");
    expect(droppedLowConfidence?.status).toBe("dropped");
  });

  test("low-energy failsafe keeps one habit, one task, one checkin", () => {
    const now = Date.now();
    const activated = harness.given([]).when(baseActivation(now));

    const lowEnergyPlan = harness.given(activated.events).when({
      ...basePlanCommand(now),
      payload: {
        ...basePlanCommand(now).payload,
        lowEnergy: {
          mood: 2,
          energy: 2,
        },
      },
    });

    const items = lowEnergyPlan.state.currentSession?.plan?.items ?? [];

    const habits = items.filter((item) => item.module === "habits");
    const tasks = items.filter((item) => item.module === "tasks");
    const checkin = items.filter((item) => item.module === "checkin");

    expect(habits).toHaveLength(1);
    expect(tasks).toHaveLength(1);
    expect(checkin).toHaveLength(1);
    expect(items).toHaveLength(3);
  });

  test("constraint validation throws when habit anchor violates preference", () => {
    const now = Date.now();
    const activated = harness.given([]).when(baseActivation(now));

    expect(() =>
      harness.given(activated.events).when({
        ...basePlanCommand(now),
        payload: {
          ...basePlanCommand(now).payload,
          plan: {
            ...basePlanCommand(now).payload.plan,
            items: [
              {
                ...basePlanCommand(now).payload.plan.items[0],
                habitAnchor: "evening",
              },
            ],
          },
        },
      }),
    ).toThrow("Constraint violation: habit anchor is not allowed");
  });
});
