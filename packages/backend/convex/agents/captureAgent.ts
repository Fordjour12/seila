"use node";

import { Agent, createTool, google, components, sharedTools } from "../agent";
import { CAPTURE_SYSTEM_PROMPT } from "../lib/prompts/capture";
import { internal } from "../_generated/api";

export const captureAgent = new Agent(components.agent, {
    name: "captureAgent",
    languageModel: google("gemini-2.0-flash"),
    instructions: CAPTURE_SYSTEM_PROMPT,
    tools: {
        ...sharedTools,
        getActiveSuggestions: createTool({
            description: "Get currently active suggestions",
            args: {},
            handler: async (ctx) => {
                return ctx.runQuery(
                    internal.queries.activeSuggestions.internalActiveSuggestions,
                    {},
                );
            },
        }),
    },
    maxSteps: 2,
});
