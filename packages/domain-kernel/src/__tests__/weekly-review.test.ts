import { describe, expect, test } from "../test-compat.js";

import {
  handleReviewCommand,
  initialReviewState,
  reviewReducer,
  type ReviewCommand,
  type ReviewEvent,
  type ReviewState,
} from "../weekly-review.js";
import { createTraceHarness } from "../trace-harness.js";

const reviewHarness = createTraceHarness<ReviewState, ReviewEvent, ReviewCommand>({
  initialState: initialReviewState,
  reduce: reviewReducer,
  handleCommand: handleReviewCommand,
});

describe("weekly review reducer", () => {
  test("start review creates current review in lookback phase", () => {
    const result = reviewHarness.given([]).when({
      type: "review.start",
      idempotencyKey: "review-1",
      requestedAt: Date.now(),
      payload: {},
      meta: {},
    });

    expect(result.state.currentReview).not.toBeNull();
    expect(result.state.currentReview?.phase).toBe("lookback");
    expect(result.state.reviewHistory).toHaveLength(0);
  });

  test("submit reflection moves to reflect phase", () => {
    const startResult = reviewHarness.given([]).when({
      type: "review.start",
      idempotencyKey: "review-1",
      requestedAt: Date.now(),
      payload: {},
      meta: {},
    });

    const result = reviewHarness.given(startResult.events).when({
      type: "review.submitReflection",
      idempotencyKey: "review-1-reflection",
      requestedAt: Date.now(),
      payload: {
        feltGood: "Finished the project",
        feltHard: "Not enough sleep",
        carryForward: "Keep exercising",
      },
      meta: {},
    });

    expect(result.state.currentReview?.phase).toBe("reflect");
    expect(result.state.currentReview?.feltGood).toBe("Finished the project");
    expect(result.state.currentReview?.feltHard).toBe("Not enough sleep");
    expect(result.state.currentReview?.carryForward).toBe("Keep exercising");
  });

  test("set intentions moves to intentions phase", () => {
    const startResult = reviewHarness.given([]).when({
      type: "review.start",
      idempotencyKey: "review-1",
      requestedAt: Date.now(),
      payload: {},
      meta: {},
    });

    const reflectResult = reviewHarness.given(startResult.events).when({
      type: "review.submitReflection",
      idempotencyKey: "review-1-reflection",
      requestedAt: Date.now(),
      payload: {
        feltGood: "Finished the project",
        feltHard: "Not enough sleep",
        carryForward: "Keep exercising",
      },
      meta: {},
    });

    const result = reviewHarness.given(reflectResult.events).when({
      type: "review.setIntentions",
      idempotencyKey: "review-1-intentions",
      requestedAt: Date.now(),
      payload: {
        intentions: ["Exercise daily", "Sleep earlier", "Finish onboarding"],
      },
      meta: {},
    });

    expect(result.state.currentReview?.phase).toBe("intentions");
    expect(result.state.currentReview?.intentions).toHaveLength(3);
  });

  test("close review moves to history", () => {
    const startResult = reviewHarness.given([]).when({
      type: "review.start",
      idempotencyKey: "review-1",
      requestedAt: Date.now(),
      payload: {},
      meta: {},
    });

    const reflectResult = reviewHarness.given(startResult.events).when({
      type: "review.submitReflection",
      idempotencyKey: "review-1-reflection",
      requestedAt: Date.now(),
      payload: {
        feltGood: "Finished the project",
        feltHard: "Not enough sleep",
        carryForward: "Keep exercising",
      },
      meta: {},
    });

    const intentionsResult = reviewHarness.given(reflectResult.events).when({
      type: "review.setIntentions",
      idempotencyKey: "review-1-intentions",
      requestedAt: Date.now(),
      payload: {
        intentions: ["Exercise daily"],
      },
      meta: {},
    });

    const result = reviewHarness.given(intentionsResult.events).when({
      type: "review.close",
      idempotencyKey: "review-1-close",
      requestedAt: Date.now(),
      payload: {},
      meta: {},
    });

    expect(result.state.currentReview).toBeNull();
    expect(result.state.reviewHistory).toHaveLength(1);
    expect(result.state.reviewHistory[0].phase).toBe("closed");
    expect(result.state.reviewHistory[0].closedAt).toBeDefined();
  });

  test("skip review clears current review without adding to history", () => {
    const startResult = reviewHarness.given([]).when({
      type: "review.start",
      idempotencyKey: "review-1",
      requestedAt: Date.now(),
      payload: {},
      meta: {},
    });

    const result = reviewHarness.given(startResult.events).when({
      type: "review.skip",
      idempotencyKey: "review-1-skip",
      requestedAt: Date.now(),
      payload: {},
      meta: {},
    });

    expect(result.state.currentReview).toBeNull();
    expect(result.state.reviewHistory).toHaveLength(0);
  });

  test("full review flow end-to-end", () => {
    const now = Date.now();

    let result = reviewHarness.given([]).when({
      type: "review.start",
      idempotencyKey: "review-1",
      requestedAt: now,
      payload: {},
      meta: {},
    });

    expect(result.state.currentReview?.phase).toBe("lookback");

    result = reviewHarness.given(result.events).when({
      type: "review.submitReflection",
      idempotencyKey: "review-1-reflection",
      requestedAt: now + 1,
      payload: {
        feltGood: "Good week at work",
        feltHard: "Hard to wake up",
        carryForward: "Morning routine",
      },
      meta: {},
    });

    expect(result.state.currentReview?.phase).toBe("reflect");

    result = reviewHarness.given(result.events).when({
      type: "review.setIntentions",
      idempotencyKey: "review-1-intentions",
      requestedAt: now + 2,
      payload: {
        intentions: ["Wake up earlier", "Read more"],
      },
      meta: {},
    });

    expect(result.state.currentReview?.phase).toBe("intentions");

    result = reviewHarness.given(result.events).when({
      type: "review.close",
      idempotencyKey: "review-1-close",
      requestedAt: now + 3,
      payload: {},
      meta: {},
    });

    expect(result.state.currentReview).toBeNull();
    expect(result.state.reviewHistory).toHaveLength(1);
    expect(result.state.reviewHistory[0].intentions).toHaveLength(2);
    expect(result.state.reviewHistory[0].feltGood).toBe("Good week at work");
  });
});
