/**
 * Leisure as a set of collections — the rules, with no React in them.
 *
 * The screen this backs answers six questions and stops: which books do I own,
 * what have I read, what do I still want to watch, where have I been, where do
 * I want to go, and what have I already researched about that camera. All six
 * were unanswerable before, for one reason:
 *
 * **Ownership and progress were the same field.** `status` was
 * `idea | planned | done`, so "I own it and have not read it" had nowhere to
 * live. You could say a book was an idea, or that it was done, and neither was
 * true. That is the defect this module exists to fix, and the fix is two
 * independent axes rather than more values on one.
 */
import type {
  ConsumptionStatus,
  DestinationStatus,
  LeisureItem,
  LeisureKind,
  OwnershipStatus,
  PurchaseStatus,
} from "../types";
import type { ProjectNoteTemplate } from "./projectNotes";

/* ------------------------------------------------------ the status axes -- */

export const OWNERSHIP_STATUSES: OwnershipStatus[] = [
  "wishlist",
  "owned",
  "borrowed",
  "not_applicable",
];

export const CONSUMPTION_STATUSES: ConsumptionStatus[] = [
  "not_started",
  "in_progress",
  "completed",
  "abandoned",
];

export const DESTINATION_STATUSES: DestinationStatus[] = ["want_to_visit", "visited", "revisit"];

export const PURCHASE_STATUSES: PurchaseStatus[] = [
  "researching",
  "want_to_buy",
  "waiting",
  "purchased",
  "abandoned",
];

/**
 * Which field carries a kind's *primary* status — the one on the row.
 *
 * A book has two statuses and only one of them belongs in the badge. Progress
 * is the one you scan a shelf for; ownership is the one you check before
 * buying, and it sits quietly in the row's meta instead. Two badges of equal
 * weight would be two things to read on every line.
 *
 * `idea` has no axis of its own on purpose. An idea is either still an idea or
 * it is not, which the existing `status` field already says, and inventing a
 * fifth vocabulary for it would be a distinction only the code can see.
 */
export type StatusAxis = "consumption" | "destination" | "purchase" | "none";

export const AXIS_BY_KIND: Record<LeisureKind, StatusAxis> = {
  book: "consumption",
  movie: "consumption",
  destination: "destination",
  future_purchase: "purchase",
  idea: "none",
};

/** True when this kind keeps ownership as a second, independent fact. */
export function tracksOwnership(kind: LeisureKind): boolean {
  // Books only. A streamed film is not owned, and a destination cannot be.
  return kind === "book";
}

/** Every value the primary status of this kind can take, in reading order. */
export function statusValuesFor(kind: LeisureKind): string[] {
  switch (AXIS_BY_KIND[kind]) {
    case "consumption":
      return CONSUMPTION_STATUSES;
    case "destination":
      return DESTINATION_STATUSES;
    case "purchase":
      return PURCHASE_STATUSES;
    case "none":
      return ["idea", "planned", "done"];
  }
}

/**
 * The primary status of one item, as a translation-key suffix.
 *
 * Returns `undefined` when nothing has been recorded, and the caller renders
 * nothing rather than a default — "not started" and "never said" are different,
 * and printing the first for the second is a small lie that accumulates.
 */
export function primaryStatusOf(item: LeisureItem): string | undefined {
  switch (AXIS_BY_KIND[item.kind]) {
    case "consumption":
      return item.consumptionStatus;
    case "destination":
      return item.destinationStatus;
    case "purchase":
      return item.purchaseStatus;
    case "none":
      return item.status;
  }
}

/** The translation namespace path for a kind's status values. */
export function statusKeyFor(kind: LeisureKind): string {
  switch (AXIS_BY_KIND[kind]) {
    case "consumption":
      return "consumption";
    case "destination":
      return "destinationStatus";
    case "purchase":
      return "purchase";
    case "none":
      return "status";
  }
}

