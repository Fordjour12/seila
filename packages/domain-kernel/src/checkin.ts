import type { Command, LifeEvent } from "./index.js";

export type Checkin = {
  id: string;
  type: CheckinType;
  mood: 1 | 2 | 3 | 4 | 5;
  energy: 1 | 2 | 3 | 4 | 5;
  flags: CheckinFlags[];
  note?: string;
  occurredAt: number;
  weeklyAnswers?: {
    feltGood: string;
    feltHard: string;
    carryForward: string;
    aiSuggested?: string;
  };
};

export type CheckinType = "daily" | "weekly";

export type CheckinFlags =
  | "anxious"
  | "grateful"
  | "overwhelmed"
  | "calm"
  | "tired"
  | "motivated"
  | "stressed"
  | "peaceful"
  | "isolated"
  | "connected"
  | "uncertain"
  | "focused";

export type SubmitCheckinPayload = {
  type: CheckinType;
  mood: 1 | 2 | 3 | 4 | 5;
  energy: 1 | 2 | 3 | 4 | 5;
  flags: CheckinFlags[];
  note?: string;
  weeklyAnswers?: {
    feltGood: string;
    feltHard: string;
    carryForward: string;
    aiSuggested?: string;
  };
};

export type UpdateCheckinPayload = {
  checkinId: string;
  mood?: 1 | 2 | 3 | 4 | 5;
  energy?: 1 | 2 | 3 | 4 | 5;
  flags?: CheckinFlags[];
  note?: string;
};

export type CheckinCommand =
  | Command<"checkin.submit", SubmitCheckinPayload>
  | Command<"checkin.update", UpdateCheckinPayload>;

export type CheckinSubmittedPayload = {
  id: string;
  type: CheckinType;
  mood: 1 | 2 | 3 | 4 | 5;
  energy: 1 | 2 | 3 | 4 | 5;
  flags: CheckinFlags[];
  note?: string;
  weeklyAnswers?: {
    feltGood: string;
    feltHard: string;
    carryForward: string;
    aiSuggested?: string;
  };
};

export type CheckinUpdatedPayload = {
  id: string;
  mood?: 1 | 2 | 3 | 4 | 5;
  energy?: 1 | 2 | 3 | 4 | 5;
  flags?: CheckinFlags[];
  note?: string;
};

export type CheckinEvent =
  | LifeEvent<"checkin.submitted", CheckinSubmittedPayload>
  | LifeEvent<"checkin.updated", CheckinUpdatedPayload>;

export type MoodTrend = {
  averageMood: number;
  averageEnergy: number;
  daysTracked: number;
};

export type CheckinState = {
  checkins: Checkin[];
  recentCheckins: Checkin[];
  moodTrend: MoodTrend;
};

export const initialCheckinState: CheckinState = {
  checkins: [],
  recentCheckins: [],
  moodTrend: {
    averageMood: 0,
    averageEnergy: 0,
    daysTracked: 0,
  },
};

function getDateKey(timestamp: number): string {
  return new Date(timestamp).toISOString().split("T")[0] ?? "";
}

export function checkinReducer(
  state: CheckinState,
  event: CheckinEvent,
): CheckinState {
  if (event.type === "checkin.submitted") {
    const newCheckin: Checkin = {
      id: event.idempotencyKey,
      type: event.payload.type,
      mood: event.payload.mood,
      energy: event.payload.energy,
      flags: event.payload.flags,
      note: event.payload.note,
      occurredAt: event.occurredAt,
      weeklyAnswers: event.payload.weeklyAnswers,
    };

    const allCheckins = [...state.checkins, newCheckin];

    const now = Date.now();
    const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;
    const recent = allCheckins.filter((c) => c.occurredAt >= fourteenDaysAgo);

    const moodSum = recent.reduce((sum, c) => sum + c.mood, 0);
    const energySum = recent.reduce((sum, c) => sum + c.energy, 0);

    const uniqueDays = new Set(recent.map((c) => getDateKey(c.occurredAt))).size;

    return {
      checkins: allCheckins,
      recentCheckins: recent,
      moodTrend: {
        averageMood: recent.length > 0 ? moodSum / recent.length : 0,
        averageEnergy: recent.length > 0 ? energySum / recent.length : 0,
        daysTracked: uniqueDays,
      },
    };
  }

  if (event.type === "checkin.updated") {
    const updatedCheckins = state.checkins.map((c) => {
      if (c.id === event.payload.id) {
        return {
          ...c,
          mood: event.payload.mood ?? c.mood,
          energy: event.payload.energy ?? c.energy,
          flags: event.payload.flags ?? c.flags,
          note: event.payload.note ?? c.note,
        };
      }
      return c;
    });

    const now = Date.now();
    const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;
    const recent = updatedCheckins.filter((c) => c.occurredAt >= fourteenDaysAgo);

    const moodSum = recent.reduce((sum, c) => sum + c.mood, 0);
    const energySum = recent.reduce((sum, c) => sum + c.energy, 0);

    const uniqueDays = new Set(recent.map((c) => getDateKey(c.occurredAt))).size;

    return {
      checkins: updatedCheckins,
      recentCheckins: recent,
      moodTrend: {
        averageMood: recent.length > 0 ? moodSum / recent.length : 0,
        averageEnergy: recent.length > 0 ? energySum / recent.length : 0,
        daysTracked: uniqueDays,
      },
    };
  }

  return state;
}

export function handleCheckinCommand(
  _events: ReadonlyArray<CheckinEvent>,
  command: CheckinCommand,
): ReadonlyArray<CheckinEvent> {
  if (command.type === "checkin.submit") {
    const evt: CheckinEvent = {
      type: "checkin.submitted",
      occurredAt: command.requestedAt,
      idempotencyKey: command.idempotencyKey,
      payload: {
        id: command.idempotencyKey,
        type: command.payload.type,
        mood: command.payload.mood,
        energy: command.payload.energy,
        flags: command.payload.flags,
        note: command.payload.note,
        weeklyAnswers: command.payload.weeklyAnswers,
      },
      meta: {},
    };
    return [evt];
  }

  if (command.type === "checkin.update") {
    const evt: CheckinEvent = {
      type: "checkin.updated",
      occurredAt: command.requestedAt,
      idempotencyKey: command.idempotencyKey,
      payload: {
        id: command.payload.checkinId,
        mood: command.payload.mood,
        energy: command.payload.energy,
        flags: command.payload.flags,
        note: command.payload.note,
      },
      meta: {},
    };
    return [evt];
  }

  return [];
}
