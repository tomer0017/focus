import type { FocusEvent, PageStatus, PageSummary, Routine, SavedItem, SpaceId } from "../types";
import type { Commitment } from "../types/finance";
import type { FamilyProfile } from "../types/family";
import type { LeisureItem } from "../types/leisure";
import type { Menu } from "../types/menu";
import type { ScheduledItem } from "../types/scheduled";
import { isBlocked } from "../types";
import { daysUntil } from "./format";
import { dateKeyToIso, todayKey } from "./dateKey";
import { completionsInMonth, nextPlannedKey } from "./routineSchedule";
import { eventHref, isDerivedBirthday } from "./birthdays";

/** How many items each dashboard section shows before it offers "show all". */
/*
 * Three, everywhere, on the overview.
 *
 * The overview answers four questions and hands off; it is not a list of
 * anything. Four rows per section rather than three is only 25% more on a
 * laptop, but on a phone every section stacks, and the difference between three
 * and four across five sections is a screen and a half of scrolling before the
 * user reaches the section that actually concerned them.
 */
export const ATTENTION_LIMIT = 3;
export const CONTINUE_LIMIT = 3;
export const SAVED_LIMIT = 3;
export const UPCOMING_LIMIT = 3;

/** One row in "Today & upcoming", normalised across three different entities. */
export interface UpcomingEntry {
  /** Unique within the strip. */
  id: string;
  /** Where the card leads. */
  href: string;
  title: string;
  /**
   * Which entity produced this entry — drives the label and the action.
   *
   * `birthday` is separate from `event` because it is derived rather than
   * stored: it leads to the profile it was computed from, and its title is the
   * person's name, which the strip composes into a label at render.
   */
  kind: "routine" | "event" | "checklist" | "birthday";
  /** Only routines can be marked done from the strip. */
  routineId?: string;
  /**
   * True when the entry is a calendar day rather than a moment. A routine is
   * due "on Tuesday", never "on Tuesday at 00:00" — printing a midnight it
   * never had would be inventing precision nobody typed.
   */
  allDay: boolean;
  at: string;
  daysAway: number;
}

/* ------------------------------------------------------------------ pages -- */

/** A page needs attention when it is genuinely stuck, not merely unfinished. */
export function needsAttention(page: PageSummary): boolean {
  return page.status !== "completed" && isBlocked(page);
}

/** Oldest-first: the thing stuck longest is the thing most likely forgotten. */
export function selectNeedsAttention(pages: PageSummary[]): PageSummary[] {
  return pages
    .filter(needsAttention)
    .sort((a, b) => a.lastUpdatedAt.localeCompare(b.lastUpdatedAt));
}

/**
 * "Pick up where you left off": recently touched work that is NOT already
 * shown under Needs attention. The exclusion is the point — showing the same
 * project twice on one screen is the duplication this dashboard removed.
 */
export function selectContinue(pages: PageSummary[]): PageSummary[] {
  return pages
    .filter(
      (page) =>
        !needsAttention(page) &&
        page.status === "active" &&
        // Something to resume: either a recorded stopping point or a next step.
        Boolean(page.stoppedAt || page.nextAction)
    )
    .sort((a, b) => b.lastUpdatedAt.localeCompare(a.lastUpdatedAt));
}

export function selectByStatus(pages: PageSummary[], status: PageStatus): PageSummary[] {
  return pages.filter((page) => page.status === status);
}

export function selectByType(pages: PageSummary[], type: PageSummary["type"]): PageSummary[] {
  return pages
    .filter((page) => page.type === type)
    .sort((a, b) => b.lastUpdatedAt.localeCompare(a.lastUpdatedAt));
}

/** Favourites — the few pages worth one click from anywhere. */
export function selectQuickAccess(pages: PageSummary[]): PageSummary[] {
  return pages.filter((page) => page.favorite);
}

export function pagesInSpace(pages: PageSummary[], spaceId: SpaceId): PageSummary[] {
  return pages.filter((page) => page.spaceId === spaceId);
}

/* --------------------------------------------------------------- upcoming -- */

/**
 * Flattens routines, events and dated checklists into one time-ordered list.
 * Past occurrences are dropped: this strip answers "what is coming", nothing else.
 */
export function selectUpcoming(
  pages: PageSummary[],
  routines: Routine[],
  events: FocusEvent[],
  now: Date = new Date()
): UpcomingEntry[] {
  const entries: UpcomingEntry[] = [];
  const today = todayKey(now);

  for (const routine of routines) {
    const next = nextPlannedKey(routine, today);
    if (!next) continue;
    const at = dateKeyToIso(next);
    entries.push({
      id: `routine-${routine.id}`,
      href: `/routines/${routine.id}`,
      title: routine.title,
      kind: "routine",
      routineId: routine.id,
      allDay: true,
      at,
      daysAway: daysUntil(at, now),
    });
  }

  for (const event of events) {
    const derived = isDerivedBirthday(event);
    entries.push({
      id: `event-${event.id}`,
      // A derived birthday has no stored event, so `/events/birthday:mom` would
      // be a link to nothing. It leads to the profile instead.
      href: eventHref(event),
      title: event.title,
      kind: derived ? "birthday" : "event",
      // A birthday is a day, not a moment: nobody typed a time for it.
      allDay: derived,
      at: event.startsAt,
      daysAway: daysUntil(event.startsAt, now),
    });
  }

  for (const page of pages) {
    if (!page.dueAt) continue;
    entries.push({
      id: `checklist-${page.id}`,
      href: `/pages/${page.id}`,
      title: page.title,
      kind: "checklist",
      allDay: false,
      at: page.dueAt,
      daysAway: daysUntil(page.dueAt, now),
    });
  }

  return entries.filter((entry) => entry.daysAway >= 0).sort((a, b) => a.daysAway - b.daysAway);
}

