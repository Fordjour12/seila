import type { Command, LifeEvent } from "./index.js";

export type HabitCadence = "daily" | "weekdays" | { customDays: number[] };
export type HabitAnchor = "morning" | "afternoon" | "evening" | "anytime";
export type HabitDifficulty = "low" | "medium" | "high";
export type HabitKind = "build" | "break";
export type HabitStatus = "completed" | "skipped" | "snoozed" | "missed" | "relapsed";

export type CreateHabitCommand = Command<
  "createHabit",
  {
    name: string;
    cadence: HabitCadence;
    anchor?: HabitAnchor;
    difficulty?: HabitDifficulty;
    kind?: HabitKind;
    targetValue?: number;
    targetUnit?: string;
    timezone?: string;
    startDayKey?: string;
    endDayKey?: string;
  }
>;

export type LogHabitCommand = Command<"logHabit", { habitId: string }>;
export type SkipHabitCommand = Command<"skipHabit", { habitId: string }>;
export type SnoozeHabitCommand = Command<
  "snoozeHabit",
  {
    habitId: string;
    snoozedUntil: number;
  }
>;
export type ArchiveHabitCommand = Command<"archiveHabit", { habitId: string }>;
export type UpdateHabitCommand = Command<
  "updateHabit",
  {
    habitId: string;
    name: string;
    cadence: HabitCadence;
    anchor?: HabitAnchor;
    difficulty?: HabitDifficulty;
    kind?: HabitKind;
    targetValue?: number;
    targetUnit?: string;
    timezone?: string;
    startDayKey?: string;
    endDayKey?: string;
  }
>;

export type HabitCommand =
  | CreateHabitCommand
  | UpdateHabitCommand
  | LogHabitCommand
  | SkipHabitCommand
  | SnoozeHabitCommand
  | ArchiveHabitCommand;

export type HabitCreatedEvent = LifeEvent<
  "habit.created",
  {
    habitId: string;
    name: string;
    cadence: HabitCadence;
    anchor?: HabitAnchor;
    difficulty?: HabitDifficulty;
    kind?: HabitKind;
    targetValue?: number;
    targetUnit?: string;
    timezone?: string;
    startDayKey?: string;
    endDayKey?: string;
  }
>;

export type HabitCompletedEvent = LifeEvent<"habit.completed", { habitId: string }>;
export type HabitSkippedEvent = LifeEvent<"habit.skipped", { habitId: string }>;
export type HabitSnoozedEvent = LifeEvent<
  "habit.snoozed",
  {
    habitId: string;
    snoozedUntil: number;
  }
>;
export type HabitArchivedEvent = LifeEvent<"habit.archived", { habitId: string }>;
export type HabitUpdatedEvent = LifeEvent<
  "habit.updated",
  {
    habitId: string;
    name: string;
    cadence: HabitCadence;
    anchor?: HabitAnchor;
    difficulty?: HabitDifficulty;
    kind?: HabitKind;
    targetValue?: number;
    targetUnit?: string;
    timezone?: string;
    startDayKey?: string;
    endDayKey?: string;
  }
>;

export type HabitEvent =
  | HabitCreatedEvent
  | HabitUpdatedEvent
  | HabitCompletedEvent
  | HabitSkippedEvent
  | HabitSnoozedEvent
  | HabitArchivedEvent;

export type ActiveHabit = {
  habitId: string;
  name: string;
  cadence: HabitCadence;
  anchor?: HabitAnchor;
  difficulty?: HabitDifficulty;
  kind?: HabitKind;
  targetValue?: number;
  targetUnit?: string;
  timezone?: string;
  startDayKey?: string;
  endDayKey?: string;
};

export type HabitTodayLogEntry = {
  status: HabitStatus;
  occurredAt: number;
  snoozedUntil?: number;
};

export type HabitState = {
  activeHabits: Record<string, ActiveHabit>;
  todayLog: Record<string, HabitTodayLogEntry>;
};

