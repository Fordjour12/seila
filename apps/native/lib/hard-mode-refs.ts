import type { FunctionReference } from "convex/server";
import { makeFunctionReference } from "convex/server";
import type { Id } from "@seila/backend/convex/_generated/dataModel";

export type HardModeModule = "habits" | "tasks" | "checkin" | "finance";

export type HardModeConstraint =
  | {
      id: string;
      type: "allowed_habit_anchors";
      anchors: Array<"morning" | "afternoon" | "evening" | "anytime">;
    }
  | {
      id: string;
      type: "max_planned_items";
      value: number;
    }
  | {
      id: string;
      type: "disallow_module";
      module: HardModeModule;
    };

export type HardModeScope = {
  habits: boolean;
  tasks: boolean;
  checkin: boolean;
  finance: boolean;
};

export type HardModePlannedItem = {
  id: string;
  module: HardModeModule;
  kind: string;
  title: string;
  scheduledAt: number;
  confidence: number;
  rationale: string;
  habitAnchor?: "morning" | "afternoon" | "evening" | "anytime";
  status: "planned" | "done" | "dropped";
  flaggedAt?: number;
};

export type HardModeSessionDoc = {
  _id: Id<"hardModeSessions">;
  scope: HardModeScope;
  constraints: HardModeConstraint[];
  windowStart: number;
  windowEnd: number;
  isActive: boolean;
  createdAt: number;
  deactivatedAt?: number;
  plan?: {
    dayStart: number;
    generatedAt: number;
    items: HardModePlannedItem[];
  };
};

export const hardModeSessionRef = makeFunctionReference<
  "query",
  {},
  HardModeSessionDoc | null
>("queries/hardModeSession:hardModeSession");

export const currentHardModePlanRef = makeFunctionReference<
  "query",
  {},
  {
    sessionId: Id<"hardModeSessions">;
    dayStart: number;
    generatedAt: number;
    items: HardModePlannedItem[];
  } | null
>("queries/currentHardModePlan:currentHardModePlan");

export const activateHardModeRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    scope: HardModeScope;
    constraints: HardModeConstraint[];
    durationDays: number;
  },
  { sessionId?: string; deduplicated: boolean }
>("commands/activateHardMode:activateHardMode");

export const flagHardModeItemRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    sessionId: Id<"hardModeSessions">;
    itemId: string;
    flag: "not_now" | "not_aligned" | "too_much";
  },
  { applied: boolean; deduplicated: boolean }
>("commands/flagItem:flagItem");

export const deactivateHardModeRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    sessionId: Id<"hardModeSessions">;
  },
  { deactivated: boolean; deduplicated: boolean }
>("commands/deactivateHardMode:deactivateHardMode");

export const extendHardModeRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    sessionId: Id<"hardModeSessions">;
    extendDays: number;
    confirmExtend: boolean;
  },
  { extended: boolean; deduplicated: boolean; newWindowEnd?: number }
>("commands/extendHardMode:extendHardMode");

export const crisisOverrideHardModeRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    sessionId: Id<"hardModeSessions">;
  },
  { cleared: boolean; deduplicated: boolean }
>("commands/crisisOverrideHardMode:crisisOverrideHardMode");

export function asMutationRef<TArgs extends Record<string, unknown>, TReturn>(
  ref: FunctionReference<"mutation", "public", TArgs, TReturn>,
) {
  return ref;
}

export function asQueryRef<TReturn>(
  ref: FunctionReference<"query", "public", {}, TReturn>,
) {
  return ref;
}
