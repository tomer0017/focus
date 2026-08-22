/**
 * Calendar-day keys, `YYYY-MM-DD`, in the user's own timezone.
 *
 * Completions, planned days and the "shown today" flag are all facts about a
 * *day*, not an instant. Deriving them from an ISO timestamp with `toISOString`
 * would silently shift them a day for anyone east of UTC — which is everyone
 * this app is written for.
 */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local midnight for a key. Returns an invalid date for a malformed key. */
export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function todayKey(now: Date = new Date()): string {
  return toDateKey(now);
}

export function isValidDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Whole calendar days between two keys; negative when `to` is earlier. */
export function daysBetweenKeys(from: string, to: string): number {
  return Math.round((fromDateKey(to).getTime() - fromDateKey(from).getTime()) / MS_PER_DAY);
}

export function addDaysToKey(key: string, days: number): string {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** Local-midnight ISO-ish timestamp for a key, for `<time dateTime>`. */
export function dateKeyToIso(key: string): string {
  return fromDateKey(key).toISOString();
}
