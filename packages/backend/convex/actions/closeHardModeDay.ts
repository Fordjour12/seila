"use node";

import { v } from "convex/values";

import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { readAiContext, writeAiContext } from "../lib/aiContext";
import { plannerAgent } from "../agents/plannerAgent";
import { tonePolicy } from "../lib/tonePolicy";

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
    sessionId: v.id("hardModeSessions"),
  },
  handler: async (ctx, args) => {
    const aiContext = await readAiContext(ctx);

    // Get today's events and plan via the day-close input query
    const dayCloseData = await ctx.runQuery(
      internal.queries.hardModeDayClose.dayCloseInput,
      { now: Date.now(), sessionId: args.sessionId },
    );

    if (!dayCloseData.session || !dayCloseData.session.plan) {
      return { processed: false, reason: "no_plan" };
    }

    const plan = dayCloseData.session.plan;
    const todayEvents = dayCloseData.todayEvents;

    const flags = todayEvents.filter(
      (e: any) => e.type === "hardmode.itemFlagged",
    );
    const completions = todayEvents.filter((e: any) => isCompletionEvent(e));
    const completedIds = new Set(
      completions.map((c: any) => c.payload?.itemId ?? c.payload?.targetId),
    );
    const flaggedIds = new Set(
      flags.map((f: any) => f.payload?.targetId),
    );
    const ignored = (plan.items ?? []).filter(
      (item: any) =>
        !completedIds.has(item.id) && !flaggedIds.has(item.id),
    );

    // Same thread as the plan — agent sees full session history
    const { thread } = await plannerAgent.continueThread(ctx, {
      threadId: `hardmode-${args.sessionId}`,
    });

    let dayCloseResult: DayCloseResult;

    try {
      const result = await thread.generateText({
        prompt: `The day is done. Here is what happened:

Completed: ${JSON.stringify(Array.from(completedIds))}
Flagged: ${JSON.stringify(
          flags.map((f: any) => ({
            id: f.payload?.targetId,
            reason: f.payload?.reason,
          })),
        )}
Ignored (planned but neither done nor flagged): ${JSON.stringify(
          ignored.map((i: any) => i.id),
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
      });

      const safe = tonePolicy(result.text);
      const parsed = parseDayCloseResult(safe);

      if (parsed) {
        dayCloseResult = parsed;
      } else {
        // Fallback: rule-based calculation
        const tooMuchFlags = flags.filter(
          (f: any) => f.payload?.reason === "too_much",
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
        lastHardModeReflection: Date.now(),
      },
    });

    return {
      processed: true,
      completions: completions.length,
      flags: flags.length,
      ignored: ignored.length,
      accuracy: rolePolicy(),
    };

    function rolePolicy() {
      return dayCloseResult.calibrationPatch.hardModePlanAccuracy;
    }
  },
});
