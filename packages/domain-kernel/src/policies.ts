import type { CheckinState } from "./checkin.js";
import type { HabitState } from "./habits.js";
import type { TaskState } from "./tasks.js";

export type SuggestionPriority = 1 | 2 | 3 | 4 | 5;

export type SuggestionPayloadValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[]
  | boolean[]
  | null[]
  | Record<string, string>
  | Record<string, number>
  | Record<string, boolean>
  | Record<string, null>
  | {}
  | {}[];

export type SuggestionAction = {
  type: "open_screen" | "run_command";
  label: string;
  payload?: Record<string, SuggestionPayloadValue>;
};

export type Suggestion = {
  id: string;
  policy:
    | "MorningHabitPrompt"
    | "CheckinPrompt"
    | "WeeklyReviewReady"
    | "EnvelopeApproaching"
    | "PatternSurface"
    | "FocusEmpty"
    | "RestPermission";
  headline: string;
  subtext: string;
  priority: SuggestionPriority;
  action?: SuggestionAction;
};

export type DomainState = {
  now: number;
  habits: HabitState;
  checkins: CheckinState;
  tasks: TaskState;
  finance: {
    envelopes: Array<{
      id: string;
      name: string;
      utilization: number;
    }>;
  };
  patterns: {
    activeCount: number;
  };
  weeklyReview: {
    due: boolean;
  };
};

export type PolicyFn = (state: DomainState) => Suggestion[];

const HOUR_MS = 60 * 60 * 1000;

function isoDay(now: number) {
  return new Date(now).getUTCDay();
}

function isoHour(now: number) {
  return new Date(now).getUTCHours();
}

export const morningHabitPromptPolicy: PolicyFn = (state) => {
  const hour = isoHour(state.now);
  const inMorningWindow = hour >= 5 && hour <= 11;

  if (!inMorningWindow) {
    return [];
  }

  const hasActiveHabits = Object.keys(state.habits.activeHabits).length > 0;
  const hasTodayHabitProgress = Object.keys(state.habits.todayLog).length > 0;

  if (!hasActiveHabits || hasTodayHabitProgress) {
    return [];
  }

  return [
    {
      id: "policy:morning-habit-prompt",
      policy: "MorningHabitPrompt",
      headline: "A gentle morning start is available",
      subtext: "Pick one habit to begin your day.",
      priority: 5,
      action: {
        type: "open_screen",
        label: "Open habits",
        payload: { screen: "habits" },
      },
    },
  ];
};

export const checkinPromptPolicy: PolicyFn = (state) => {
  const latest = state.checkins.checkins
    .slice()
    .sort((a, b) => b.occurredAt - a.occurredAt)[0];

  if (latest && state.now - latest.occurredAt < 24 * HOUR_MS) {
    return [];
  }

  return [
    {
      id: "policy:checkin-prompt",
      policy: "CheckinPrompt",
      headline: "Quick check-in available",
      subtext: "Log mood and energy in under a minute.",
      priority: 5,
      action: {
        type: "open_screen",
        label: "Check in",
        payload: { screen: "checkin" },
      },
    },
  ];
};

export const weeklyReviewReadyPolicy: PolicyFn = (state) => {
  const day = isoDay(state.now);
  const hour = isoHour(state.now);
  const sundayEvening = day === 0 && hour >= 17;

  if (!sundayEvening && !state.weeklyReview.due) {
    return [];
  }

  return [
    {
      id: "policy:weekly-review-ready",
      policy: "WeeklyReviewReady",
      headline: "Weekly review is ready",
      subtext: "A short reflection can help you reset for next week.",
      priority: 4,
      action: {
        type: "open_screen",
        label: "Start review",
        payload: { screen: "weekly-review" },
      },
    },
  ];
};

export const envelopeApproachingPolicy: PolicyFn = (state) => {
  const nearing = state.finance.envelopes
    .filter((envelope) => envelope.utilization >= 0.85 && envelope.utilization < 1)
    .sort((a, b) => b.utilization - a.utilization)[0];

  if (!nearing) {
    return [];
  }

  return [
    {
      id: "policy:envelope-approaching",
      policy: "EnvelopeApproaching",
      headline: `${nearing.name} is nearing its ceiling`,
      subtext: "Awareness only: adjust if helpful.",
      priority: 3,
      action: {
        type: "open_screen",
        label: "View finances",
        payload: { screen: "finance" },
      },
    },
  ];
};

export const patternSurfacePolicy: PolicyFn = (state) => {
  if (state.patterns.activeCount <= 0) {
    return [];
  }

  return [
    {
      id: "policy:pattern-surface",
      policy: "PatternSurface",
      headline: "A new pattern might be useful",
      subtext: "Review it and keep only what helps.",
      priority: 3,
      action: {
        type: "open_screen",
        label: "View patterns",
        payload: { screen: "patterns" },
      },
    },
  ];
};

export const focusEmptyPolicy: PolicyFn = (state) => {
  if (state.tasks.focus.length > 0 || state.tasks.inbox.length === 0) {
    return [];
  }

  return [
    {
      id: "policy:focus-empty",
      policy: "FocusEmpty",
      headline: "Focus is empty while inbox has tasks",
      subtext: "Move one task into Focus when ready.",
      priority: 4,
      action: {
        type: "open_screen",
        label: "Open tasks",
        payload: { screen: "tasks" },
      },
    },
  ];
};

export const restPermissionPolicy: PolicyFn = (state) => {
  const noFocus = state.tasks.focus.length === 0;
  const noHabitProgress = Object.keys(state.habits.todayLog).length === 0;
  const lowEnergy = state.checkins.checkins
    .slice()
    .sort((a, b) => b.occurredAt - a.occurredAt)[0]?.energy;

  if (!(noFocus && noHabitProgress)) {
    return [];
  }

  if (typeof lowEnergy === "number" && lowEnergy >= 3) {
    return [];
  }

  return [
    {
      id: "policy:rest-permission",
      policy: "RestPermission",
      headline: "Rest is a valid strategy",
      subtext: "You can pause without losing progress.",
      priority: 2,
    },
  ];
};

export const defaultPolicies: PolicyFn[] = [
  morningHabitPromptPolicy,
  checkinPromptPolicy,
  weeklyReviewReadyPolicy,
  envelopeApproachingPolicy,
  patternSurfacePolicy,
  focusEmptyPolicy,
  restPermissionPolicy,
];

export function runPolicies(state: DomainState, activePolicies: PolicyFn[]): Suggestion[] {
  const suggestions = activePolicies.flatMap((policy) => policy(state));
  const dedupedById = new Map<string, Suggestion>();

  for (const suggestion of suggestions) {
    const existing = dedupedById.get(suggestion.id);
    if (!existing || suggestion.priority > existing.priority) {
      dedupedById.set(suggestion.id, suggestion);
    }
  }

  return Array.from(dedupedById.values())
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);
}
