import type { LifeEvent } from "./index.js";

export type PatternType = "mood_habit" | "energy_checkin_timing" | "spending_mood";

export type Pattern = {
  id: string;
  type: PatternType;
  correlation: number;
  confidence: number;
  headline: string;
  subtext: string;
  detectedAt: number;
  surfacedAt?: number;
  pinnedAt?: number;
  dismissedAt?: number;
  expiresAt: number;
};

export type PatternEvent =
  | LifeEvent<
      "pattern.detected",
      {
        patternId: string;
        type: PatternType;
        correlation: number;
        confidence: number;
        headline: string;
        subtext: string;
      }
    >
  | LifeEvent<"pattern.surfaced", { patternId: string }>
  | LifeEvent<"pattern.dismissed", { patternId: string }>
  | LifeEvent<"pattern.pinned", { patternId: string }>
  | LifeEvent<"pattern.expired", { patternId: string }>;

export type PatternState = {
  patterns: Record<string, Pattern>;
};

export const initialPatternState: PatternState = {
  patterns: {},
};

export const PATTERN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function patternReducer(state: PatternState, event: PatternEvent): PatternState {
  if (event.type === "pattern.detected") {
    const next: Pattern = {
      id: event.payload.patternId,
      type: event.payload.type,
      correlation: event.payload.correlation,
      confidence: event.payload.confidence,
      headline: event.payload.headline,
      subtext: event.payload.subtext,
      detectedAt: event.occurredAt,
      expiresAt: event.occurredAt + PATTERN_TTL_MS,
    };

    return {
      ...state,
      patterns: {
        ...state.patterns,
        [next.id]: next,
      },
    };
  }

  const existing = state.patterns[event.payload.patternId];
  if (!existing) {
    return state;
  }

  if (event.type === "pattern.surfaced") {
    return {
      ...state,
      patterns: {
        ...state.patterns,
        [existing.id]: {
          ...existing,
          surfacedAt: event.occurredAt,
        },
      },
    };
  }

  if (event.type === "pattern.dismissed") {
    return {
      ...state,
      patterns: {
        ...state.patterns,
        [existing.id]: {
          ...existing,
          dismissedAt: event.occurredAt,
        },
      },
    };
  }

  if (event.type === "pattern.pinned") {
    return {
      ...state,
      patterns: {
        ...state.patterns,
        [existing.id]: {
          ...existing,
          pinnedAt: event.occurredAt,
          expiresAt: existing.expiresAt,
        },
      },
    };
  }

  if (event.type === "pattern.expired") {
    return {
      ...state,
      patterns: {
        ...state.patterns,
        [existing.id]: {
          ...existing,
          dismissedAt: existing.dismissedAt ?? event.occurredAt,
        },
      },
    };
  }

  return state;
}

export function applyPatternTtl(state: PatternState, now: number): PatternState {
  const patterns: PatternState["patterns"] = { ...state.patterns };

  for (const pattern of Object.values(state.patterns)) {
    if (pattern.pinnedAt || pattern.dismissedAt) {
      continue;
    }

    if (pattern.expiresAt <= now) {
      patterns[pattern.id] = {
        ...pattern,
        dismissedAt: now,
      };
    }
  }

  return {
    patterns,
  };
}
