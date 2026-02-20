"use node";

import type {
  HardModeConstraint,
  HardModePlan,
  HardModeScope,
  PlannedItem,
} from "@seila/domain-kernel";
import { applyLowEnergyFailsafe, validateHardModePlan } from "@seila/domain-kernel";
import { makeFunctionReference } from "convex/server";
import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { api } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { readAiContext, writeAiContext } from "../lib/aiContext";
import { callAI } from "../lib/callAI";

const applyGeneratedPlanRef = makeFunctionReference<
  "mutation",
  { sessionId: Id<"hardModeSessions">; plan: HardModePlan },
  { updated: boolean }
>("commands/activateHardMode:applyGeneratedPlan");

const getSessionByIdRef = makeFunctionReference<
  "query",
  { sessionId: Id<"hardModeSessions"> },
  {
    _id: Id<"hardModeSessions">;
    isActive: boolean;
    scope: HardModeScope;
    constraints: HardModeConstraint[];
  } | null
>("queries/hardModeSession:getSessionById");

const recoveryContextRef = makeFunctionReference<
  "query",
  {},
  {
    hardDayLooksLike?: string;
    knownTriggers: string[];
    restDefinition?: string;
  } | null
>("queries/recoveryContext:internalRecoveryContext");

const MAX_RATIONALE_LENGTH = 80;

function truncateRationale(input: string) {
  if (input.length <= MAX_RATIONALE_LENGTH) {
    return input;
  }

  return `${input.slice(0, MAX_RATIONALE_LENGTH - 3)}...`;
}

function byConfidenceDesc(a: PlannedItem, b: PlannedItem) {
  return b.confidence - a.confidence;
}

function scheduleConservativeCadence(dayStart: number, sorted: PlannedItem[]): PlannedItem[] {
  return sorted.map((item, index) => ({
    ...item,
    scheduledAt: dayStart + (index + 1) * 90 * 60 * 1000,
  }));
}

function adjustForCalibration(input: {
  items: PlannedItem[];
  accuracy: number;
  scope: HardModeScope;
  inboxTasks: Array<{ _id: Id<"tasks">; title: string }>;
}): PlannedItem[] {
  const sorted = input.items.slice().sort(byConfidenceDesc);

  if (input.accuracy < 0.5 && sorted.length > 1) {
    return sorted.slice(0, sorted.length - 1);
  }

  if (input.accuracy > 0.85 && input.scope.tasks) {
    const existingTaskIds = new Set(
      sorted.filter((item) => item.module === "tasks").map((item) => item.id),
    );
    const extraTask = input.inboxTasks.find((task) => !existingTaskIds.has(`task:${task._id}`));

    if (extraTask) {
      sorted.push({
        id: `task:${extraTask._id}`,
        module: "tasks",
        kind: "task.focus",
        title: `Focus optional task: ${extraTask.title}`,
        scheduledAt: 0,
        confidence: 0.49,
        rationale: truncateRationale("Calibration suggests one optional extra task may fit today."),
        status: "planned",
      });
    }
  }

  return sorted;
}