/** The patch that sets a kind's primary status, whichever field that is. */
export function setPrimaryStatus(kind: LeisureKind, value: string): Partial<LeisureItem> {
  switch (AXIS_BY_KIND[kind]) {
    case "consumption":
      return { consumptionStatus: value as ConsumptionStatus };
    case "destination":
      return { destinationStatus: value as DestinationStatus };
    case "purchase":
      return { purchaseStatus: value as PurchaseStatus };
    case "none":
      return { status: value as LeisureItem["status"] };
  }
}

/**
 * True once an item is finished with — read, watched, visited, bought, given up
 * on.
 *
 * The suggester uses this so a book you finished last month stops being offered
 * on a quiet evening. It reads the per-kind axis rather than `status`, because
 * that is now where the truth is.
 */
export function isSettled(item: LeisureItem): boolean {
  const status = primaryStatusOf(item);
  return (
    status === "completed" ||
    status === "abandoned" ||
    status === "visited" ||
    status === "purchased" ||
    status === "done"
  );
}

/* ----------------------------------------------------------- migration -- */

/**
 * Old kind → new kind.
 *
 * Every mapping here is a rename, not a judgement: a "place" is a destination
 * and a "wishlist" entry is a future purchase, whatever they were called. The
 * two that lose a distinction — `series` folding into `movie`, and
 * `activity`/`evening` folding into `idea` — keep the original in `legacyKind`,
 * so nothing about the item has actually been thrown away.
 */
export const LEGACY_KIND_MAP: Record<string, LeisureKind> = {
  movie: "movie",
  series: "movie",
  book: "book",
  place: "destination",
  activity: "idea",
  evening: "idea",
  wishlist: "future_purchase",
};

/**
 * Old `status` → the new per-kind status, where the answer is knowable.
 *
 * Two states are deliberately never produced by this table:
 *
 * - **`in_progress`.** Nothing in the old data distinguished "planned to read"
 *   from "reading", so `planned` becomes `not_started`. Guessing the other way
 *   would put books on a "currently reading" shelf the user never put them on.
 * - **`abandoned`.** It had no old equivalent at all, so it can only ever be
 *   set by a person.
 *
 * Ownership is not derived here **at any value**. `saved` never meant "I own
 * it" and never meant "I want it"; it meant neither, and the honest migration
 * of an unknown is to leave it unrecorded. That is the rule the brief asks for
 * and it is the one place this function deliberately does nothing.
 */
function derivedStatus(kind: LeisureKind, status: string): Partial<LeisureItem> {
  switch (AXIS_BY_KIND[kind]) {
    case "consumption":
      return { consumptionStatus: status === "done" ? "completed" : "not_started" };
    case "destination":
      return { destinationStatus: status === "done" ? "visited" : "want_to_visit" };
    case "purchase":
      return {
        purchaseStatus:
          status === "done" ? "purchased" : status === "planned" ? "want_to_buy" : "researching",
      };
    case "none":
      return {};
  }
}

/**
 * Bring one stored item up to the current shape.
 *
 * Idempotent by construction: the kind map sends every new kind to itself, and
 * each status is filled only when it is absent. Running it twice produces the
 * same item as running it once, which is what lets it run on every load.
 *
 * Nothing is dropped. `status`, `note`, `minutes`, `energy`, `company`,
 * `place`, `cost` and the suggester's cooldown stamps all survive untouched —
 * the suggester still reads them and they are still the user's data.
 */
export function migrateLeisureItem(item: LeisureItem): LeisureItem {
  const mapped = LEGACY_KIND_MAP[item.kind] ?? item.kind;
  const renamed = mapped !== item.kind;

  return {
    ...item,
    kind: mapped,
    // Recorded only when the kind actually changed, and never overwritten.
    legacyKind: item.legacyKind ?? (renamed ? item.kind : undefined),
    tags: item.tags ?? [],
    status: item.status ?? "idea",
    ...applyMissing(item, derivedStatus(mapped, item.status ?? "idea")),
  };
}

