import { describe, expect, test } from "../test-compat.js";

import {
  PATTERN_TTL_MS,
  applyPatternTtl,
  initialPatternState,
  patternReducer,
  type PatternEvent,
} from "../patterns.js";

const NOW = Date.now();

function reduce(events: PatternEvent[]) {
  return events.reduce(patternReducer, initialPatternState);
}

describe("pattern reducer", () => {
  test("detect + surface pattern", () => {
    const state = reduce([
      {
        type: "pattern.detected",
        occurredAt: NOW,
        idempotencyKey: "p1",
        payload: {
          patternId: "p-1",
          type: "mood_habit",
          correlation: 0.41,
          confidence: 0.78,
          headline: "Mood trends higher on walk days",
          subtext: "Observed over the last month.",
        },
        meta: {},
      },
      {
        type: "pattern.surfaced",
        occurredAt: NOW + 1,
        idempotencyKey: "p2",
        payload: {
          patternId: "p-1",
        },
        meta: {},
      },
    ]);

    expect(state.patterns["p-1"]?.surfacedAt).toBe(NOW + 1);
  });

  test("dismiss removes pattern from active lifecycle", () => {
    const state = reduce([
      {
        type: "pattern.detected",
        occurredAt: NOW,
        idempotencyKey: "p3",
        payload: {
          patternId: "p-2",
          type: "spending_mood",
          correlation: 0.33,
          confidence: 0.67,
          headline: "Spending shifts on low-mood days",
          subtext: "A neutral trend to review.",
        },
        meta: {},
      },
      {
        type: "pattern.dismissed",
        occurredAt: NOW + 10,
        idempotencyKey: "p4",
        payload: {
          patternId: "p-2",
        },
        meta: {},
      },
    ]);

    expect(state.patterns["p-2"]?.dismissedAt).toBe(NOW + 10);
  });

  test("30-day ttl expires unpinned pattern", () => {
    const state = reduce([
      {
        type: "pattern.detected",
        occurredAt: NOW,
        idempotencyKey: "p5",
        payload: {
          patternId: "p-ttl",
          type: "energy_checkin_timing",
          correlation: 0.29,
          confidence: 0.72,
          headline: "Check-in timing aligns with energy",
          subtext: "Later check-ins tend to map to lower energy.",
        },
        meta: {},
      },
    ]);

    const expired = applyPatternTtl(state, NOW + PATTERN_TTL_MS + 1);
    expect(expired.patterns["p-ttl"]?.dismissedAt).toBeDefined();
  });

  test("pinned pattern does not expire", () => {
    const state = reduce([
      {
        type: "pattern.detected",
        occurredAt: NOW,
        idempotencyKey: "p6",
        payload: {
          patternId: "p-pin",
          type: "mood_habit",
          correlation: 0.4,
          confidence: 0.8,
          headline: "Pinned pattern",
          subtext: "Keep this around.",
        },
        meta: {},
      },
      {
        type: "pattern.pinned",
        occurredAt: NOW + 5,
        idempotencyKey: "p7",
        payload: {
          patternId: "p-pin",
        },
        meta: {},
      },
    ]);

    const afterTtl = applyPatternTtl(state, NOW + PATTERN_TTL_MS + 1000);
    expect(afterTtl.patterns["p-pin"]?.dismissedAt).toBeUndefined();
  });
});
