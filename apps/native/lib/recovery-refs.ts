import type { Id } from "@seila/backend/convex/_generated/dataModel";
import { makeFunctionReference } from "convex/server";

export const todayScratchpadRef = makeFunctionReference<
  "query",
  {},
  Array<{ _id: Id<"scratchpadEntries">; text: string; createdAt: number; triagedAt?: number }>
>("queries/scratchpad:todayScratchpad");

export const captureScratchpadRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; text: string },
  { captured: boolean; deduplicated: boolean; entryId?: Id<"scratchpadEntries"> }
>("commands/captureScratchpad:captureScratchpad");

export const triageScratchpadRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; entryId: Id<"scratchpadEntries"> },
  { triaged: boolean; deduplicated: boolean }
>("commands/triageScratchpad:triageScratchpad");

export const quietTodayRef = makeFunctionReference<
  "query",
  {},
  { isQuiet: boolean; reason?: string; dayStart: number }
>("queries/quietToday:quietToday");

export const setQuietTodayRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; isQuiet: boolean; reason?: string },
  { updated: boolean; deduplicated: boolean; isQuiet: boolean }
>("commands/setQuietToday:setQuietToday");

export const recoveryContextRef = makeFunctionReference<
  "query",
  {},
  {
    _id: Id<"recoveryContext">;
    hardDayLooksLike?: string;
    knownTriggers: string[];
    restDefinition?: string;
  } | null
>("queries/recoveryContext:recoveryContext");

export const upsertRecoveryContextRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    hardDayLooksLike?: string;
    knownTriggers: string[];
    restDefinition?: string;
  },
  { updated: boolean; deduplicated: boolean }
>("commands/upsertRecoveryContext:upsertRecoveryContext");
