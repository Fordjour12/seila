import { v } from "convex/values";

import { mutation } from "../../_generated/server";

export const setFinanceSecuritySettings = mutation({
  args: {
    idempotencyKey: v.string(),
    biometricLockEnabled: v.boolean(),
    offlineModeEnabled: v.boolean(),
    conflictSafeSyncEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const dedupe = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (dedupe) return { deduplicated: true };

    const existing = await ctx.db.query("financeSecuritySettings").first();
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        biometricLockEnabled: args.biometricLockEnabled,
        offlineModeEnabled: args.offlineModeEnabled,
        conflictSafeSyncEnabled: args.conflictSafeSyncEnabled,
        updatedAt: now,
      });
      return { settingsId: existing._id, deduplicated: false };
    }

    const settingsId = await ctx.db.insert("financeSecuritySettings", {
      biometricLockEnabled: args.biometricLockEnabled,
      offlineModeEnabled: args.offlineModeEnabled,
      conflictSafeSyncEnabled: args.conflictSafeSyncEnabled,
      updatedAt: now,
      createdAt: now,
    });

    return { settingsId, deduplicated: false };
  },
});
