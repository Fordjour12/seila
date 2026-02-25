const REVIEW_OPEN_DAYS = new Set([0, 1, 2]); // Sunday, Monday, Tuesday

export function isReviewWindowOpen(now: Date = new Date()): boolean {
  return REVIEW_OPEN_DAYS.has(now.getDay());
}

export function getNextReviewWindowStart(now: Date = new Date()): Date {
  const next = new Date(now);
  next.setHours(0, 0, 0, 0);

  const day = next.getDay();
  const daysUntilSunday = day === 0 ? 7 : 7 - day;
  next.setDate(next.getDate() + daysUntilSunday);

  return next;
}