export function eventsInSpace(events: FocusEvent[], spaceId: SpaceId): FocusEvent[] {
  return events
    .filter((event) => event.spaceId === spaceId)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function routinesInSpace(routines: Routine[], spaceId: SpaceId): Routine[] {
  return routines.filter((routine) => routine.spaceId === spaceId);
}

/* ------------------------------------------------------------- activities -- */

/**
 * The one activity number the overview carries: sessions logged this month
 * across every training routine. Not a KPI — an answer to "have I actually
 * been going?", which is the only question worth a number here.
 */
export function trainingSessionsThisMonth(routines: Routine[], now: Date = new Date()): number {
  return routines
    .filter((routine) => routine.domain === "training")
    .reduce(
      (total, routine) => total + completionsInMonth(routine, now.getFullYear(), now.getMonth()),
      0
    );
}

/* ------------------------------------------------------------ saved items -- */

export function selectRecentSaved(items: SavedItem[]): SavedItem[] {
  return [...items].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function selectSavedByKind(items: SavedItem[], ...kinds: SavedItem["kind"][]): SavedItem[] {
  return selectRecentSaved(items).filter((item) => kinds.includes(item.kind));
}

export function savedInSpace(items: SavedItem[], spaceId: SpaceId): SavedItem[] {
  return items.filter((item) => item.spaceId === spaceId);
}

/* ----------------------------------------------------------------- search -- */

/**
 * Client-side search over the fields that actually help you find something
 * again. Case-insensitive substring match; no ranking — the data set is small.
 */
export function searchPages(pages: PageSummary[], query: string): PageSummary[] {
  const term = query.trim().toLowerCase();
  if (!term) return pages;

  return pages.filter((page) =>
    [page.title, page.description, page.currentState, page.stoppedAt, page.blocker, page.nextAction]
      .filter((field): field is string => Boolean(field))
      .some((field) => field.toLowerCase().includes(term))
  );
}

export function searchSavedItems(items: SavedItem[], query: string): SavedItem[] {
  const term = query.trim().toLowerCase();
  if (!term) return items;

  return items.filter((item) =>
    [item.title, item.note, item.category]
      .filter((field): field is string => Boolean(field))
      .some((field) => field.toLowerCase().includes(term))
  );
}

export function searchRoutines(routines: Routine[], query: string): Routine[] {
  const term = query.trim().toLowerCase();
  if (!term) return routines;

  return routines.filter((routine) =>
    [routine.title, routine.description, routine.notes]
      .filter((field): field is string => Boolean(field))
      .some((field) => field.toLowerCase().includes(term))
  );
}

export function searchEvents(events: FocusEvent[], query: string): FocusEvent[] {
  const term = query.trim().toLowerCase();
  if (!term) return events;

  return events.filter((event) =>
    [event.title, event.description, event.nextAction]
      .filter((field): field is string => Boolean(field))
      .some((field) => field.toLowerCase().includes(term))
  );
}

/* ------------------------------------------- search over the newer slices -- */

/**
 * Search over the entities the ongoing-management and family areas added.
 *
 * Two rules apply here that do not apply to pages:
 *
 * 1. **No medical detail in a preview.** A result for an appointment shows its
 *    title and its category, never the note, the result or what to bring. A
 *    search box is a surface somebody else can read over your shoulder, and a
 *    blood-test result is not something to render in a list on the way to it.
 * 2. **Match on more than the preview shows.** Typing a word that appears only
 *    in a note still finds the item — it just does not print the note.
 */
function matches(term: string, fields: (string | undefined)[]): boolean {
  return fields
    .filter((field): field is string => Boolean(field))
    .some((field) => field.toLowerCase().includes(term));
}

export function searchScheduled(items: ScheduledItem[], query: string): ScheduledItem[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  return items.filter((item) =>
    matches(term, [
      item.title,
      item.note,
      item.result,
      item.appointment?.location,
      item.appointment?.bring,
      item.appointment?.prepare,
      item.appointment?.followUp,
    ])
  );
}

export function searchCommitments(items: Commitment[], query: string): Commitment[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  return items.filter((item) =>
    matches(term, [item.title, item.provider, item.category, item.note, item.paymentMethod])
  );
}

export function searchProfiles(profiles: FamilyProfile[], query: string): FamilyProfile[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  return profiles.filter(
    (profile) =>
      matches(term, [profile.name, profile.relationship, profile.species]) ||
      profile.notes.some((note) => matches(term, [note.title, note.content]))
  );
}

export function searchLeisure(items: LeisureItem[], query: string): LeisureItem[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  return items.filter((item) => matches(term, [item.title, item.note, ...item.tags]));
}

export function searchMenus(menus: Menu[], query: string): Menu[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  return menus.filter(
    (menu) =>
      matches(term, [menu.title, menu.note]) ||
      menu.dishes.some((dish) => matches(term, [dish.title, dish.note, ...(dish.shoppingItems ?? [])]))
  );
}

/** True for a category whose details must never appear in a search preview. */
export function isSensitiveCategory(category: ScheduledItem["category"]): boolean {
  return category === "appointment" || category === "checkup" || category === "vaccination";
}
