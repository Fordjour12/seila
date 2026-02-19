import { expo } from "@better-auth/expo";
import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";

import type { DataModel } from "./_generated/dataModel";

import { components } from "./_generated/api";
import { type MutationCtx, query, type QueryCtx, type ActionCtx } from "./_generated/server";
import authConfig from "./auth.config";

const nativeAppUrl = process.env.NATIVE_APP_URL || "mybettertapp://";

export const authComponent = createClient<DataModel>(components.betterAuth);

function createAuth(ctx: GenericCtx<DataModel>) {
  return betterAuth({
    trustedOrigins: [
      nativeAppUrl,
      ...(process.env.NODE_ENV === "development"
        ? ["exp://", "exp://**", "exp://192.168.*.*:*/**"]
        : []),
    ],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      expo(),
      convex({
        authConfig,
        jwksRotateOnTokenGenerationError: true,
      }),
    ],
  });
}

export { createAuth };


export async function safeGetAuthUserForQuery(ctx: QueryCtx | MutationCtx | ActionCtx) {
  return await authComponent.safeGetAuthUser(
    ctx as unknown as GenericCtx<DataModel>,
  );
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await safeGetAuthUserForQuery(ctx);
  },
});
