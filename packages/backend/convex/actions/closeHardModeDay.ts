"use node";

import { v } from "convex/values";
import { makeFunctionReference } from "convex/server";

import { internalAction } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { callAI } from "../lib/callAI";
import { readAiContext, writeAiContext } from "../lib/aiContext";

type DayCloseInput = {
  dayStart: number;
  dayEnd: number;
  session: {
    _id: string;
    plan?: {
      items: Array<{ id: string; status: "planned" | "done" | "dropped" }>;
    };
    isActive: boolean;
  } | null;
  todayEvents: Array<{
    type: string;
    payload: {
      itemId?: string;
      flag?: "not_now" | "not_aligned" | "too_much";
      id?: string;
      habitId?: string;
    };
  }>;
};

const dayCloseInputRef = makeFunctionReference<
  "query",
  {
    now: number;
    sessionId?: Id<"hardModeSessions">;
  },
  DayCloseInput
>("queries/hardModeDayClose:dayCloseInput");

function computeAccuracy(input: {
  plannedCount: number;
  completedCount: number;
  tooMuchCount: number;
}) {
  const denominator = Math.max(1, input.plannedCount - input.tooMuchCount);
  return Math.max(0, Math.min(1, input.completedCount / denominator));
}

export const closeHardModeDay = internalAction({
  args: {
    now: v.optional(v.number()),
    sessionId: v.optional(v.id("hardModeSessions")),
  },
  handler: async (ctx, args) => {
    const now = args.now ?? Date.now();

    const [context, closeInput] = await Promise.all([
      readAiContext(ctx),
      ctx.runQuery(dayCloseInputRef, {
        now,
        sessionId: args.sessionId,
      }),
    ]);

    if (!closeInput.session || !closeInput.session.plan) {
      return { ran: false, reason: "no_session_or_plan" };
    }

    const plannedItems = closeInput.session.plan.items;
    const completedEvents = closeInput.todayEvents.filter(
      (event) => event.type === "habit.completed" || event.type === "task.completed" || event.type === "checkin.submitted",
    );
    const flags = closeInput.todayEvents.filter((event) => event.type === "hardMode.itemFlagged");

    const flaggedItemIds = new Set(flags.map((event) => event.payload.itemId).filter(Boolean));
    const completedItemIds = new Set(
      completedEvents
        .map((event) => String(event.payload.itemId ?? event.payload.id ?? event.payload.habitId ?? ""))
        .filter(Boolean),
    );

    const ignored = plannedItems.filter(
      (item) => item.status === "planned" && !flaggedItemIds.has(item.id) && !completedItemIds.has(item.id),
    );

    const tooMuchCount = flags.filter((event) => event.payload.flag === "too_much").length;
    const accuracy = computeAccuracy({
      plannedCount: plannedItems.length,
      completedCount: completedEvents.length,
      tooMuchCount,
    });

    const analysis = (await callAI({
      promptKey: "dayClose",
      context,
      payload: {
        planned: plannedItems,
        completed: completedEvents,
        flagged: flags,
        ignored,
      },
    })) as {
      observations: Array<{
        module: string;
        observation: string;
        confidence: "low" | "medium" | "high";
        source: string;
      }>;
      workingModelPatch?: {
        flagPatterns?: string;
      };
    };

    await writeAiContext(ctx, {
      workingModelPatch: analysis.workingModelPatch,
      memoryEntries: analysis.observations,
      calibrationPatch: {
        hardModePlanAccuracy: accuracy,
        lastHardModeReflection: now,
      },
    });

    return {
      ran: true,
      accuracy,
      flagged: flags.length,
      ignored: ignored.length,
    };
  },
});
