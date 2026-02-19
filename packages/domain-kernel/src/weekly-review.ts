import type { Command, LifeEvent } from "./index";

export type ReviewPhase = "lookback" | "reflect" | "intentions" | "closed";

export type StartReviewPayload = {};

export type SubmitReflectionPayload = {
  feltGood: string;
  feltHard: string;
  carryForward: string;
  aiSuggested?: string;
};

export type SetIntentionsPayload = {
  intentions: string[];
};

export type CloseReviewPayload = {};

export type SkipReviewPayload = {};

export type ReviewCommand =
  | Command<"review.start", StartReviewPayload>
  | Command<"review.submitReflection", SubmitReflectionPayload>
  | Command<"review.setIntentions", SetIntentionsPayload>
  | Command<"review.close", CloseReviewPayload>
  | Command<"review.skip", SkipReviewPayload>;

export type ReviewStartedPayload = {
  id: string;
  weekStart: number;
  weekEnd: number;
};

export type ReviewReflectionSubmittedPayload = {
  id: string;
  feltGood: string;
  feltHard: string;
  carryForward: string;
  aiSuggested?: string;
};

export type ReviewIntentionsSetPayload = {
  id: string;
  intentions: string[];
};

export type ReviewClosedPayload = {
  id: string;
  summaryGenerated?: boolean;
};

export type ReviewSkippedPayload = {
  weekStart: number;
  weekEnd: number;
};

export type ReviewEvent =
  | LifeEvent<"review.started", ReviewStartedPayload>
  | LifeEvent<"review.reflectionSubmitted", ReviewReflectionSubmittedPayload>
  | LifeEvent<"review.intentionsSet", ReviewIntentionsSetPayload>
  | LifeEvent<"review.closed", ReviewClosedPayload>
  | LifeEvent<"review.skipped", ReviewSkippedPayload>;

export type Review = {
  id: string;
  weekStart: number;
  weekEnd: number;
  phase: ReviewPhase;
  feltGood?: string;
  feltHard?: string;
  carryForward?: string;
  aiSuggested?: string;
  intentions: string[];
  summaryGenerated: boolean;
  createdAt: number;
  closedAt?: number;
  skippedAt?: number;
};

export type ReviewState = {
  currentReview: Review | null;
  reviewHistory: Review[];
};

export const initialReviewState: ReviewState = {
  currentReview: null,
  reviewHistory: [],
};

function getWeekBounds(date: Date = new Date()): { weekStart: number; weekEnd: number } {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(date.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return {
    weekStart: weekStart.getTime(),
    weekEnd: weekEnd.getTime(),
  };
}

export function reviewReducer(
  state: ReviewState,
  event: ReviewEvent,
): ReviewState {
  if (event.type === "review.started") {
    const newReview: Review = {
      id: event.payload.id,
      weekStart: event.payload.weekStart,
      weekEnd: event.payload.weekEnd,
      phase: "lookback",
      intentions: [],
      summaryGenerated: false,
      createdAt: event.occurredAt,
    };

    return {
      ...state,
      currentReview: newReview,
    };
  }

  if (event.type === "review.reflectionSubmitted") {
    if (!state.currentReview) return state;

    const updatedReview: Review = {
      ...state.currentReview,
      phase: "reflect",
      feltGood: event.payload.feltGood,
      feltHard: event.payload.feltHard,
      carryForward: event.payload.carryForward,
      aiSuggested: event.payload.aiSuggested,
    };

    return {
      ...state,
      currentReview: updatedReview,
    };
  }

  if (event.type === "review.intentionsSet") {
    if (!state.currentReview) return state;

    const updatedReview: Review = {
      ...state.currentReview,
      phase: "intentions",
      intentions: event.payload.intentions,
    };

    return {
      ...state,
      currentReview: updatedReview,
    };
  }

  if (event.type === "review.closed") {
    if (!state.currentReview) return state;

    const closedReview: Review = {
      ...state.currentReview,
      phase: "closed",
      closedAt: event.occurredAt,
      summaryGenerated: event.payload.summaryGenerated ?? false,
    };

    return {
      currentReview: null,
      reviewHistory: [...state.reviewHistory, closedReview],
    };
  }

  if (event.type === "review.skipped") {
    return {
      ...state,
      currentReview: null,
    };
  }

  return state;
}

export function handleReviewCommand(
  _events: ReadonlyArray<ReviewEvent>,
  command: ReviewCommand,
): ReadonlyArray<ReviewEvent> {
  const { weekStart, weekEnd } = getWeekBounds();

  if (command.type === "review.start") {
    const evt: ReviewEvent = {
      type: "review.started",
      occurredAt: command.requestedAt,
      idempotencyKey: command.idempotencyKey,
      payload: {
        id: command.idempotencyKey,
        weekStart,
        weekEnd,
      },
      meta: {},
    };
    return [evt];
  }

  if (command.type === "review.submitReflection") {
    const evt: ReviewEvent = {
      type: "review.reflectionSubmitted",
      occurredAt: command.requestedAt,
      idempotencyKey: command.idempotencyKey,
      payload: {
        id: command.idempotencyKey,
        feltGood: command.payload.feltGood,
        feltHard: command.payload.feltHard,
        carryForward: command.payload.carryForward,
        aiSuggested: command.payload.aiSuggested,
      },
      meta: {},
    };
    return [evt];
  }

  if (command.type === "review.setIntentions") {
    const evt: ReviewEvent = {
      type: "review.intentionsSet",
      occurredAt: command.requestedAt,
      idempotencyKey: command.idempotencyKey,
      payload: {
        id: command.idempotencyKey,
        intentions: command.payload.intentions,
      },
      meta: {},
    };
    return [evt];
  }

  if (command.type === "review.close") {
    const evt: ReviewEvent = {
      type: "review.closed",
      occurredAt: command.requestedAt,
      idempotencyKey: command.idempotencyKey,
      payload: {
        id: command.idempotencyKey,
        summaryGenerated: true,
      },
      meta: {},
    };
    return [evt];
  }

  if (command.type === "review.skip") {
    const evt: ReviewEvent = {
      type: "review.skipped",
      occurredAt: command.requestedAt,
      idempotencyKey: command.idempotencyKey,
      payload: {
        weekStart,
        weekEnd,
      },
      meta: {},
    };
    return [evt];
  }

  return [];
}
