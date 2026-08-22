/**
 * The overview, as arithmetic.
 *
 * This module answers one question — *what should I deal with now?* — and it
 * answers it by leaving things out. The screen it backs used to show eight
 * sections at once: what needs you, what is near, what is stuck, where you
 * stopped, how many sessions this month, quick access, and a gallery of
 * recently saved pictures. Everything on it was true. Almost none of it changed
 * what anybody would do next, and the gallery was the tallest thing on the page.
 *
 * Three rules follow from that, and every function here obeys them:
 *
 * 1. **Nothing appears until it has become relevant.** `collectRelevance`
 *    already enforces this — a renewal eight months out is not here.
 * 2. **Severity decides the order, not the calendar.** Late beats today beats
 *    soon, and a date is only the tie-break inside a band.
 * 3. **Every area has a hard cap.** Five, six, three and three. A screen whose
 *    length depends on how much data you have is a screen you scroll instead of
 *    read.
 *
 * Nothing here is stored. Every value is computed on each read from the
 * entities that already exist, and each row carries the `EntityReference` it
 * came from — so a dashboard row can never disagree with its source, and there
 * is no dashboard record to migrate, duplicate or leave stale.
 */
import { daysUntil } from "./format";
import { notesForPage } from "./projectNotes";
import { referenceKey } from "../types/reference";
import type { RelevanceItem } from "./relevance";
import type { LearningLevel, PageSummary } from "../types/page";

/**
 * How loudly a row is asking, in words.
 *
 * A separate idea from the relevance bucket, which says *when* something falls;
 * this says *how bad it is now*. They usually agree and are allowed not to: an
 * event inside its preparation window is `soon` however many days remain.
 *
 * Colour is only ever an accent over one of these — the word is always
 * rendered, because "the red one" is not a fact a screen reader or a
 * colour-blind reader can recover.
 */
export type DashboardState = "overdue" | "today" | "soon";

export function stateOf(item: RelevanceItem): DashboardState {
  if (item.overdue) return "overdue";
  if (item.daysAway !== undefined && item.daysAway <= 0) return "today";
  return "soon";
}

/**
 * Severity, as a sortable number. Lower is more urgent.
 *
 * Banded rather than continuous so a date can never promote a "soon" item above
 * a late one: everything overdue sorts before everything due today, whatever
 * the timestamps say. Inside a band the date breaks the tie, and the title
 * breaks that, so the order does not shuffle between renders.
 */
export function severityOf(item: RelevanceItem): number {
  const band = item.overdue ? 0 : item.daysAway !== undefined && item.daysAway <= 0 ? 1 : 2;
  // Days are added at a hundredth of a band, so 30 days cannot cross a band.
  const within = Math.min(Math.max(item.daysAway ?? 0, 0), 99) / 100;
  return band + within;
}

/** Severity first, then the date, then the title. */
function bySeverity(a: RelevanceItem, b: RelevanceItem): number {
  const difference = severityOf(a) - severityOf(b);
  if (difference !== 0) return difference;
  if (a.at && b.at && a.at !== b.at) return a.at.localeCompare(b.at);
  return a.title.localeCompare(b.title);
}

/**
 * One row per underlying thing.
 *
 * De-duplicated on the **source's identity** — its `EntityReference` — and
 * never on the title. Two appointments both called "בדיקה" are two
 * appointments; one scheduled item reached through two code paths is one thing,
 * and showing it twice is how a triage list loses trust. An item with no
 * reference falls back to its own id, which `collectRelevance` already
 * guarantees is unique per source.
 */
