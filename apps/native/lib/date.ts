export function getLocalDayKey(at: Date = new Date()) {
  const year = at.getFullYear();
  const month = `${at.getMonth() + 1}`.padStart(2, "0");
  const day = `${at.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toLocalDayKey(date: Date) {
  return getLocalDayKey(date);
}

export function parseDayKey(dayKey?: string) {
  if (!dayKey || !/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) {
    return new Date();
  }
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDayKey(dayKey?: string) {
  if (!dayKey) {
    return "Not Set";
  }
  const date = parseDayKey(dayKey);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
