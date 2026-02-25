import type { Command, LifeEvent } from "./index.js";

export type HardModeModule = "habits" | "tasks" | "checkin" | "finance";
export type HardModeFlag = "not_now" | "not_aligned" | "too_much";

export type HardModeScope = {
  habits: boolean;
  tasks: boolean;
  checkin: boolean;
  finance: boolean;
};

export type HardModeConstraint =
  | {
      id: string;
      type: "allowed_habit_anchors";
      anchors: Array<"morning" | "afternoon" | "evening" | "anytime">;
    }
  | {
      id: string;
      type: "max_planned_items";
      value: number;
    }
  | {
      id: string;
      type: "disallow_module";
      module: HardModeModule;
    };

export type PlannedItem = {
  id: string;
  module: HardModeModule;
  kind: string;
  title: string;
  scheduledAt: number;
  confidence: number;
  rationale: string;
  habitAnchor?: "morning" | "afternoon" | "evening" | "anytime";
  status: "planned" | "done" | "dropped";
  flaggedAt?: number;
};

export type HardModePlan = {
  dayStart: number;
  generatedAt: number;
  items: PlannedItem[];
};

export type HardModeSession = {
  id: string;
  scope: HardModeScope;
  constraints: HardModeConstraint[];
  windowStart: number;
  windowEnd: number;
  isActive: boolean;
  plan: HardModePlan | null;
  createdAt: number;
  deactivatedAt?: number;
};

export type ActivateHardModePayload = {
  sessionId: string;
  scope: HardModeScope;
  constraints: HardModeConstraint[];
  windowStart: number;
  windowEnd: number;
};

export type ExtendHardModePayload = {
  sessionId: string;
  newWindowEnd: number;
};

export type GenerateHardModePlanPayload = {
  sessionId: string;
  plan: HardModePlan;
  lowEnergy?: {
    mood: number;
    energy: number;
  };
};

export type FlagHardModeItemPayload = {
  sessionId: string;
  itemId: string;
  flag: HardModeFlag;
};

export type DeactivateHardModePayload = {
  sessionId: string;
};

export type CrisisOverridePayload = {
  sessionId: string;
};

export type HardModeCommand =
  | Command<"hardMode.activate", ActivateHardModePayload>
  | Command<"hardMode.extend", ExtendHardModePayload>
  | Command<"hardMode.planGenerated", GenerateHardModePlanPayload>
  | Command<"hardMode.itemFlag", FlagHardModeItemPayload>
  | Command<"hardMode.deactivate", DeactivateHardModePayload>
  | Command<"hardMode.crisisOverride", CrisisOverridePayload>;

export type HardModeEvent =
  | LifeEvent<"hardMode.activated", ActivateHardModePayload>
  | LifeEvent<"hardMode.extended", ExtendHardModePayload>
  | LifeEvent<"hardMode.planGenerated", GenerateHardModePlanPayload>
  | LifeEvent<"hardMode.itemFlagged", FlagHardModeItemPayload>
  | LifeEvent<"hardMode.deactivated", DeactivateHardModePayload>
  | LifeEvent<"hardMode.crisisOverride", CrisisOverridePayload>;

export type HardModeState = {
  currentSession: HardModeSession | null;
};

export const initialHardModeState: HardModeState = {
  currentSession: null,
};

export function validatePlannedItemAgainstConstraints(
  item: PlannedItem,
  constraints: HardModeConstraint[],
): void {
  for (const constraint of constraints) {
    if (constraint.type === "disallow_module" && item.module === constraint.module) {
      throw new Error(`Constraint violation: module ${item.module} is disallowed`);
    }

    if (constraint.type === "allowed_habit_anchors" && item.module === "habits") {
      if (!item.habitAnchor || !constraint.anchors.includes(item.habitAnchor)) {
        throw new Error("Constraint violation: habit anchor is not allowed");
      }
    }
  }
}

export function validateHardModePlan(plan: HardModePlan, constraints: HardModeConstraint[]): void {
  for (const item of plan.items) {
    validatePlannedItemAgainstConstraints(item, constraints);
  }

  const maxItems = constraints
    .filter(
      (constraint): constraint is Extract<HardModeConstraint, { type: "max_planned_items" }> =>
        constraint.type === "max_planned_items",
    )
    .sort((a, b) => a.value - b.value)[0];

  if (maxItems && plan.items.length > maxItems.value) {
    throw new Error("Constraint violation: plan exceeds max_planned_items");
  }
}

export function applyLowEnergyFailsafe(
  plan: HardModePlan,
  mood?: number,
  energy?: number,
): HardModePlan {
  if (typeof mood !== "number" || typeof energy !== "number") {
    return plan;
  }

  if (mood > 2 && energy > 2) {
    return plan;
  }

  const keptByModule = new Set<HardModeModule>();
  const items = plan.items
    .slice()
    .sort((a, b) => a.scheduledAt - b.scheduledAt)
    .filter((item) => {
      if (item.module !== "habits" && item.module !== "tasks" && item.module !== "checkin") {
        return false;
      }

      if (keptByModule.has(item.module)) {
        return false;
      }

      keptByModule.add(item.module);
      return true;
    })
    .map((item) => ({
      ...item,
      status: "planned" as const,
    }));

  return {
    ...plan,
    items,
  };
}