export function dedupeBySource(items: RelevanceItem[]): RelevanceItem[] {
  const seen = new Set<string>();
  const out: RelevanceItem[] = [];

  for (const item of items) {
    const key = item.reference ? referenceKey(item.reference) : item.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** Caps, in one place, because they are the whole design. */
export const NEEDS_YOU_LIMIT = 5;
export const NEXT_DAYS_LIMIT = 6;
export const FOCUS_LIMIT = 3;

/** How far "the next days" looks. Two weeks is as far as preparation reaches. */
export const NEXT_DAYS_HORIZON = 14;

export interface DashboardSlice<T> {
  /** What to render, already capped. */
  visible: T[];
  /** How many more there are. Zero renders no "and N more". */
  more: number;
}

function slice<T>(items: T[], limit: number): DashboardSlice<T> {
  return { visible: items.slice(0, limit), more: Math.max(items.length - limit, 0) };
}

/**
 * Things asking for something **now**: late, due today, or a reminder that has
 * come round.
 *
 * `waiting` is included and `week` is not. A bill nobody has marked paid is
 * work you are holding whether or not it has a date; a thing that happens on
 * Thursday is not asking on Monday, and putting it here would make the top of
 * the screen mean "soon" instead of "now".
 */
export function selectNeedsYouNow(
  items: RelevanceItem[],
  limit: number = NEEDS_YOU_LIMIT
): DashboardSlice<RelevanceItem> {
  const urgent = dedupeBySource(
    items.filter((item) => item.bucket === "today" || item.bucket === "waiting")
  ).sort(bySeverity);

  return slice(urgent, limit);
}

/**
 * The fortnight ahead — the things that may need preparing, not a calendar.
 *
 * Anything already listed under "needs you now" is excluded by source identity,
 * so nothing on this screen appears twice. Recurring items are included only
 * once they are close: a haircut every three weeks is not a permanent fixture
 * of the overview, and `collectRelevance` has already dropped anything outside
 * its own reminder window.
 */
export function selectNextDays(
  items: RelevanceItem[],
  options: { exclude?: RelevanceItem[]; limit?: number; horizonDays?: number } = {}
): DashboardSlice<RelevanceItem> {
  const { exclude = [], limit = NEXT_DAYS_LIMIT, horizonDays = NEXT_DAYS_HORIZON } = options;

  const taken = new Set(
    exclude.map((item) => (item.reference ? referenceKey(item.reference) : item.id))
  );

  const ahead = dedupeBySource(
    items.filter((item) => {
      if (item.bucket === "today" || item.bucket === "waiting") return false;
      // Undated things — an idle learning page — belong on their own screen,
      // not in a list of dates.
      if (item.daysAway === undefined) return false;
      if (item.daysAway < 0 || item.daysAway > horizonDays) return false;
      const key = item.reference ? referenceKey(item.reference) : item.id;
      return !taken.has(key);
    })
  ).sort(bySeverity);

  return slice(ahead, limit);
}

/* ------------------------------------------------- what I am working on -- */

/**
 * What a project or learning page is showing on the overview.
 *
 * A projection, not a record: it holds the id it came from and four short
 * facts, and it is rebuilt on every read. Nothing here is stored and nothing
 * copies the page's content — the note text stays on the page.
 */
export interface FocusRow {
  id: string;
  title: string;
  /** The subject or category label's *id*; the screen translates it. */
  categoryId?: string;
  /** The one line worth reading: what to do next, or where you stopped. */
  line?: string;
  /** `blocked` is not a status — it is a fact about an active project. */
  state: "active" | "blocked" | "paused";
  /** Learning pages only. The screen turns it into a word. */
  level?: LearningLevel;
  href: string;
  imageUrl?: string;
}

/**
 * The line to show for a page.
 *
 * `nextAction` first, because it is the only field that says what to *do*.
 * Failing that, where you stopped. Failing both, a note the user titled "where
 * I stopped" — read through `notesForPage`, which is the existing adapter, so
 * nothing is copied into a second model and a page written before notes existed
 * still answers.
 */
const STOPPED_NOTE_KEYS = ["learning.notes.stoppedAt.title", "notes.templates.state.title"];

export function focusLineFor(page: PageSummary): string | undefined {
  const direct = page.nextAction?.trim() || page.stoppedAt?.trim();
  if (direct) return direct;

  /*
   * The template keys that mean "where I stopped" — the learning one and the
   * project one. Matching on the *key* rather than on the rendered title is
   * what keeps this working in both languages and stops it guessing from text
   * the user typed themselves.
   */
  const stopped = notesForPage(page).find((note) =>
    STOPPED_NOTE_KEYS.includes(note.titleKey ?? "")
  );
  return stopped?.content.trim() || undefined;
}

/**
 * Up to three projects actually in flight.
 *
 * Blocked ones lead, because a blocker is the thing most likely to be resolved
 * in five minutes and unblock a week. Parked and finished projects are not here
 * at all: "what am I working on" has an answer, and a completed project is not
 * part of it.
 */
export function selectFocusProjects(
  pages: PageSummary[],
  limit: number = FOCUS_LIMIT
): DashboardSlice<FocusRow> {
  const active = pages
    .filter((page) => page.type === "project" && page.status === "active")
    .sort((a, b) => {
      const aBlocked = Boolean(a.blocker?.trim());
      const bBlocked = Boolean(b.blocker?.trim());
      if (aBlocked !== bBlocked) return aBlocked ? -1 : 1;
      return b.lastUpdatedAt.localeCompare(a.lastUpdatedAt);
    })
    .map<FocusRow>((page) => ({
      id: page.id,
      title: page.title,
      categoryId: page.categoryId,
      line: page.blocker?.trim() || focusLineFor(page),
      state: page.blocker?.trim() ? "blocked" : "active",
      href: `/pages/${page.id}`,
      imageUrl: page.visionImageUrl,
    }));

  return slice(active, limit);
}

/**
 * Up to three learning pages currently being learned.
 *
 * Ordered by what was studied most recently — `lastStudiedAt` where it exists,
 * because tidying the notes on a page is not studying it and `lastUpdatedAt`
 * cannot tell the two apart.
 */
export function selectFocusLearning(
  pages: PageSummary[],
  limit: number = FOCUS_LIMIT
): DashboardSlice<FocusRow> {
  const active = pages
    .filter((page) => page.type === "learning" && page.status === "active")
    .sort((a, b) => {
      const aAt = a.learning?.lastStudiedAt ?? a.lastUpdatedAt;
      const bAt = b.learning?.lastStudiedAt ?? b.lastUpdatedAt;
      return bAt.localeCompare(aAt);
    })
    .map<FocusRow>((page) => ({
      id: page.id,
      title: page.title,
      categoryId: page.categoryId,
      line: focusLineFor(page),
      state: "active",
      level: page.learning?.level,
      href: `/pages/${page.id}`,
      imageUrl: page.visionImageUrl,
    }));

  return slice(active, limit);
}

/** Days until something, for the countdown beside a row. */
export function daysAwayOf(at: string | undefined, now: Date = new Date()): number | undefined {
  return at ? daysUntil(at, now) : undefined;
}
