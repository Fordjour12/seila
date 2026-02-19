import { query } from "./_generated/server";
import { safeGetAuthUserForQuery } from "./auth";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await safeGetAuthUserForQuery(ctx);
    if (!authUser) {
      return {
        message: "Not authenticated",
      };
    }
    return {
      message: "This is private",
    };
  },
});