/** Keeps only the derived keys the item does not already carry an answer for. */
function applyMissing(item: LeisureItem, derived: Partial<LeisureItem>): Partial<LeisureItem> {
  const out: Partial<LeisureItem> = {};
  for (const [key, value] of Object.entries(derived) as [keyof LeisureItem, unknown][]) {
    if (item[key] === undefined) Object.assign(out, { [key]: value });
  }
  return out;
}

/* ------------------------------------------------------------ filtering -- */

export interface CollectionFilter {
  kind: LeisureKind;
  /** A value from `statusValuesFor(kind)`, or absent for "all". */
  status?: string;
  query?: string;
  /** Books only: narrow by ownership as well as by progress. */
  ownership?: OwnershipStatus;
}

/**
 * The items one tab of the leisure screen shows.
 *
 * Filtering by kind **first** is what stops the categories mixing: a status
 * value belongs to one axis, so "visited" can never match a book however the
 * URL is edited. Search runs over the whole category rather than the current
 * page or the current status, because looking for a book you half remember is
 * exactly the moment you do not recall whether you finished it.
 */
export function filterCollection(items: LeisureItem[], filter: CollectionFilter): LeisureItem[] {
  const term = filter.query?.trim().toLowerCase();

  return items.filter((item) => {
    if (item.kind !== filter.kind) return false;
    if (filter.status && primaryStatusOf(item) !== filter.status) return false;
    if (filter.ownership && item.ownershipStatus !== filter.ownership) return false;

    if (term) {
      const haystack = [item.title, item.note, item.region, ...(item.tags ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
}

/** Newest first, then by title so the order is stable between renders. */
export function sortCollection(items: LeisureItem[]): LeisureItem[] {
  return [...items].sort(
    (a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.title.localeCompare(b.title)
  );
}

/** How many items sit in each kind — the counts beside the tabs. */
export function countByKind(items: LeisureItem[]): Record<LeisureKind, number> {
  const counts = { book: 0, movie: 0, destination: 0, future_purchase: 0, idea: 0 };
  for (const item of items) counts[item.kind] += 1;
  return counts;
}

/* ------------------------------------------------------ note templates -- */

/**
 * The starting points offered when writing a note, per kind.
 *
 * A template fills in a title and a prompt and nothing else — the same rule
 * event sections, checklist groups and learning notes follow, so no template
 * ever writes somebody else's content onto a user's page. Keys live in the
 * `pages` namespace because `ProjectNotes` translates them there; this module
 * only chooses *which* set is offered.
 *
 * Scoped per kind for the reason the learning page has its own set: a picker
 * that can hand a screen another area's prompts is how "start a study plan"
 * once produced a supermarket list. "Pros and cons" is the right question for a
 * camera and the wrong one for a novel.
 */
export const LEISURE_NOTE_TEMPLATES: Record<LeisureKind, ProjectNoteTemplate[]> = {
  book: [
    template("whyStart", "leisureNotes.whyRead"),
    template("stoppedAt", "leisureNotes.stoppedAt"),
    template("ideas", "leisureNotes.ideas"),
    template("summary", "leisureNotes.summary"),
  ],
  movie: [
    template("whyWatch", "leisureNotes.whyWatch"),
    template("thoughts", "leisureNotes.thoughts"),
    template("recommendTo", "leisureNotes.recommendTo"),
  ],
  destination: [
    template("whyGo", "leisureNotes.whyGo"),
    template("placesThere", "leisureNotes.placesThere"),
    template("worthKnowing", "leisureNotes.worthKnowing"),
  ],
  future_purchase: [
    template("whyNeed", "leisureNotes.whyNeed"),
    template("prosCons", "leisureNotes.prosCons"),
    template("checkedSoFar", "leisureNotes.checkedSoFar"),
    template("beforeBuying", "leisureNotes.beforeBuying"),
  ],
  idea: [
    template("whatItIs", "leisureNotes.whatItIs"),
    template("worthKnowing", "leisureNotes.worthKnowing"),
  ],
};

function template(id: string, base: string): ProjectNoteTemplate {
  return { id, titleKey: `${base}.title`, hintKey: `${base}.hint` };
}
