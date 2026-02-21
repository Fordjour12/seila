import { internalQuery, query, type QueryCtx } from "../_generated/server";

async function getLastCheckin(ctx: QueryCtx) {
  const checkins = await ctx.db.query("checkins").withIndex("by_occurredAt").order("desc").take(1);

  if (checkins.length === 0) {
    return null;
  }

  const last = checkins[0];
  return {
    _id: last._id,
    _creationTime: last._creationTime,
    type: last.type,
    mood: last.mood,
    energy: last.energy,
    occurredAt: last.occurredAt,
  };
}

export const lastCheckin = query({
  args: {},
  handler: async (ctx) => getLastCheckin(ctx),
});

export const internalLastCheckin = internalQuery({
  args: {},
  handler: async (ctx) => getLastCheckin(ctx),
});
