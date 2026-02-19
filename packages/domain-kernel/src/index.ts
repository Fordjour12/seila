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

export * from "./habits";
export * from "./checkin";
export * from "./tasks";
export * from "./weekly-review";
export * from "./finance";
export * from "./policies";
export * from "./patterns";
export * from "./hard-mode";
export * from "./trace-harness";
