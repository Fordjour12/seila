"use node";

import { Agent, createTool, google, components, sharedTools, z } from "../agent";
import { PATTERN_EXPLAIN_SYSTEM } from "../lib/prompts/patternExplain";
import { makeFunctionReference } from "convex/server";

const getPatternByTypeRef = makeFunctionReference<
  "query",
  { type: "mood_habit" | "energy_checkin_timing" | "spending_mood" },
  unknown
>("queries/activePatterns:getPatternByType");

export const patternAgent = new Agent(components.agent, {
  name: "patternAgent",
  languageModel: google("gemini-2.0-flash"),
  instructions: PATTERN_EXPLAIN_SYSTEM,
  tools: {
    ...sharedTools,
    getPatternData: createTool({
      description: "Get the raw correlation data for a detected pattern by its type",
      args: z.object({
        patternType: z.enum(["mood_habit", "energy_checkin_timing", "spending_mood"]),
      }),
      handler: async (ctx, args) => {
        return ctx.runQuery(getPatternByTypeRef, {
          type: args.patternType,
        });
      },
    }),
  },
  maxSteps: 3,
});
