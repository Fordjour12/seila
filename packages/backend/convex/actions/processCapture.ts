"use node";

import { v } from "convex/values";
import { makeFunctionReference } from "convex/server";

import { action } from "../_generated/server";
import { callAI } from "../lib/callAI";
import { readAiContext, writeAiContext } from "../lib/aiContext";

type CaptureResult = {
  reply: string;
  contextPatch?: {
    energyPatterns?: string;
    triggerSignals?: string;
  };
  suggestedAction?: {
    headline: string;
    subtext: string;
    screen?: "checkin" | "tasks" | "finance" | "patterns" | "weekly-review";
  };
  moodSignal?: number;
  energySignal?: number;
};

const recentDomainStateRef = makeFunctionReference<
  "query",
  {},
  {
    lastCheckins: Array<{ mood: number; energy: number; occurredAt: number }>;
    activePatternCount: number;
    focusCount: number;
    quietToday: boolean;
  }
>("queries/recentDomainState:recentDomainState");

const createSuggestionInternalRef = makeFunctionReference<
  "mutation",
  {
    policy: string;
    headline: string;
    subtext: string;
    priority: number;
    action?: {
      type: "open_screen" | "run_command";
      label: string;
      payload?: Record<string, unknown>;
    };
    expiresAt?: number;
  },
  { created: boolean; suggestionId: string }
>("commands/createSuggestionInternal:createSuggestionInternal");

export const processCapture = action({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const text = args.text.trim();

    if (!text) {
      return { reply: "Signal received." };
    }

    if (text.length > 280) {
      throw new Error("Capture input must be 280 characters or fewer");
    }

    const [context, recentState] = await Promise.all([
      readAiContext(ctx),
      ctx.runQuery(recentDomainStateRef, {}),
    ]);

    const result = (await callAI({
      promptKey: "capture",
      context,
      payload: {
        text,
        recentState,
      },
    })) as CaptureResult;

    if (result.contextPatch || result.moodSignal || result.energySignal) {
      await writeAiContext(ctx, {
        workingModelPatch: result.contextPatch,
        memoryEntries: [
          {
            module: "capture",
            observation:
              typeof result.moodSignal === "number" || typeof result.energySignal === "number"
                ? `Capture signal mood:${result.moodSignal ?? "?"} energy:${result.energySignal ?? "?"}`
                : "Capture updated context from unstructured signal.",
            confidence: "low",
            source: "conversationalCapture",
          },
        ],
      });
    }

    if (result.suggestedAction) {
      await ctx.runMutation(createSuggestionInternalRef, {
        policy: "capture",
        headline: result.suggestedAction.headline,
        subtext: result.suggestedAction.subtext,
        priority: 2,
        action: result.suggestedAction.screen
          ? {
              type: "open_screen",
              label: "Open",
              payload: {
                screen: result.suggestedAction.screen,
              },
            }
          : undefined,
        expiresAt: Date.now() + 30 * 60 * 1000,
      });
    }

    return {
      reply: result.reply,
    };
  },
});
