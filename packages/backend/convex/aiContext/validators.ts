import { v } from "convex/values";

export const aiConfidenceValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
);

export const aiWorkingModelValidator = v.object({
  energyPatterns: v.string(),
  habitResonance: v.string(),
  flagPatterns: v.string(),
  triggerSignals: v.string(),
  suggestionResponse: v.string(),
  reviewEngagement: v.string(),
  financeRelationship: v.string(),
});

export const aiMemoryEntryValidator = v.object({
  occurredAt: v.number(),
  module: v.string(),
  observation: v.string(),
  confidence: aiConfidenceValidator,
  source: v.string(),
});

export const aiCalibrationValidator = v.object({
  preferredSuggestionVolume: v.union(
    v.literal("minimal"),
    v.literal("moderate"),
    v.literal("full"),
  ),
  hardModePlanAccuracy: v.number(),
  patternDismissRate: v.number(),
  lastHardModeReflection: v.optional(v.number()),
});

export const aiContextPatchValidator = v.object({
  workingModelPatch: v.optional(
    v.object({
      energyPatterns: v.optional(v.string()),
      habitResonance: v.optional(v.string()),
      flagPatterns: v.optional(v.string()),
      triggerSignals: v.optional(v.string()),
      suggestionResponse: v.optional(v.string()),
      reviewEngagement: v.optional(v.string()),
      financeRelationship: v.optional(v.string()),
    }),
  ),
  memoryEntries: v.optional(
    v.array(
      v.object({
        occurredAt: v.optional(v.number()),
        module: v.string(),
        observation: v.string(),
        confidence: aiConfidenceValidator,
        source: v.string(),
      }),
    ),
  ),
  calibrationPatch: v.optional(
    v.object({
      preferredSuggestionVolume: v.optional(
        v.union(v.literal("minimal"), v.literal("moderate"), v.literal("full")),
      ),
      hardModePlanAccuracy: v.optional(v.number()),
      patternDismissRate: v.optional(v.number()),
      lastHardModeReflection: v.optional(v.number()),
    }),
  ),
});
