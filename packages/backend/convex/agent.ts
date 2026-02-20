"use node";

import { Agent, createTool } from "@convex-dev/agent";
import { google } from "@ai-sdk/google";
import { components, internal } from "./_generated/api";

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

export const sharedTools = {
    getAiContext: createTool({
        description: "Read the AI's persistent working model of the user",
        args: {},
        handler: async (ctx) => {
            return ctx.runQuery(internal.queries.aiContext.internalReadAiContext, {});
        },
    }),

    getLastCheckin: createTool({
        description: "Get the most recent mood and energy check-in",
        args: {},
        handler: async (ctx) => {
            return ctx.runQuery(internal.queries.lastCheckin.internalLastCheckin, {});
        },
    }),
};

// ─────────────────────────────────────────────
// Re-exports for agent definitions
// ─────────────────────────────────────────────

export { Agent, createTool, google, components };
