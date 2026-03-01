"use node";

import { Agent, createTool } from "@convex-dev/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { ToolSet } from "ai";
import { z } from "zod";
import { makeFunctionReference } from "convex/server";
import { components } from "./_generated/api";

const readAiContextRef = makeFunctionReference<"query", {}, unknown>(
  "queries/aiContext:internalReadAiContext",
);
const lastCheckinRef = makeFunctionReference<"query", {}, unknown>(
  "queries/lastCheckin:internalLastCheckin",
);

const openRouterApiKey = process.env.OPENROUTER_API_KEY;

if (!openRouterApiKey) {
  throw new Error("Missing OPENROUTER_API_KEY for OpenRouter provider.");
}

const openrouter = createOpenRouter({
  apiKey: openRouterApiKey,
});

const openRouterModel = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
export const defaultLanguageModel = openrouter.chat(openRouterModel);

// ─────────────────────────────────────────────
// BASE_SYSTEM — shared across every agent
// ─────────────────────────────────────────────

export const BASE_SYSTEM = `
You are the AI layer of a personal recovery-first operating system built for one person.

TONE RULES — non-negotiable:
- Never use the words: fail, missed, behind, should, need to, streak
- Never frame absence of action negatively
- Positive and neutral framing only
- If you cannot frame something positively or neutrally, say nothing

SPARSITY RULES:
- Suggest one thing at a time, never a list of actions
- Observations are more valuable than recommendations
- Silence is correct when you have nothing confident to say

MEMORY RULES:
- You have access to a working model of this person built over time
- Trust it, update it, do not contradict it without strong signal
- Low-confidence observations are still worth writing — label them clearly

HARD LIMITS:
- You never write to the event log directly
- You never execute a command — only propose one
- You never store raw user input
- You never ask how the person is feeling if they just told you
`;

// ─────────────────────────────────────────────
// Shared tools — available to every agent
// ─────────────────────────────────────────────

export const sharedTools: ToolSet = {
  getAiContext: createTool({
    description: "Read the AI's persistent working model of the user",
    args: z.object({}),
    handler: async (ctx): Promise<unknown> => {
      return ctx.runQuery(readAiContextRef, {});
    },
  }),

  getLastCheckin: createTool({
    description: "Get the most recent mood and energy check-in",
    args: z.object({}),
    handler: async (ctx): Promise<unknown> => {
      return ctx.runQuery(lastCheckinRef, {});
    },
  }),
};

// ─────────────────────────────────────────────
// Re-exports for agent definitions
// ─────────────────────────────────────────────

export { Agent, createTool, components, z };
