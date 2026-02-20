import { describe, expect, test } from "bun:test";

import type { Command, LifeEvent } from "../index";
import {
  handleTaskCommand,
  initialTaskState,
  type TaskCommand as KernelTaskCommand,
  type TaskEvent as KernelTaskEvent,
  taskReducer,
} from "../tasks";
import { createTraceHarness } from "../trace-harness";

type TaskEvent = LifeEvent<
  | "task.created"
  | "task.focused"
  | "task.deferred"
  | "task.completed"
  | "task.abandoned",
  { id: string; title?: string; deferUntil?: number; status?: string }
>;

type TaskCommand =
  | Command<"task.capture", { title: string }>
  | Command<"task.focus", { taskId: string }>
  | Command<"task.defer", { taskId: string; deferUntil?: number }>
  | Command<"task.complete", { taskId: string }>
  | Command<"task.abandon", { taskId: string }>;

const taskHarness = createTraceHarness<
  ReturnType<typeof taskReducer>,
  TaskEvent,
  TaskCommand
>({
  initialState: initialTaskState,
  reduce: taskReducer as (
    state: ReturnType<typeof taskReducer>,
    event: TaskEvent,
  ) => ReturnType<typeof taskReducer>,
  handleCommand: (events, command) => {
    const emitted = handleTaskCommand(
      events as ReadonlyArray<KernelTaskEvent>,
      command as KernelTaskCommand,
    );
    return emitted as ReadonlyArray<TaskEvent>;
  },
});

