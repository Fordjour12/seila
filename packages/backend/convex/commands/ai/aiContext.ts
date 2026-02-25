import { internalMutation } from "../../_generated/server";
import { aiContextPatchValidator } from "../../aiContext/validators";
import { DEFAULT_AI_CONTEXT } from "../../lib/aiContext";

const MAX_MEMORY_ENTRIES = 90;

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function truncate(input: string, max: number) {
  if (input.length <= max) {
    return input;
  }

  return input.slice(0, max);
}

export const applyAiContextPatch = internalMutation({
  args: aiContextPatchValidator,
  handler: async (ctx, args) => {
    let existing = await ctx.db
      .query("aiContext")
      .withIndex("by_last_updated")
      .order("desc")
      .first();

    if (!existing) {
      const createdId = await ctx.db.insert("aiContext", {
        ...DEFAULT_AI_CONTEXT,
      });
      existing = await ctx.db.get(createdId);
    }

    if (!existing) {
      return { updated: false };
    }

    const nextMemory = [
      ...(existing.memory ?? []),
      ...(args.memoryEntries ?? []).map((entry) => ({
        occurredAt: entry.occurredAt ?? Date.now(),
        module: entry.module,
        observation: truncate(entry.observation, 150),
        confidence: entry.confidence,
        source: entry.source,
      })),
    ].slice(-MAX_MEMORY_ENTRIES);

    const next = {
      workingModel: {
        ...DEFAULT_AI_CONTEXT.workingModel,
        ...(existing.workingModel ?? {}),
        ...(args.workingModelPatch ?? {}),
      },
      memory: nextMemory,
      calibration: {
        ...DEFAULT_AI_CONTEXT.calibration,
        ...(existing.calibration ?? {}),
        ...(args.calibrationPatch ?? {}),
      },
      lastUpdated: Date.now(),
    };

    next.calibration.hardModePlanAccuracy = clamp(next.calibration.hardModePlanAccuracy, 0, 1);
    next.calibration.patternDismissRate = clamp(next.calibration.patternDismissRate, 0, 1);

    await ctx.db.patch(existing._id, next);

    return { updated: true };
  },
});
