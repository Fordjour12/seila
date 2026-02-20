"use node";

import { Agent, createTool, google, components, sharedTools } from "../agent";
import { WEEKLY_SUMMARY_SYSTEM_PROMPT } from "../lib/prompts/weeklySummary";
import { internal } from "../_generated/api";
import { v } from "convex/values";

export const summaryAgent = new Agent(components.agent, {
    name: "summaryAgent",
    languageModel: google("gemini-2.0-flash"),
    instructions: WEEKLY_SUMMARY_SYSTEM_PROMPT,
    tools: {
        ...sharedTools,
        getWeekEvents: createTool({
            description: "Get the past week's events for analysis",
            args: {
                since: v.number(),
                until: v.number(),
            },
            handler: async (ctx, args) => {
                return ctx.runQuery(
                    internal.queries.weeklySummaryQueries.internalEventsByDateRange,
                    { since: args.since, until: args.until },
                );
            },
        }),
        getWeekCheckins: createTool({
            description: "Get check-ins for the past week",
            args: {
                since: v.number(),
                until: v.number(),
            },
            handler: async (ctx, args) => {
                return ctx.runQuery(
                    internal.queries.weeklySummaryQueries.internalCheckinsForWeeklySummary,
                    { since: args.since, until: args.until },
                );
            },
        }),
        getMoodTrend: createTool({
            description: "Get mood and energy trend for the past N days",
            args: { days: v.number() },
            handler: async (ctx, args) => {
                return ctx.runQuery(
                    internal.queries.moodTrend.internalMoodTrend,
                    { days: args.days },
                );
            },
        }),
        getActivePatterns: createTool({
            description: "Get currently active patterns",
            args: {},
            handler: async (ctx) => {
                return ctx.runQuery(
                    internal.queries.activePatterns.internalActivePatterns,
                    {},
                );
            },
        }),
    },
    maxSteps: 5,
});
