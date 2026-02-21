import { query } from "../_generated/server";

export const financeSecuritySettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("financeSecuritySettings").first();
    if (!settings) {
      return {
        biometricLockEnabled: false,
        offlineModeEnabled: false,
        conflictSafeSyncEnabled: true,
      };
    }

    return {
      biometricLockEnabled: settings.biometricLockEnabled,
      offlineModeEnabled: settings.offlineModeEnabled,
      conflictSafeSyncEnabled: settings.conflictSafeSyncEnabled,
    };
  },
});
