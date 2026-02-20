"use node";

import { Agent, createTool, google, components, sharedTools } from "../agent";
import { HARD_MODE_PLAN_SYSTEM_PROMPT } from "../lib/prompts/hardModePlan";
import { internal } from "../_generated/api";
import { v } from "convex/values";

export const plannerAgent = new Agent(components.agent, {
    name: "plannerAgent",
    languageModel: google("gemini-2.0-flash"),
    instructions: HARD_MODE_PLAN_SYSTEM_PROMPT,
    tools: {
        ...sharedTools,
        getActiveHabits: createTool({
            description: "Get all active habits for today",
            args: {},
            handler: async (ctx) => {
                return ctx.runQuery(
                    internal.queries.todayHabits.internalTodayHabits,
                    {},
                );
            },
        }),
        getInboxTasks: createTool({
            description: "Get all tasks in the inbox",
            args: {},
            handler: async (ctx) => {
                return ctx.runQuery(
                    internal.queries.taskQueries.internalInbox,
                    {},
                );
            },
        }),
        getHardModeConstraints: createTool({
            description: "Get the preference anchors set at Hard Mode activation",
            args: { sessionId: v.string() },
            handler: async (ctx, args) => {
                return ctx.runQuery(
                    internal.queries.hardModeSession.getSessionById,
                    { sessionId: args.sessionId as any },
                );
            },
        }),
        getRecentDays: createTool({
            description: "Get completion and flag history for the past N days",
            args: { days: v.number() },
            handler: async (ctx, args) => {
                const since = Date.now() - args.days * 24 * 60 * 60 * 1000;
                return ctx.runQuery(
                    internal.queries.activePatterns.getRecentEventsForPatterns,
                    { since },
                );
            },
        }),
    },
    maxSteps: 6,
});
