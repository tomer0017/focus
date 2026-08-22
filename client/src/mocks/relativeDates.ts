/**
 * Mock timestamps are generated relative to the moment the app loads, so
 * countdowns ("12 days left") and "last updated" labels stay believable
 * whenever the demo is opened, instead of rotting into the past.
 *
 * Once real data arrives these helpers disappear with the mock module.
 */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const LOADED_AT = new Date();

function shiftDays(days: number, hour: number, minute = 0): string {
  const date = new Date(LOADED_AT.getTime() + days * MS_PER_DAY);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

/** A timestamp `days` in the past. */
export const daysAgo = (days: number, hour = 18): string => shiftDays(-days, hour);

/** A timestamp `days` in the future. */
export const daysAhead = (days: number, hour = 9): string => shiftDays(days, hour);
