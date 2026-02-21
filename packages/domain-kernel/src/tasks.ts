import type { Command, LifeEvent } from "./index.js";

export type TaskStatus = "inbox" | "focus" | "deferred" | "completed" | "abandoned";

export type CaptureTaskPayload = {
  title: string;
};

export type FocusTaskPayload = {
  taskId: string;
};

export type DeferTaskPayload = {
  taskId: string;
  deferUntil?: number;
};

export type CompleteTaskPayload = {
  taskId: string;
};

export type AbandonTaskPayload = {
  taskId: string;
};

export type TaskCommand =
  | Command<"task.capture", CaptureTaskPayload>
  | Command<"task.focus", FocusTaskPayload>
  | Command<"task.defer", DeferTaskPayload>
  | Command<"task.complete", CompleteTaskPayload>
  | Command<"task.abandon", AbandonTaskPayload>;

export type TaskCreatedPayload = {
  id: string;
  title: string;
  status: "inbox";
};

export type TaskFocusedPayload = {
  id: string;
};

export type TaskDeferredPayload = {
  id: string;
  deferUntil?: number;
};

export type TaskCompletedPayload = {
  id: string;
};

export type TaskAbandonedPayload = {
  id: string;
};

export type TaskEvent =
  | LifeEvent<"task.created", TaskCreatedPayload>
  | LifeEvent<"task.focused", TaskFocusedPayload>
  | LifeEvent<"task.deferred", TaskDeferredPayload>
  | LifeEvent<"task.completed", TaskCompletedPayload>
  | LifeEvent<"task.abandoned", TaskAbandonedPayload>;

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: number;
  focusedAt?: number;
  deferredUntil?: number;
  completedAt?: number;
  abandonedAt?: number;
};

export type TaskState = {
  tasks: Task[];
  inbox: Task[];
  focus: Task[];
  deferred: Task[];
  completed: Task[];
  abandoned: Task[];
};

export const initialTaskState: TaskState = {
  tasks: [],
  inbox: [],
  focus: [],
  deferred: [],
  completed: [],
  abandoned: [],
};

export function taskReducer(state: TaskState, event: TaskEvent): TaskState {
  if (event.type === "task.created") {
    const newTask: Task = {
      id: event.payload.id,
      title: event.payload.title,
      status: "inbox",
      createdAt: event.occurredAt,
    };

    return {
      ...state,
      tasks: [...state.tasks, newTask],
      inbox: [...state.inbox, newTask],
    };
  }

  if (event.type === "task.focused") {
    const task = state.tasks.find((t) => t.id === event.payload.id);
    if (!task) return state;

    const currentFocusCount = state.focus.length;
    if (currentFocusCount >= 3) {
      return state;
    }

    const alreadyFocused = state.focus.some((t) => t.id === task.id);
    if (alreadyFocused) return state;

    const updatedTask: Task = {
      ...task,
      status: "focus",
      focusedAt: event.occurredAt,
    };

    return {
      ...state,
      tasks: state.tasks.map((t) => (t.id === task.id ? updatedTask : t)),
      inbox: state.inbox.filter((t) => t.id !== task.id),
      deferred: state.deferred.filter((t) => t.id !== task.id),
      focus: [...state.focus, updatedTask],
    };
  }

  if (event.type === "task.deferred") {
    const task = state.tasks.find((t) => t.id === event.payload.id);
    if (!task) return state;

    const updatedTask: Task = {
      ...task,
      status: "deferred",
      deferredUntil: event.payload.deferUntil,
    };

    return {
      ...state,
      tasks: state.tasks.map((t) => (t.id === task.id ? updatedTask : t)),
      inbox: state.inbox.filter((t) => t.id !== task.id),
      focus: state.focus.filter((t) => t.id !== task.id),
      deferred: [...state.deferred, updatedTask],
    };
  }

  if (event.type === "task.completed") {
    const task = state.tasks.find((t) => t.id === event.payload.id);
    if (!task) return state;

    const updatedTask: Task = {
      ...task,
      status: "completed",
      completedAt: event.occurredAt,
    };

    return {
      ...state,
      tasks: state.tasks.map((t) => (t.id === task.id ? updatedTask : t)),
      focus: state.focus.filter((t) => t.id !== task.id),
      completed: [...state.completed, updatedTask],
    };
  }

  if (event.type === "task.abandoned") {
    const task = state.tasks.find((t) => t.id === event.payload.id);
    if (!task) return state;

    const updatedTask: Task = {
      ...task,
      status: "abandoned",
      abandonedAt: event.occurredAt,
    };

    return {
      ...state,
      tasks: state.tasks.map((t) => (t.id === task.id ? updatedTask : t)),
      inbox: state.inbox.filter((t) => t.id !== task.id),
      focus: state.focus.filter((t) => t.id !== task.id),
      deferred: state.deferred.filter((t) => t.id !== task.id),
      abandoned: [...state.abandoned, updatedTask],
    };
  }

  return state;
}

export function handleTaskCommand(
  _events: ReadonlyArray<TaskEvent>,
  command: TaskCommand,
): ReadonlyArray<TaskEvent> {
  if (command.type === "task.capture") {
    const evt: TaskEvent = {
      type: "task.created",
      occurredAt: command.requestedAt,
      idempotencyKey: command.idempotencyKey,
      payload: {
        id: command.idempotencyKey,
        title: command.payload.title,
        status: "inbox",
      },
      meta: {},
    };
    return [evt];
  }

  if (command.type === "task.focus") {
    const evt: TaskEvent = {
      type: "task.focused",
      occurredAt: command.requestedAt,
      idempotencyKey: command.idempotencyKey,
      payload: {
        id: command.payload.taskId,
      },
      meta: {},
    };
    return [evt];
  }

  if (command.type === "task.defer") {
    const evt: TaskEvent = {
      type: "task.deferred",
      occurredAt: command.requestedAt,
      idempotencyKey: command.idempotencyKey,
      payload: {
        id: command.payload.taskId,
        deferUntil: command.payload.deferUntil,
      },
      meta: {},
    };
    return [evt];
  }

  if (command.type === "task.complete") {
    const evt: TaskEvent = {
      type: "task.completed",
      occurredAt: command.requestedAt,
      idempotencyKey: command.idempotencyKey,
      payload: {
        id: command.payload.taskId,
      },
      meta: {},
    };
    return [evt];
  }

  if (command.type === "task.abandon") {
    const evt: TaskEvent = {
      type: "task.abandoned",
      occurredAt: command.requestedAt,
      idempotencyKey: command.idempotencyKey,
      payload: {
        id: command.payload.taskId,
      },
      meta: {},
    };
    return [evt];
  }

  return [];
}
