"use node";

import { Agent, createTool, google, components, sharedTools, z } from "../agent";
import { WEEKLY_SUMMARY_SYSTEM } from "../lib/prompts/weeklySummary";
import { makeFunctionReference } from "convex/server";

const eventsByDateRangeRef = makeFunctionReference<
  "query",
  { since: number; until: number },
  unknown
>("queries/weeklySummaryQueries:internalEventsByDateRange");
const checkinsForWeeklySummaryRef = makeFunctionReference<
  "query",
  { since: number; until: number },
  unknown
>("queries/weeklySummaryQueries:internalCheckinsForWeeklySummary");
const moodTrendRef = makeFunctionReference<
  "query",
  { days?: number },
  unknown
>("queries/moodTrend:internalMoodTrend");
const activePatternsRef = makeFunctionReference<"query", {}, unknown>(
  "queries/activePatterns:internalActivePatterns",
);

export const summaryAgent = new Agent(components.agent, {
  name: "summaryAgent",
  languageModel: google("gemini-2.0-flash"),
  instructions: WEEKLY_SUMMARY_SYSTEM,
  tools: {
    ...sharedTools,
    getWeekEvents: createTool({
      description: "Get the past week's events for analysis",
      args: z.object({
        since: z.number(),
        until: z.number(),
      }),
      handler: async (ctx, args) => {
        return ctx.runQuery(eventsByDateRangeRef, {
          since: args.since,
          until: args.until,
        });
      },
    }),
    getWeekCheckins: createTool({
      description: "Get check-ins for the past week",
      args: z.object({
        since: z.number(),
        until: z.number(),
      }),
      handler: async (ctx, args) => {
        return ctx.runQuery(checkinsForWeeklySummaryRef, {
          since: args.since,
          until: args.until,
        });
      },
    }),
    getMoodTrend: createTool({
      description: "Get mood and energy trend for the past N days",
      args: z.object({ days: z.number() }),
      handler: async (ctx, args) => {
        return ctx.runQuery(moodTrendRef, { days: args.days });
      },
    }),
    getActivePatterns: createTool({
      description: "Get currently active patterns",
      args: z.object({}),
      handler: async (ctx) => {
        return ctx.runQuery(activePatternsRef, {});
      },
    }),
  },
  maxSteps: 5,
});
