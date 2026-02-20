"use node";

import { Agent, createTool, google, components, sharedTools, z } from "../agent";
import { CAPTURE_SYSTEM } from "../lib/prompts/capture";
import { makeFunctionReference } from "convex/server";

const activeSuggestionsRef = makeFunctionReference<"query", {}, unknown>(
  "queries/activeSuggestions:internalActiveSuggestions",
);

export const captureAgent = new Agent(components.agent, {
  name: "captureAgent",
  languageModel: google("gemini-2.0-flash"),
  instructions: CAPTURE_SYSTEM,
  tools: {
    ...sharedTools,
    getActiveSuggestions: createTool({
      description: "Get currently active suggestions",
      args: z.object({}),
      handler: async (ctx) => {
        return ctx.runQuery(activeSuggestionsRef, {});
      },
    }),
  },
  maxSteps: 2,
});
