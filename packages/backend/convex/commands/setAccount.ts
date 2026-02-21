import { ConvexError, v } from "convex/values";
import { mutation } from "../_generated/server";

export const setAccount = mutation({
  args: {
    idempotencyKey: v.string(),
    accountId: v.optional(v.id("accounts")),
    name: v.string(),
    type: v.union(
      v.literal("checking"),
      v.literal("savings"),
      v.literal("cash"),
      v.literal("credit"),
      v.literal("other"),
    ),
    balance: v.optional(v.number()),
    currency: v.optional(v.string()),
    institution: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const dedupe = await ctx.db
      .query("events")
      .withIndex("by_idempotency_key", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();

    if (dedupe) {
      return { deduplicated: true };
    }

    const name = args.name.trim();
    if (!name) {
      throw new ConvexError("Account name cannot be empty");
    }

    const now = Date.now();

    if (args.accountId) {
      const existing = await ctx.db.get(args.accountId);
      if (!existing) {
        throw new ConvexError("Account not found");
      }

      await ctx.db.patch(args.accountId, {
        name,
        type: args.type,
        balance: args.balance ?? existing.balance,
        currency: args.currency ?? existing.currency,
        institution: args.institution ?? existing.institution,
        updatedAt: now,
      });

      await ctx.db.insert("events", {
        type: "finance.account.updated",
        occurredAt: now,
        idempotencyKey: args.idempotencyKey,
        payload: {
          accountId: args.accountId,
          name,
          type: args.type,
          ...(args.balance !== undefined ? { balance: args.balance } : {}),
        },
      });

      return { accountId: args.accountId, deduplicated: false };
    }

    const accountId = await ctx.db.insert("accounts", {
      name,
      type: args.type,
      balance: args.balance ?? 0,
      currency: args.currency ?? "GHS",
      institution: args.institution,
      isHidden: false,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("events", {
      type: "finance.account.added",
      occurredAt: now,
      idempotencyKey: args.idempotencyKey,
      payload: {
        accountId,
        name,
        type: args.type,
        balance: args.balance ?? 0,
        ...(args.institution ? { institution: args.institution } : {}),
      },
    });

    return { accountId, deduplicated: false };
  },
});

export const updateAccountBalance = mutation({
  args: {
    accountId: v.id("accounts"),
    balance: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.accountId);
    if (!existing) {
      throw new ConvexError("Account not found");
    }

    await ctx.db.patch(args.accountId, {
      balance: args.balance,
      updatedAt: Date.now(),
    });
  },
});

export const hideAccount = mutation({
  args: {
    accountId: v.id("accounts"),
    hidden: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.accountId);
    if (!existing) {
      throw new ConvexError("Account not found");
    }

    await ctx.db.patch(args.accountId, {
      isHidden: args.hidden,
      updatedAt: Date.now(),
    });
  },
});
