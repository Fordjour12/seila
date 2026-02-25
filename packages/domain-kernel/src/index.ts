export type Command<
  TType extends string,
  TPayload,
  TMeta extends Record<string, unknown> = Record<string, never>,
> = {
  type: TType;
  idempotencyKey: string;
  requestedAt: number;
  payload: TPayload;
  meta: TMeta;
};

export type LifeEvent<
  TType extends string,
  TPayload,
  TMeta extends Record<string, unknown> = Record<string, never>,
> = {
  type: TType;
  occurredAt: number;
  idempotencyKey: string;
  payload: TPayload;
  meta: TMeta;
};

export type AnyCommand = Command<string, unknown, Record<string, unknown>>;
export type AnyLifeEvent = LifeEvent<string, unknown, Record<string, unknown>>;

export * from "./habits.js";
export * from "./checkin.js";
export * from "./tasks.js";
export * from "./weekly-review.js";
export * from "./finance.js";
export * from "./policies.js";
export * from "./patterns.js";
export * from "./hard-mode.js";
export * from "./trace-harness.js";
