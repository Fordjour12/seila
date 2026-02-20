"use node";

import { Agent, createTool, google, components, sharedTools } from "../agent";
import { PATTERN_EXPLAIN_SYSTEM } from "../lib/prompts/patternExplain";
import { internal } from "../_generated/api";
import { v } from "convex/values";

export const patternAgent = new Agent(components.agent, {
    name: "patternAgent",
    languageModel: google("gemini-2.0-flash"),
    instructions: PATTERN_EXPLAIN_SYSTEM,
    tools: {
        ...sharedTools,
        getPatternData: createTool({
            description: "Get the raw correlation data for a detected pattern by its type",
            args: {
                patternType: v.string(),
            },
            handler: async (ctx, args) => {
                return ctx.runQuery(
                    internal.queries.activePatterns.getPatternByType,
                    { type: args.patternType },
                );
            },
        }),
    },
    maxSteps: 3,
});