describe("task reducer", () => {
  test("capture task adds to inbox", () => {
    const result = taskHarness.given([]).when({
      type: "task.capture",
      idempotencyKey: "task-1",
      requestedAt: Date.now(),
      payload: { title: "Buy groceries" },
      meta: {},
    });

    expect(result.state.tasks).toHaveLength(1);
    expect(result.state.inbox).toHaveLength(1);
    expect(result.state.inbox[0].title).toBe("Buy groceries");
    expect(result.state.inbox[0].status).toBe("inbox");
    expect(result.state.focus).toHaveLength(0);
  });

  test("focus task moves to focus list", () => {
    const captureResult = taskHarness.given([]).when({
      type: "task.capture",
      idempotencyKey: "task-1",
      requestedAt: Date.now(),
      payload: { title: "Buy groceries" },
      meta: {},
    });

    const result = taskHarness.given(captureResult.events).when({
      type: "task.focus",
      idempotencyKey: "task-1-focus",
      requestedAt: Date.now(),
      payload: { taskId: "task-1" },
      meta: {},
    });

    expect(result.state.inbox).toHaveLength(0);
    expect(result.state.focus).toHaveLength(1);
    expect(result.state.focus[0].title).toBe("Buy groceries");
    expect(result.state.focus[0].status).toBe("focus");
  });

  test("complete task moves to completed", () => {
    const captureResult = taskHarness.given([]).when({
      type: "task.capture",
      idempotencyKey: "task-1",
      requestedAt: Date.now(),
      payload: { title: "Buy groceries" },
      meta: {},
    });

    const focusResult = taskHarness.given(captureResult.events).when({
      type: "task.focus",
      idempotencyKey: "task-1-focus",
      requestedAt: Date.now(),
      payload: { taskId: "task-1" },
      meta: {},
    });

    const result = taskHarness.given(focusResult.events).when({
      type: "task.complete",
      idempotencyKey: "task-1-complete",
      requestedAt: Date.now(),
      payload: { taskId: "task-1" },
      meta: {},
    });

    expect(result.state.focus).toHaveLength(0);
    expect(result.state.completed).toHaveLength(1);
    expect(result.state.completed[0].status).toBe("completed");
  });

  test("abandon task removes from active lists", () => {
    const captureResult = taskHarness.given([]).when({
      type: "task.capture",
      idempotencyKey: "task-1",
      requestedAt: Date.now(),
      payload: { title: "Buy groceries" },
      meta: {},
    });

    const focusResult = taskHarness.given(captureResult.events).when({
      type: "task.focus",
      idempotencyKey: "task-1-focus",
      requestedAt: Date.now(),
      payload: { taskId: "task-1" },
      meta: {},
    });

    const result = taskHarness.given(focusResult.events).when({
      type: "task.abandon",
      idempotencyKey: "task-1-abandon",
      requestedAt: Date.now(),
      payload: { taskId: "task-1" },
      meta: {},
    });

    expect(result.state.focus).toHaveLength(0);
    expect(result.state.inbox).toHaveLength(0);
    expect(result.state.abandoned).toHaveLength(1);
    expect(result.state.abandoned[0].status).toBe("abandoned");
  });

  test("defer task moves to deferred list", () => {
    const captureResult = taskHarness.given([]).when({
      type: "task.capture",
      idempotencyKey: "task-1",
      requestedAt: Date.now(),
      payload: { title: "Buy groceries" },
      meta: {},
    });

    const result = taskHarness.given(captureResult.events).when({
      type: "task.defer",
      idempotencyKey: "task-1-defer",
      requestedAt: Date.now(),
      payload: { taskId: "task-1", deferUntil: Date.now() + 24 * 60 * 60 * 1000 },
      meta: {},
    });

    expect(result.state.inbox).toHaveLength(0);
    expect(result.state.deferred).toHaveLength(1);
    expect(result.state.deferred[0].status).toBe("deferred");
  });

  test("3-item Focus invariant: fourth item rejected", () => {
    const now = Date.now();

    const existingEvents: TaskEvent[] = [
      {
        type: "task.created",
        occurredAt: now - 1000,
        idempotencyKey: "task-1",
        payload: { id: "task-1", title: "Task 1", status: "inbox" },
        meta: {},
      },
      {
        type: "task.focused",
        occurredAt: now - 500,
        idempotencyKey: "task-1-focus",
        payload: { id: "task-1" },
        meta: {},
      },
      {
        type: "task.created",
        occurredAt: now - 900,
        idempotencyKey: "task-2",
        payload: { id: "task-2", title: "Task 2", status: "inbox" },
        meta: {},
      },
      {
        type: "task.focused",
        occurredAt: now - 400,
        idempotencyKey: "task-2-focus",
        payload: { id: "task-2" },
        meta: {},
      },
      {
        type: "task.created",
        occurredAt: now - 800,
        idempotencyKey: "task-3",
        payload: { id: "task-3", title: "Task 3", status: "inbox" },
        meta: {},
      },
      {
        type: "task.focused",
        occurredAt: now - 300,
        idempotencyKey: "task-3-focus",
        payload: { id: "task-3" },
        meta: {},
      },
    ];

    const captureResult = taskHarness.given(existingEvents).when({
      type: "task.capture",
      idempotencyKey: "task-4",
      requestedAt: now,
      payload: { title: "Task 4" },
      meta: {},
    });

    const result = taskHarness.given(captureResult.events).when({
      type: "task.focus",
      idempotencyKey: "task-4-focus",
      requestedAt: now,
      payload: { taskId: "task-4" },
      meta: {},
    });

    expect(result.state.focus).toHaveLength(3);
    expect(result.state.inbox).toHaveLength(1);
    expect(result.state.inbox[0].title).toBe("Task 4");
  });

  test("shame-free: abandoned tasks are not tracked negatively", () => {
    const captureResult = taskHarness.given([]).when({
      type: "task.capture",
      idempotencyKey: "task-1",
      requestedAt: Date.now(),
      payload: { title: "Task that no longer matters" },
      meta: {},
    });

    const result = taskHarness.given(captureResult.events).when({
      type: "task.abandon",
      idempotencyKey: "task-1-abandon",
      requestedAt: Date.now(),
      payload: { taskId: "task-1" },
      meta: {},
    });

    expect(result.state.tasks).toHaveLength(1);
    expect(result.state.abandoned).toHaveLength(1);
    expect(result.state.focus).toHaveLength(0);
    expect(result.state.inbox).toHaveLength(0);
  });
});