function buildCandidates(input: {
  scope: HardModeScope;
  todayHabits: Array<{
    habitId: Id<"habits">;
    name: string;
    anchor?: "morning" | "afternoon" | "evening" | "anytime";
    todayStatus?: "completed" | "skipped" | "snoozed";
  }>;
  inboxTasks: Array<{ _id: Id<"tasks">; title: string }>;
  recoveryContext: {
    hardDayLooksLike?: string;
    knownTriggers: string[];
    restDefinition?: string;
  } | null;
}): PlannedItem[] {
  const items: PlannedItem[] = [];
  const contextTail = input.recoveryContext?.restDefinition
    ? ` Rest in your context: ${input.recoveryContext.restDefinition}`
    : "";

  if (input.scope.habits) {
    const habit = input.todayHabits.find((item) => !item.todayStatus);
    if (habit) {
      items.push({
        id: `habit:${habit.habitId}`,
        module: "habits",
        kind: "habit.log",
        title: `Log ${habit.name}`,
        scheduledAt: 0,
        confidence: 0.84,
        rationale: truncateRationale(
          `Start with one habit to create momentum for the day.${contextTail}`,
        ),
        habitAnchor: habit.anchor,
        status: "planned",
      });
    }
  }

  if (input.scope.tasks) {
    const topTasks = input.inboxTasks.slice(0, 2);
    for (const [index, task] of topTasks.entries()) {
      items.push({
        id: `task:${task._id}`,
        module: "tasks",
        kind: "task.focus",
        title: `Focus ${index === 0 ? "primary" : "secondary"} task: ${task.title}`,
        scheduledAt: 0,
        confidence: index === 0 ? 0.78 : 0.52,
        rationale: truncateRationale(
          index === 0
            ? `Single-task focus lowers switching cost and keeps scope contained.${contextTail}`
            : `Optional second task, scheduled later and dropped first when needed.${contextTail}`,
        ),
        status: "planned",
      });
    }
  }

  if (input.scope.checkin) {
    items.push({
      id: "checkin:daily",
      module: "checkin",
      kind: "checkin.submit",
      title: "Submit a quick check-in",
      scheduledAt: 0,
      confidence: 0.81,
      rationale: truncateRationale(
        `A brief check-in helps adapt the plan without pressure.${contextTail}`,
      ),
      status: "planned",
    });
  }

  return items;
}

export const generateHardModePlan = internalAction({
  args: {
    sessionId: v.id("hardModeSessions"),
    dayStart: v.number(),
  },
  handler: async (ctx, args) => {
    const aiContext = await readAiContext(ctx);
    await callAI({
      promptKey: "hardModePlan",
      context: aiContext,
      payload: {
        dayStart: args.dayStart,
      },
    });
    const session = await ctx.runQuery(getSessionByIdRef, {
      sessionId: args.sessionId,
    });

    if (!session || !session.isActive) {
      return { generated: false };
    }

    const [todayHabits, inboxTasks, lastCheckin, recoveryContext] = await Promise.all([
      ctx.runQuery(api.queries.todayHabits.todayHabits, {}),
      ctx.runQuery(api.queries.taskQueries.inbox, {}),
      ctx.runQuery(api.queries.lastCheckin.lastCheckin, {}),
      ctx.runQuery(recoveryContextRef, {}),
    ]);

    const candidates = buildCandidates({
      scope: session.scope as HardModeScope,
      todayHabits,
      inboxTasks,
      recoveryContext,
    });

    const calibratedCandidates = adjustForCalibration({
      items: candidates,
      accuracy: aiContext.calibration.hardModePlanAccuracy,
      scope: session.scope as HardModeScope,
      inboxTasks,
    });

    const conservative = scheduleConservativeCadence(
      args.dayStart,
      calibratedCandidates.slice().sort(byConfidenceDesc),
    );

    const basePlan: HardModePlan = {
      dayStart: args.dayStart,
      generatedAt: Date.now(),
      items: conservative,
    };

    validateHardModePlan(basePlan, session.constraints as HardModeConstraint[]);

    const safePlan = applyLowEnergyFailsafe(basePlan, lastCheckin?.mood, lastCheckin?.energy);

    await ctx.runMutation(applyGeneratedPlanRef, {
      sessionId: args.sessionId,
      plan: safePlan,
    });

    await writeAiContext(ctx, {
      memoryEntries: [
        {
          module: "hard_mode",
          observation: `Generated hard mode plan with ${safePlan.items.length} items at accuracy ${aiContext.calibration.hardModePlanAccuracy.toFixed(2)}.`,
          confidence: "medium",
          source: "generateHardModePlan",
        },
      ],
    });

    return { generated: true };
  },
});
