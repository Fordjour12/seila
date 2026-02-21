"use node";

import { v } from "convex/values";

import { internal } from "../_generated/api";
import { action } from "../_generated/server";
import { readAiContext, writeAiContext } from "../lib/aiContext";
import { captureAgent } from "../agents/captureAgent";
import { tonePolicy } from "../lib/tonePolicy";
import { runAgentText } from "../lib/runAgentText";

type CaptureResult = {
  reply: string;
  contextPatch?: Record<string, string>;
  suggestedAction?: {
    headline: string;
    subtext: string;
    screen?: "checkin" | "tasks" | "finance" | "patterns" | "weekly-review";
  };
  moodSignal?: number;
};

function parseCaptureResult(raw: string): CaptureResult | null {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.reply === "string" && parsed.reply.length > 0) {
      return {
        reply: parsed.reply,
        contextPatch: parsed.contextPatch,
        suggestedAction: parsed.suggestedAction,
        moodSignal: parsed.moodSignal,
      };
    }
  } catch {
    // free text response — treat as reply-only
  }
  return null;
}

export const processCapture = action({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args): Promise<CaptureResult> => {
    await readAiContext(ctx);

    // Daily threadId — captures share context within the same day
    const dayKey = new Date().toISOString().split("T")[0];

    const { thread } = await captureAgent.continueThread(ctx, {
      threadId: `capture-${dayKey}`,
    });

    let result;
    try {
      result = await runAgentText(
        thread,
        `The person just said: "${args.text}"

                 Use your tools to fetch AI context.
                 Reply in 1–2 sentences, warm but brief.
                 Never repeat back what the user said verbatim.
                 Never ask a follow-up question in the reply.
                 Raw input text must NEVER appear in the output JSON or in any stored observation.

                 Return JSON only:
                 {
                   "reply": "string",
                   "contextPatch": { "fieldName": "new value" },
                   "suggestedAction": { "headline": "string", "subtext": "string", "screen": "checkin|tasks|finance..." },
                   "moodSignal": number (1-5, optional)
                 }`,
      );
    } catch {
      return {
        reply: "Heard. Keeping things grounded today.",
      };
    }

    const safe = tonePolicy(result.text);
    const parsed = parseCaptureResult(safe);

    if (!parsed) {
      return {
        reply: tonePolicy(result.text, "Noted. Keeping things contained."),
      };
    }

    // Write context updates if indicated
    if (parsed.contextPatch || parsed.moodSignal) {
      await writeAiContext(ctx, {
        workingModelPatch: parsed.contextPatch,
        memoryEntries: [
          {
            module: "capture",
            observation: `Capture processed. ${parsed.moodSignal ? `Mood signal: ${parsed.moodSignal}.` : "No mood signal."}`,
            confidence: parsed.moodSignal ? "medium" : "low",
            source: "captureAgent",
          },
        ],
      });
    }

    // Create a suggestion if the agent identified one
    if (parsed.suggestedAction) {
      try {
        await ctx.runMutation(internal.commands.createSuggestionInternal.createSuggestionInternal, {
          policy: "capture",
          headline: tonePolicy(parsed.suggestedAction.headline),
          subtext: tonePolicy(parsed.suggestedAction.subtext),
          priority: 1,
          action: {
            type: "open_screen",
            label: "Open",
            payload: { screen: parsed.suggestedAction.screen ?? "checkin" },
          },
          expiresAt: Date.now() + 30 * 60 * 1000,
        });
      } catch {
        /* suggestion creation is non-critical */
      }
    }

    return {
      reply: parsed.reply,
      contextPatch: parsed.contextPatch,
      suggestedAction: parsed.suggestedAction,
      moodSignal: parsed.moodSignal,
    };
  },
});