export const initialHabitState: HabitState = {
  activeHabits: {},
  todayLog: {},
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getStartOfDayMs(at: number) {
  const date = new Date(at);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function isTodayEvent(event: HabitEvent, referenceAt: number) {
  const start = getStartOfDayMs(referenceAt);
  const end = start + DAY_IN_MS;
  return event.occurredAt >= start && event.occurredAt < end;
}

function isHabitInteractionEvent(
  event: HabitEvent,
): event is HabitCompletedEvent | HabitSkippedEvent | HabitSnoozedEvent {
  return (
    event.type === "habit.completed" ||
    event.type === "habit.skipped" ||
    event.type === "habit.snoozed"
  );
}

export function habitReducer(state: HabitState, event: HabitEvent): HabitState {
  if (event.type === "habit.created") {
    return {
      ...state,
      activeHabits: {
        ...state.activeHabits,
        [event.payload.habitId]: {
          habitId: event.payload.habitId,
          name: event.payload.name,
          cadence: event.payload.cadence,
          anchor: event.payload.anchor,
          difficulty: event.payload.difficulty,
          kind: event.payload.kind,
          targetValue: event.payload.targetValue,
          targetUnit: event.payload.targetUnit,
          timezone: event.payload.timezone,
          startDayKey: event.payload.startDayKey,
          endDayKey: event.payload.endDayKey,
        },
      },
    };
  }

  if (event.type === "habit.updated") {
    const current = state.activeHabits[event.payload.habitId];
    if (!current) {
      return state;
    }

    return {
      ...state,
      activeHabits: {
        ...state.activeHabits,
        [event.payload.habitId]: {
          ...current,
          name: event.payload.name,
          cadence: event.payload.cadence,
          anchor: event.payload.anchor,
          difficulty: event.payload.difficulty,
          kind: event.payload.kind,
          targetValue: event.payload.targetValue,
          targetUnit: event.payload.targetUnit,
          timezone: event.payload.timezone,
          startDayKey: event.payload.startDayKey,
          endDayKey: event.payload.endDayKey,
        },
      },
    };
  }

  if (event.type === "habit.archived") {
    const { [event.payload.habitId]: _archivedHabit, ...remainingHabits } = state.activeHabits;
    const { [event.payload.habitId]: _archivedLog, ...remainingLog } = state.todayLog;

    return {
      activeHabits: remainingHabits,
      todayLog: remainingLog,
    };
  }

  const activeHabit = state.activeHabits[event.payload.habitId];
  if (!activeHabit) {
    return state;
  }

  if (event.type === "habit.completed") {
    return {
      ...state,
      todayLog: {
        ...state.todayLog,
        [event.payload.habitId]: {
          status: "completed",
          occurredAt: event.occurredAt,
        },
      },
    };
  }

  if (event.type === "habit.skipped") {
    return {
      ...state,
      todayLog: {
        ...state.todayLog,
        [event.payload.habitId]: {
          status: "skipped",
          occurredAt: event.occurredAt,
        },
      },
    };
  }

  if (event.type === "habit.snoozed") {
    return {
      ...state,
      todayLog: {
        ...state.todayLog,
        [event.payload.habitId]: {
          status: "snoozed",
          occurredAt: event.occurredAt,
          snoozedUntil: event.payload.snoozedUntil,
        },
      },
    };
  }

  return state;
}

export function replayHabitEvents(
  events: ReadonlyArray<HabitEvent>,
  options?: {
    forDate?: number;
  },
): HabitState {
  const state = events.reduce(habitReducer, initialHabitState);

  if (!options?.forDate) {
    return state;
  }

  const todayLog: HabitState["todayLog"] = {};

  for (const event of events) {
    if (!isHabitInteractionEvent(event) || !isTodayEvent(event, options.forDate)) {
      continue;
    }

    if (event.type === "habit.completed") {
      todayLog[event.payload.habitId] = {
        status: "completed",
        occurredAt: event.occurredAt,
      };
      continue;
    }

    if (event.type === "habit.skipped") {
      todayLog[event.payload.habitId] = {
        status: "skipped",
        occurredAt: event.occurredAt,
      };
      continue;
    }

    todayLog[event.payload.habitId] = {
      status: "snoozed",
      occurredAt: event.occurredAt,
      snoozedUntil: event.payload.snoozedUntil,
    };
  }

  return {
    ...state,
    todayLog,
  };
}
