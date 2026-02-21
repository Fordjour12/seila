export function formatGhs(cents: number): string {
  const ghs = cents / 100;
  return `₵${ghs.toFixed(2)}`;
}

export function parseGhsToCents(ghsString: string): number {
  const cleaned = ghsString.replace(/[₵GHS,\s]/g, "");
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}
