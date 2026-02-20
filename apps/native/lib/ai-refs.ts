import { makeFunctionReference } from "convex/server";

export const aiContextViewRef = makeFunctionReference<
  "query",
  {},
  {
    lastUpdated: number;
    workingModel: {
      energyPatterns: string;
      habitResonance: string;
      flagPatterns: string;
      triggerSignals: string;
      suggestionResponse: string;
      reviewEngagement: string;
      financeRelationship: string;
    };
    memory: Array<{
      occurredAt: number;
      module: string;
      observation: string;
      confidence: "low" | "medium" | "high";
      source: string;
    }>;
    calibration: {
      preferredSuggestionVolume: "minimal" | "moderate" | "full";
      hardModePlanAccuracy: number;
      patternDismissRate: number;
      lastHardModeReflection?: number;
    };
  }
>("queries/aiContext:aiContext");

export const clearAiContextRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string },
  { cleared: boolean; deduplicated: boolean }
>("commands/clearAiContext:clearAiContext");

export const initAiContextRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string },
  { initialized: boolean; deduplicated: boolean }
>("commands/initAiContext:initAiContext");

export const processCaptureRef = makeFunctionReference<
  "action",
  { text: string },
  { reply: string }
>("actions/processCapture:processCapture");
