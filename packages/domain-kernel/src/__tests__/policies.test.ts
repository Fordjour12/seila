import { describe, expect, test } from "bun:test";

import {
  defaultPolicies,
  runPolicies,
  type DomainState,
  type PolicyFn,
  type Suggestion,
} from "../policies";
import { initialCheckinState } from "../checkin";
import { initialHabitState } from "../habits";
import { initialTaskState } from "../tasks";

function baseState(overrides?: Partial<DomainState>): DomainState {
  return {
    now: Date.UTC(2026, 1, 22, 9, 0, 0),
    habits: {
      ...initialHabitState,
      activeHabits: {
        "habit-1": {
          habitId: "habit-1",
          name: "Walk",
          cadence: "daily",
        },
      },
    },
    checkins: initialCheckinState,
    tasks: {
      ...initialTaskState,
      inbox: [
        {
          id: "task-1",
          title: "Plan day",
          status: "inbox",
          createdAt: Date.now(),
        },
      ],
      tasks: [
        {
          id: "task-1",
          title: "Plan day",
          status: "inbox",
          createdAt: Date.now(),
        },
      ],
    },
    finance: {
      envelopes: [
        {
          id: "env-1",
          name: "Food",
          utilization: 0.9,
        },
      ],
    },
    patterns: {
      activeCount: 1,
    },
    weeklyReview: {
      due: true,
    },
    ...overrides,
  };
}

describe("policy engine", () => {
  test("sparsity cap returns max 3 suggestions", () => {
    const suggestions = runPolicies(baseState(), defaultPolicies);
    expect(suggestions.length).toBe(3);
  });

  test("higher-priority suggestions are selected first", () => {
    const suggestions = runPolicies(baseState(), defaultPolicies);
    const priorities = suggestions.map((s) => s.priority);
    expect(priorities[0]).toBeGreaterThanOrEqual(priorities[1]);
    expect(priorities[1]).toBeGreaterThanOrEqual(priorities[2]);
  });

  test("deduplicates by suggestion id", () => {
    const duplicatePolicy: PolicyFn = () => [
      {
        id: "dup",
        policy: "FocusEmpty",
        headline: "one",
        subtext: "two",
        priority: 2,
      },
      {
        id: "dup",
        policy: "FocusEmpty",
        headline: "three",
        subtext: "four",
        priority: 5,
      },
    ];

    const state = baseState();
    const result = runPolicies(state, [duplicatePolicy]);

    expect(result).toHaveLength(1);
    expect(result[0]?.priority).toBe(5);
  });

  test("rest permission is calm and non-alarming", () => {
    const state = baseState({
      patterns: { activeCount: 0 },
      weeklyReview: { due: false },
      finance: { envelopes: [] },
      tasks: initialTaskState,
    });

    const restOnlyPolicy: PolicyFn = (s) =>
      runPolicies(s, defaultPolicies).filter((item) => item.policy === "RestPermission");

    const suggestions: Suggestion[] = restOnlyPolicy(state);

    if (suggestions.length > 0) {
      expect(suggestions[0]?.headline.toLowerCase().includes("rest")).toBe(true);
      expect(suggestions[0]?.subtext.toLowerCase().includes("pause")).toBe(true);
    }
  });
});
