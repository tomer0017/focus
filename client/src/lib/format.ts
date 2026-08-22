const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * Whole calendar days from today to `iso`. Negative when in the past.
 * Calendar-based rather than 24h-based so "tomorrow at 09:00" is always 1,
 * whatever time it is now.
 */
export function daysUntil(iso: string, now: Date = new Date()): number {
  return Math.round((startOfDay(new Date(iso)) - startOfDay(now)) / MS_PER_DAY);
}

/*
 * `Intl.*` constructors are not free, and these run on every card in every
 * list. Cached per locale + shape; the map stays tiny (two locales).
 */
const dateTimeCache = new Map<string, Intl.DateTimeFormat>();

function dateTimeFormatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = dateTimeCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    dateTimeCache.set(key, formatter);
  }
  return formatter;
}

const numberCache = new Map<string, Intl.NumberFormat>();

function numberFormatter(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = numberCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    numberCache.set(key, formatter);
  }
  return formatter;
}

/** "19 Aug 2026" / "19 באוג׳ 2026" */
export function formatDate(iso: string, locale: string): string {
  return dateTimeFormatter(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

/** "Wed 19 Aug, 18:00" / "יום ד׳, 19 באוג׳, 18:00" */
export function formatDateTime(iso: string, locale: string): string {
  return dateTimeFormatter(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Weekday and date, with no time — for all-day entries. */
export function formatWeekdayAndDay(iso: string, locale: string): string {
  return dateTimeFormatter(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

/** Weekday + time only, for a "next session" line. */
export function formatDayAndTime(iso: string, locale: string): string {
  return dateTimeFormatter(locale, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatNumber(value: number, locale: string): string {
  return numberFormatter(locale, {}).format(value);
}

/** Locale-aware percentage, e.g. "67%" / "67%". */
export function formatPercent(fraction: number, locale: string): string {
  return numberFormatter(locale, {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(fraction);
}

/**
 * Relative day label ("Today", "in 5 days", "3 days ago").
 *
 * `Intl.RelativeTimeFormat` handles the wording and grammar for both languages,
 * including Hebrew's dual/plural forms, so no translation keys are needed here.
 * `numeric: "auto"` is what turns "in 0 days" into "today".
 */
const relativeCache = new Map<string, Intl.RelativeTimeFormat>();

export function formatRelativeDay(iso: string, locale: string, now: Date = new Date()): string {
  let formatter = relativeCache.get(locale);
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    relativeCache.set(locale, formatter);
  }
  return formatter.format(daysUntil(iso, now), "day");
}

/** Percentage complete for a checklist, guarding division by zero. */
export function completionFraction(done: number, total: number): number {
  return total === 0 ? 0 : done / total;
}

/* ----------------------------------------------------- calendar formatting -- */

/** "August 2026" / "אוגוסט 2026", for a month header. */
export function formatMonthYear(year: number, month: number, locale: string): string {
  return dateTimeFormatter(locale, { month: "long", year: "numeric" }).format(
    new Date(year, month, 1)
  );
}

/** "August" / "אוגוסט" — the month on its own, for a month picker. */
export function formatMonthName(month: number, locale: string): string {
  return dateTimeFormatter(locale, { month: "long" }).format(new Date(2024, month, 1));
}

/**
 * A single-letter weekday for a calendar header. Built from a known Sunday so
 * the index maps to the weekday directly, whatever today happens to be.
 */
const KNOWN_SUNDAY = new Date(2024, 0, 7);

export function formatWeekdayNarrow(weekday: number, locale: string): string {
  const date = new Date(
    KNOWN_SUNDAY.getFullYear(),
    KNOWN_SUNDAY.getMonth(),
    KNOWN_SUNDAY.getDate() + weekday
  );
  return dateTimeFormatter(locale, { weekday: "narrow" }).format(date);
}

/** Full weekday name, for a day cell's accessible label. */
export function formatWeekdayLong(weekday: number, locale: string): string {
  const date = new Date(
    KNOWN_SUNDAY.getFullYear(),
    KNOWN_SUNDAY.getMonth(),
    KNOWN_SUNDAY.getDate() + weekday
  );
  return dateTimeFormatter(locale, { weekday: "long" }).format(date);
}

/** "19 Aug 2026" from a `YYYY-MM-DD` key, without a timezone round-trip. */
export function formatDayKey(key: string, locale: string): string {
  const [year, month, day] = key.split("-").map(Number);
  return dateTimeFormatter(locale, { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(year, (month ?? 1) - 1, day ?? 1)
  );
}

/** Long day label for a calendar cell: "Sunday, 3 August". */
export function formatDayKeyLong(key: string, locale: string): string {
  const [year, month, day] = key.split("-").map(Number);
  return dateTimeFormatter(locale, { weekday: "long", day: "numeric", month: "long" }).format(
    new Date(year, (month ?? 1) - 1, day ?? 1)
  );
}

/* -------------------------------------------------------------- currency -- */

/**
 * Money, in the active locale.
 *
 * No decimals: household amounts are read, not reconciled, and "₪3,400" is
 * easier to scan than "₪3,400.00". `Intl` places the symbol and the separators
 * correctly in both languages, so no translation key is involved.
 */
export function formatMoney(amount: number, locale: string, currency = "ILS"): string {
  return numberFormatter(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** A signed amount, so a negative balance reads as one rather than as a bracket. */
export function formatSignedMoney(amount: number, locale: string, currency = "ILS"): string {
  return numberFormatter(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    signDisplay: "exceptZero",
  }).format(amount);
}

/**
 * "18:00" — a time on its own.
 *
 * Takes `HH:MM` rather than a date because that is how a medication schedule is
 * stored: a slot in the day, not a moment. `hourCycle: "h23"` keeps Hebrew and
 * English agreeing, since a dose list mixing "8 PM" and "20:00" is unreadable.
 */
export function formatClockTime(time: string, locale: string): string {
  const [hour, minute] = time.split(":").map(Number);
  return dateTimeFormatter(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(2024, 0, 1, hour ?? 0, minute ?? 0));
}

/** "19 Aug" — no year, for a date inside the next few months. */
export function formatShortDate(iso: string, locale: string): string {
  return dateTimeFormatter(locale, { day: "numeric", month: "short" }).format(new Date(iso));
}

/** "August 2026" from a `YYYY-MM` key. */
export function formatMonthKey(monthKey: string, locale: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return dateTimeFormatter(locale, { month: "long", year: "numeric" }).format(
    new Date(year, (month ?? 1) - 1, 1)
  );
}
