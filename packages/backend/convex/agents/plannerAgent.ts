"use node";

import { Agent, createTool, google, components, sharedTools, z } from "../agent";
import { HARD_MODE_PLAN_SYSTEM } from "../lib/prompts/hardModePlan";
import { makeFunctionReference } from "convex/server";

const todayHabitsRef = makeFunctionReference<"query", {}, unknown>(
  "queries/todayHabits:internalTodayHabits",
);
const inboxRef = makeFunctionReference<"query", {}, unknown>(
  "queries/taskQueries:internalInbox",
);
const hardModeSessionRef = makeFunctionReference<"query", {}, unknown>(
  "queries/hardModeSession:hardModeSession",
);
const recentEventsForPatternsRef = makeFunctionReference<
  "query",
  { since: number },
  unknown
>("queries/activePatterns:getRecentEventsForPatterns");

export const plannerAgent = new Agent(components.agent, {
  name: "plannerAgent",
  languageModel: google("gemini-2.0-flash"),
  instructions: HARD_MODE_PLAN_SYSTEM,
  tools: {
    ...sharedTools,
    getActiveHabits: createTool({
      description: "Get all active habits for today",
      args: z.object({}),
      handler: async (ctx) => {
        return ctx.runQuery(todayHabitsRef, {});
      },
    }),
    getInboxTasks: createTool({
      description: "Get all tasks in the inbox",
      args: z.object({}),
      handler: async (ctx) => {
        return ctx.runQuery(inboxRef, {});
      },
    }),
    getHardModeConstraints: createTool({
      description: "Get the preference anchors set at Hard Mode activation",
      args: z.object({ sessionId: z.string() }),
      handler: async (ctx) => {
        return ctx.runQuery(hardModeSessionRef, {});
      },
    }),
    getRecentDays: createTool({
      description: "Get completion and flag history for the past N days",
      args: z.object({ days: z.number() }),
      handler: async (ctx, args) => {
        const since = Date.now() - args.days * 24 * 60 * 60 * 1000;
        return ctx.runQuery(recentEventsForPatternsRef, { since });
      },
    }),
  },
  maxSteps: 6,
});
