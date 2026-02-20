import { query, internalQuery } from "../_generated/server";
import { DEFAULT_AI_CONTEXT, type AiContextDoc } from "../lib/aiContext";

type StoredAiContextDoc = Partial<Omit<AiContextDoc, "_id">> & { _id: string };

function toAiContext(doc: StoredAiContextDoc | null) {
  if (!doc) {
    return {
      _id: "ai-context-default",
      ...DEFAULT_AI_CONTEXT,
    };
  }

  return {
    _id: String(doc._id),
    lastUpdated: doc.lastUpdated ?? 0,
    workingModel: {
      ...DEFAULT_AI_CONTEXT.workingModel,
      ...(doc.workingModel ?? {}),
    },
    memory: Array.isArray(doc.memory) ? doc.memory : [],
    calibration: {
      ...DEFAULT_AI_CONTEXT.calibration,
      ...(doc.calibration ?? {}),
    },
  };
}

export const aiContext = query({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("aiContext")
      .withIndex("by_last_updated")
      .order("desc")
      .first();

    const context = toAiContext(existing);

    return {
      lastUpdated: context.lastUpdated,
      workingModel: context.workingModel,
      memory: context.memory.slice(-10).reverse(),
      calibration: context.calibration,
    };
  },
});

export const internalReadAiContext = internalQuery({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("aiContext")
      .withIndex("by_last_updated")
      .order("desc")
      .first();

    return toAiContext(existing);
  },
});
