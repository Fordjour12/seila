import { describe, expect, test } from "bun:test";

import type { Command, LifeEvent } from "../index";
import { createTraceHarness } from "../trace-harness";

type CounterState = { count: number };
type CounterEvent = LifeEvent<"counter.incremented", { delta: number }>;
type CounterCommand = Command<"counter.increment", { delta: number }>;

const counterHarness = createTraceHarness<CounterState, CounterEvent, CounterCommand>({
  initialState: { count: 0 },
  reduce: (state, event) => {
    if (event.type !== "counter.incremented") {
      return state;
    }

    return {
      count: state.count + event.payload.delta,
    };
  },
  handleCommand: (_events, command) => {
    return [
      {
        type: "counter.incremented",
        occurredAt: Date.now(),
        idempotencyKey: command.idempotencyKey,
        payload: {
          delta: command.payload.delta,
        },
        meta: {},
      },
    ];
  },
});

describe("trace harness", () => {
  test("given(events).when(command).expect(state) works", () => {
    const trace = counterHarness
      .given([])
      .when({
        type: "counter.increment",
        idempotencyKey: "cmd-1",
        requestedAt: Date.now(),
        payload: { delta: 1 },
        meta: {},
      })
      .expect({ count: 1 });

    expect(trace.pass).toBe(true);
    expect(trace.state).toEqual({ count: 1 });
  });
});
