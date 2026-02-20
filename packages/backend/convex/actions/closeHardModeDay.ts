"use node";

import { v } from "convex/values";
import { makeFunctionReference } from "convex/server";
import type { HardModePlan } from "@seila/domain-kernel";

import { internalAction } from "../_generated/server";
import { readAiContext, writeAiContext } from "../lib/aiContext";
import { plannerAgent } from "../agents/plannerAgent";
import { tonePolicy } from "../lib/tonePolicy";
import { runAgentText } from "../lib/runAgentText";

type EventDoc = {
  type: string;
  payload?: Record<string, unknown>;
};

type DayCloseQueryResult = {
  dayStart: number;
  dayEnd: number;
  session: {
    _id: string;
    plan?: HardModePlan;
    isActive: boolean;
  } | null;
  todayEvents: EventDoc[];
};

const dayCloseInputRef = makeFunctionReference<
  "query",
  { now: number; sessionId?: string },
  DayCloseQueryResult
>("queries/hardModeDayClose:dayCloseInput");

type DayCloseResult = {
  observations: string[];
  workingModelPatch: Record<string, string>;
  calibrationPatch: { hardModePlanAccuracy: number };
};

function isCompletionEvent(event: { type: string }): boolean {
  return (
    event.type === "habit.completed" ||
    event.type === "task.completed" ||
    event.type === "checkin.submitted"
  );
}

function parseDayCloseResult(raw: string): DayCloseResult | null {
  try {
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed.observations) &&
      typeof parsed.calibrationPatch?.hardModePlanAccuracy === "number"
    ) {
      return {
        observations: parsed.observations.filter(
          (o: unknown) => typeof o === "string" && o.length <= 150,
        ),
        workingModelPatch: parsed.workingModelPatch ?? {},
        calibrationPatch: {
          hardModePlanAccuracy: Math.min(
            1,
            Math.max(0, parsed.calibrationPatch.hardModePlanAccuracy),
          ),
        },
      };
    }
  } catch {
    // parse failure
  }
  return null;
}

export const closeHardModeDay = internalAction({
  args: {
    sessionId: v.optional(v.id("hardModeSessions")),
    now: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ processed: boolean; reason?: string; completions?: number; flags?: number; ignored?: number; accuracy?: number }> => {
    const aiContext = await readAiContext(ctx);
    const now = args.now ?? Date.now();

    // Get today's events and plan via the day-close input query
    const dayCloseData = await ctx.runQuery(dayCloseInputRef, {
      now,
      sessionId: args.sessionId,
    });

    if (!dayCloseData.session || !dayCloseData.session.plan) {
      return { processed: false, reason: "no_plan" };
    }

    const plan = dayCloseData.session.plan;
    const todayEvents = dayCloseData.todayEvents;

    const flags = todayEvents.filter((event) => event.type === "hardMode.itemFlagged");
    const completions = todayEvents.filter((event) => isCompletionEvent(event));
    const completedIds = new Set(
      completions
        .map((event) => {
          const payload = event.payload as Record<string, unknown> | undefined;
          const id = payload?.itemId ?? payload?.targetId ?? payload?.id;
          return typeof id === "string" ? id : null;
        })
        .filter((id): id is string => id !== null),
    );
    const flaggedIds = new Set(
      flags
        .map((event) => {
          const payload = event.payload as Record<string, unknown> | undefined;
          const id = payload?.itemId ?? payload?.targetId ?? payload?.id;
          return typeof id === "string" ? id : null;
        })
        .filter((id): id is string => id !== null),
    );
    const ignored = (plan.items ?? []).filter((item) => !completedIds.has(item.id) && !flaggedIds.has(item.id));

    // Same thread as the plan — agent sees full session history
    const { thread } = await plannerAgent.continueThread(ctx, {
      threadId: `hardmode-${dayCloseData.session._id}`,
    });

    let dayCloseResult: DayCloseResult;

    try {
      const result = await runAgentText(
        thread,
        `The day is done. Here is what happened:

Completed: ${JSON.stringify(Array.from(completedIds))}
Flagged: ${JSON.stringify(
          flags.map((event) => {
            const payload = event.payload as Record<string, unknown> | undefined;
            return {
              id: payload?.itemId ?? payload?.targetId,
              reason: payload?.flag ?? payload?.reason,
            };
          }),
        )}
Ignored (planned but neither done nor flagged): ${JSON.stringify(
          ignored.map((item) => item.id),
        )}

Reason about what you learned:
- not_aligned: wrong item for this person
- not_now: wrong timing
- too_much: plan volume was too high
- ignored: signals capacity limits, not non-compliance — never frame as such

Update your understanding of this person.
Return JSON only:
{
  "observations": ["string (max 150 chars)", ...],
  "workingModelPatch": { "fieldName": "new value" },
  "calibrationPatch": { "hardModePlanAccuracy": number }
}
hardModePlanAccuracy = completed / (planned - too_much_flags)`,
      );

      const safe = tonePolicy(result.text);
      const parsed = parseDayCloseResult(safe);

      if (parsed) {
        dayCloseResult = parsed;
      } else {
        // Fallback: rule-based calculation
        const tooMuchFlags = flags.filter(
          (event) => {
            const payload = event.payload as Record<string, unknown> | undefined;
            return payload?.flag === "too_much" || payload?.reason === "too_much";
          },
        ).length;
        const denominator = Math.max(1, (plan.items ?? []).length - tooMuchFlags);
        const accuracy = Math.min(1, completions.length / denominator);

        dayCloseResult = {
          observations: [
            `Day closed: ${completions.length}/${(plan.items ?? []).length} items completed.`,
          ],
          workingModelPatch: {},
          calibrationPatch: { hardModePlanAccuracy: accuracy },
        };
      }
    } catch {
      // Agent failure — use rule-based fallback
      const accuracy = Math.min(
        1,
        completions.length / Math.max(1, (plan.items ?? []).length),
      );

      dayCloseResult = {
        observations: [
          `Day closed: ${completions.length}/${(plan.items ?? []).length} items completed.`,
        ],
        workingModelPatch: {},
        calibrationPatch: { hardModePlanAccuracy: accuracy },
      };
    }

    // Apply agent observations to tone policy
    const safeObservations = dayCloseResult.observations.map((obs) =>
      tonePolicy(obs),
    );

    // Rolling average for accuracy calibration
    const prevAccuracy = aiContext.calibration.hardModePlanAccuracy;
    const rollingAccuracy =
      prevAccuracy * 0.7 + dayCloseResult.calibrationPatch.hardModePlanAccuracy * 0.3;

    await writeAiContext(ctx, {
      workingModelPatch: dayCloseResult.workingModelPatch,
      memoryEntries: safeObservations.map((obs) => ({
        module: "hard_mode",
        observation: obs,
        confidence: "high" as const,
        source: "plannerAgent",
      })),
      calibrationPatch: {
        hardModePlanAccuracy: rollingAccuracy,
        lastHardModeReflection: now,
      },
    });

    return {
      processed: true,
      completions: completions.length,
      flags: flags.length,
      ignored: ignored.length,
      accuracy: dayCloseResult.calibrationPatch.hardModePlanAccuracy,
    };
  },
});
