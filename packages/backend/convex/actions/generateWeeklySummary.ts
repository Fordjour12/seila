"use node";

import { v } from "convex/values";
import { makeFunctionReference } from "convex/server";

import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { readAiContext, writeAiContext } from "../lib/aiContext";
import { summaryAgent } from "../agents/summaryAgent";
import { tonePolicy } from "../lib/tonePolicy";
import { runAgentText } from "../lib/runAgentText";

type WeeklySummary = {
  bullets: string[];
  brightSpot: string;
  worthNoticing: string;
};

const recoveryContextRef = makeFunctionReference<
  "query",
  {},
  {
    hardDayLooksLike?: string;
    knownTriggers: string[];
    restDefinition?: string;
  } | null
>("queries/recoveryContext:internalRecoveryContext");

function fallbackWeeklySummary(): WeeklySummary {
  return {
    bullets: ["A full week of activity was captured across your routines."],
    brightSpot: "You showed up and kept data flowing.",
    worthNoticing: "Your week had variation, which offers useful context for the next one.",
  };
}

function parseWeeklySummary(raw: string): WeeklySummary | null {
  try {
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed.bullets) &&
      typeof parsed.brightSpot === "string" &&
      typeof parsed.worthNoticing === "string"
    ) {
      return {
        bullets: parsed.bullets.slice(0, 5),
        brightSpot: parsed.brightSpot,
        worthNoticing: parsed.worthNoticing,
      };
    }
  } catch {
    // Try extracting structured data from free text
  }

  return null;
}

export const generateWeeklySummary = internalAction({
  args: {
    reviewId: v.id("reviews"),
    weekStart: v.number(),
    weekEnd: v.number(),
  },
  handler: async (ctx, args): Promise<WeeklySummary> => {
    const aiContext = await readAiContext(ctx);
    const recoveryContext = await ctx.runQuery(recoveryContextRef, {});

    const { thread } = await summaryAgent.createThread(ctx);

    const result = await runAgentText(
      thread,
      `Generate this week's summary.
               Week range: ${new Date(args.weekStart).toISOString()} to ${new Date(args.weekEnd).toISOString()}
               Use your tools to gather what you need — events, check-ins, mood trend, active patterns, AI context.
               Fetch each module separately via tool.
               ${recoveryContext?.restDefinition ? `Rest definition: ${recoveryContext.restDefinition}` : ""}
               ${recoveryContext?.knownTriggers?.length ? `Known triggers: ${recoveryContext.knownTriggers.slice(0, 2).join(", ")}` : ""}

               Output JSON only:
               {
                 "bullets": ["string", ...],
                 "brightSpot": "string",
                 "worthNoticing": "string"
               }

               Rules:
               - Max 5 bullets of what happened (factual, no judgment)
               - One bright spot (specific: "Wednesday showed highest energy of the week")
               - One worth-noticing observation (neutral, not prescriptive)
               - No recommendations. No forward instructions. Facts and observations only.
               - If a week has very little data, generate a shorter summary — do not pad it out`,
    );

    const safe = tonePolicy(result.text);
    const parsed = parseWeeklySummary(safe);
    const safeSummary = parsed ?? fallbackWeeklySummary();

    await ctx.runMutation(internal.commands.reviewCommands.applyGeneratedSummary, {
      reviewId: args.reviewId,
      bullets: safeSummary.bullets,
      brightSpot: safeSummary.brightSpot,
      worthNoticing: safeSummary.worthNoticing,
    });

    await writeAiContext(ctx, {
      workingModelPatch: {
        reviewEngagement: "Weekly summaries are being generated and reflected in ongoing context.",
      },
      memoryEntries: [
        {
          module: "weekly_review",
          observation: `Weekly summary generated with ${safeSummary.bullets.length} bullets.`,
          confidence: "medium",
          source: "summaryAgent",
        },
      ],
      calibrationPatch: {
        preferredSuggestionVolume:
          aiContext.calibration.preferredSuggestionVolume === "full"
            ? "moderate"
            : aiContext.calibration.preferredSuggestionVolume,
      },
    });

    return safeSummary;
  },
});
