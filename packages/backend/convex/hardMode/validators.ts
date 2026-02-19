import { v } from "convex/values";

export const hardModeModuleValidator = v.union(
  v.literal("habits"),
  v.literal("tasks"),
  v.literal("checkin"),
  v.literal("finance"),
);

export const hardModeScopeValidator = v.object({
  habits: v.boolean(),
  tasks: v.boolean(),
  checkin: v.boolean(),
  finance: v.boolean(),
});

export const hardModeConstraintValidator = v.union(
  v.object({
    id: v.string(),
    type: v.literal("allowed_habit_anchors"),
    anchors: v.array(
      v.union(
        v.literal("morning"),
        v.literal("afternoon"),
        v.literal("evening"),
        v.literal("anytime"),
      ),
    ),
  }),
  v.object({
    id: v.string(),
    type: v.literal("max_planned_items"),
    value: v.number(),
  }),
  v.object({
    id: v.string(),
    type: v.literal("disallow_module"),
    module: hardModeModuleValidator,
  }),
);

export const plannedItemValidator = v.object({
  id: v.string(),
  module: hardModeModuleValidator,
  kind: v.string(),
  title: v.string(),
  scheduledAt: v.number(),
  confidence: v.number(),
  rationale: v.string(),
  habitAnchor: v.optional(
    v.union(
      v.literal("morning"),
      v.literal("afternoon"),
      v.literal("evening"),
      v.literal("anytime"),
    ),
  ),
  status: v.union(v.literal("planned"), v.literal("done"), v.literal("dropped")),
  flaggedAt: v.optional(v.number()),
});

export const hardModePlanValidator = v.object({
  dayStart: v.number(),
  generatedAt: v.number(),
  items: v.array(plannedItemValidator),
});

export const hardModeFlagValidator = v.union(
  v.literal("not_now"),
  v.literal("not_aligned"),
  v.literal("too_much"),
);