export function applyHardModeFlagToPlan(
  plan: HardModePlan,
  itemId: string,
  flag: HardModeFlag,
  occurredAt: number,
): HardModePlan {
  const target = plan.items.find((item) => item.id === itemId);
  if (!target) {
    return plan;
  }

  if (flag === "not_now") {
    return {
      ...plan,
      items: plan.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              scheduledAt: item.scheduledAt + 2 * 60 * 60 * 1000,
              flaggedAt: occurredAt,
              status: "planned",
            }
          : item,
      ),
    };
  }

  if (flag === "not_aligned") {
    return {
      ...plan,
      items: plan.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status: "dropped",
              flaggedAt: occurredAt,
            }
          : item,
      ),
    };
  }

  const remaining = plan.items
    .filter((item) => item.id !== itemId && item.status === "planned")
    .sort((a, b) => a.confidence - b.confidence);
  const dropId = remaining[0]?.id;

  return {
    ...plan,
    items: plan.items.map((item) => {
      if (item.id === itemId || (dropId && item.id === dropId)) {
        return {
          ...item,
          status: "dropped",
          flaggedAt: occurredAt,
        };
      }

      return item;
    }),
  };
}

export function hardModeReducer(state: HardModeState, event: HardModeEvent): HardModeState {
  if (event.type === "hardMode.activated") {
    return {
      currentSession: {
        id: event.payload.sessionId,
        scope: event.payload.scope,
        constraints: event.payload.constraints,
        windowStart: event.payload.windowStart,
        windowEnd: event.payload.windowEnd,
        isActive: true,
        plan: null,
        createdAt: event.occurredAt,
      },
    };
  }

  if (!state.currentSession || state.currentSession.id !== event.payload.sessionId) {
    return state;
  }

  if (event.type === "hardMode.extended") {
    return {
      currentSession: {
        ...state.currentSession,
        windowEnd: event.payload.newWindowEnd,
      },
    };
  }

  if (event.type === "hardMode.planGenerated") {
    validateHardModePlan(event.payload.plan, state.currentSession.constraints);

    const constrainedPlan = applyLowEnergyFailsafe(
      event.payload.plan,
      event.payload.lowEnergy?.mood,
      event.payload.lowEnergy?.energy,
    );

    return {
      currentSession: {
        ...state.currentSession,
        plan: constrainedPlan,
      },
    };
  }

  if (event.type === "hardMode.itemFlagged") {
    if (!state.currentSession.plan) {
      return state;
    }

    return {
      currentSession: {
        ...state.currentSession,
        plan: applyHardModeFlagToPlan(
          state.currentSession.plan,
          event.payload.itemId,
          event.payload.flag,
          event.occurredAt,
        ),
      },
    };
  }

  if (event.type === "hardMode.crisisOverride") {
    return {
      currentSession: {
        ...state.currentSession,
        plan: state.currentSession.plan
          ? {
              ...state.currentSession.plan,
              items: state.currentSession.plan.items.map((item) => ({
                ...item,
                status: "dropped",
                flaggedAt: event.occurredAt,
              })),
            }
          : null,
      },
    };
  }

  if (event.type === "hardMode.deactivated") {
    return {
      currentSession: {
        ...state.currentSession,
        isActive: false,
        deactivatedAt: event.occurredAt,
      },
    };
  }

  return state;
}

export function handleHardModeCommand(
  _events: ReadonlyArray<HardModeEvent>,
  command: HardModeCommand,
): ReadonlyArray<HardModeEvent> {
  if (command.type === "hardMode.activate") {
    return [
      {
        type: "hardMode.activated",
        occurredAt: command.requestedAt,
        idempotencyKey: command.idempotencyKey,
        payload: command.payload,
        meta: {},
      },
    ];
  }

  if (command.type === "hardMode.extend") {
    return [
      {
        type: "hardMode.extended",
        occurredAt: command.requestedAt,
        idempotencyKey: command.idempotencyKey,
        payload: command.payload,
        meta: {},
      },
    ];
  }

  if (command.type === "hardMode.planGenerated") {
    return [
      {
        type: "hardMode.planGenerated",
        occurredAt: command.requestedAt,
        idempotencyKey: command.idempotencyKey,
        payload: command.payload,
        meta: {},
      },
    ];
  }

  if (command.type === "hardMode.itemFlag") {
    return [
      {
        type: "hardMode.itemFlagged",
        occurredAt: command.requestedAt,
        idempotencyKey: command.idempotencyKey,
        payload: command.payload,
        meta: {},
      },
    ];
  }

  if (command.type === "hardMode.deactivate") {
    return [
      {
        type: "hardMode.deactivated",
        occurredAt: command.requestedAt,
        idempotencyKey: command.idempotencyKey,
        payload: command.payload,
        meta: {},
      },
    ];
  }

  if (command.type === "hardMode.crisisOverride") {
    return [
      {
        type: "hardMode.crisisOverride",
        occurredAt: command.requestedAt,
        idempotencyKey: command.idempotencyKey,
        payload: command.payload,
        meta: {},
      },
    ];
  }

  return [];
}
