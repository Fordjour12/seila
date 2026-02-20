import { internalQuery } from "../_generated/server";

export const recentDomainState = internalQuery({
  args: {},
  handler: async (ctx) => {
    const [lastCheckins, activePatterns, focusTasks, quietDay] = await Promise.all([
      ctx.db.query("checkins").withIndex("by_occurredAt").order("desc").take(3),
      ctx.db
        .query("patterns")
        .withIndex("by_dismissed_at", (q) => q.eq("dismissedAt", undefined))
        .order("desc")
        .take(3),
      ctx.db.query("tasks").withIndex("by_status", (q) => q.eq("status", "focus")).collect(),
      ctx.db.query("quietDays").withIndex("by_day_start").order("desc").take(1),
    ]);

    return {
      lastCheckins: lastCheckins.map((checkin) => ({
        mood: checkin.mood,
        energy: checkin.energy,
        occurredAt: checkin.occurredAt,
      })),
      activePatternCount: activePatterns.length,
      focusCount: focusTasks.length,
      quietToday: quietDay[0]?.isQuiet ?? false,
    };
  },
});
