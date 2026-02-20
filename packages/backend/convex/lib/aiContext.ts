import { makeFunctionReference } from "convex/server";
import type { ActionCtx } from "../_generated/server";

export type AiConfidence = "low" | "medium" | "high";

export type AiContextMemoryEntry = {
  occurredAt: number;
  module: string;
  observation: string;
  confidence: AiConfidence;
  source: string;
};

export type AiContextWorkingModel = {
  energyPatterns: string;
  habitResonance: string;
  flagPatterns: string;
  triggerSignals: string;
  suggestionResponse: string;
  reviewEngagement: string;
  financeRelationship: string;
};

export type AiContextCalibration = {
  preferredSuggestionVolume: "minimal" | "moderate" | "full";
  hardModePlanAccuracy: number;
  patternDismissRate: number;
  lastHardModeReflection?: number;
};

export type AiContextDoc = {
  _id: string;
  lastUpdated: number;
  workingModel: AiContextWorkingModel;
  memory: AiContextMemoryEntry[];
  calibration: AiContextCalibration;
};

export type AiContextPatch = {
  workingModelPatch?: Partial<AiContextWorkingModel>;
  memoryEntries?: Array<{
    occurredAt?: number;
    module: string;
    observation: string;
    confidence: AiConfidence;
    source: string;
  }>;
  calibrationPatch?: Partial<AiContextCalibration>;
};

export const DEFAULT_AI_CONTEXT = {
  lastUpdated: 0,
  workingModel: {
    energyPatterns: "Signals are still emerging.",
    habitResonance: "Habit consistency signal is building.",
    flagPatterns: "Not enough hard mode signal yet.",
    triggerSignals: "Trigger signal is still low-confidence.",
    suggestionResponse: "Suggestion response signal is still sparse.",
    reviewEngagement: "Weekly review usage signal is still sparse.",
    financeRelationship: "Finance-mood correlation signal is still sparse.",
  },
  memory: [] as AiContextMemoryEntry[],
  calibration: {
    preferredSuggestionVolume: "moderate" as const,
    hardModePlanAccuracy: 0.7,
    patternDismissRate: 0,
    lastHardModeReflection: undefined,
  },
};

const readAiContextRef = makeFunctionReference<"query", {}, AiContextDoc>(
  "queries/aiContext:internalReadAiContext",
);

const writeAiContextRef = makeFunctionReference<
  "mutation",
  AiContextPatch,
  { updated: boolean }
>("commands/aiContext:applyAiContextPatch");

export async function readAiContext(ctx: unknown) {
  const actionCtx = ctx as ActionCtx;
  return (await actionCtx.runQuery(readAiContextRef, {})) as AiContextDoc;
}

export async function writeAiContext(
  ctx: unknown,
  patch: AiContextPatch,
) {
  const actionCtx = ctx as ActionCtx;
  return (await actionCtx.runMutation(writeAiContextRef, patch)) as { updated: boolean };
}
