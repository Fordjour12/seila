import type { AiContextDoc } from "./aiContext";

type PromptKey = "dayClose" | "capture" | "patternDetect" | "weeklySummary" | "hardModePlan";

type DayCloseResult = {
  observations: Array<{
    module: string;
    observation: string;
    confidence: "low" | "medium" | "high";
    source: string;
  }>;
  workingModelPatch?: Partial<AiContextDoc["workingModel"]>;
};

type CaptureResult = {
  reply: string;
  contextPatch?: Partial<AiContextDoc["workingModel"]>;
  suggestedAction?: {
    headline: string;
    subtext: string;
    screen?: "checkin" | "tasks" | "finance" | "patterns" | "weekly-review";
  };
  moodSignal?: number;
  energySignal?: number;
};

export async function callAI(input: {
  promptKey: PromptKey;
  context: AiContextDoc;
  payload: Record<string, unknown>;
}): Promise<DayCloseResult | CaptureResult | Record<string, never>> {
  if (input.promptKey === "capture") {
    const text = String(input.payload.text ?? "")
      .trim()
      .toLowerCase();

    if (!text) {
      return {
        reply: "Noted. Keeping the day light.",
      };
    }

    if (text.includes("rough") || text.includes("overwhelmed") || text.includes("anxious")) {
      return {
        reply: "Thanks for the signal. We can keep scope narrow and focus on one doable step.",
        contextPatch: {
          triggerSignals: "Recent captures suggest stress spikes early in the day.",
        },
        suggestedAction: {
          headline: "Keep today narrow",
          subtext: "Choose one focus task and leave the rest in inbox.",
          screen: "tasks",
        },
        moodSignal: 2,
        energySignal: 2,
      };
    }

    if (text.includes("good") || text.includes("calm") || text.includes("better")) {
      return {
        reply: "Noted. There is enough capacity signal to keep a steady, light plan.",
        contextPatch: {
          energyPatterns: "Recent captures include stable-energy windows worth preserving.",
        },
        moodSignal: 4,
        energySignal: 4,
      };
    }

    return {
      reply:
        "Signal received. I will use this context to keep recommendations appropriately light.",
    };
  }

  if (input.promptKey === "dayClose") {
    const planned = Array.isArray(input.payload.planned) ? input.payload.planned.length : 0;
    const completed = Array.isArray(input.payload.completed) ? input.payload.completed.length : 0;
    const flagged = Array.isArray(input.payload.flagged) ? input.payload.flagged.length : 0;
    const ignored = Array.isArray(input.payload.ignored) ? input.payload.ignored.length : 0;

    return {
      observations: [
        {
          module: "hard_mode",
          observation: `Day close: ${completed}/${planned} completed, ${flagged} flagged, ${ignored} ignored.`,
          confidence: "medium",
          source: "dayClose",
        },
      ],
      workingModelPatch: {
        flagPatterns:
          flagged > 0
            ? "Recent hard mode flags suggest plan pressure should stay conservative."
            : "Recent hard mode runs show low flag pressure.",
      },
    };
  }

  return {};
}
