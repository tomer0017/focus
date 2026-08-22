import type { ProjectNote } from "./page";
import type { ThumbKey } from "./savedItem";

/**
 * Something to do when there is time to do something.
 *
 * One model for films, books, places, activities, evening ideas and the
 * wishlist — not six. What differs between them is a word (`kind`) and some
 * tags; what they share is everything else, including the only mechanism that
 * makes the list worth keeping: enough structure to answer "what fits the next
 * ninety minutes, at home, with no energy left".
 */
export type LeisureKind =
  | "book"
  | "movie"
  | "destination"
  | "future_purchase"
  | "idea";

export const LEISURE_KINDS: LeisureKind[] = [
  "book",
  "movie",
  "destination",
  "future_purchase",
  "idea",
];

/**
 * Whether the thing is yours — and *only* that.
 *
 * Kept apart from progress because the two were one field, and one field cannot
 * say "I own it and have not read it", which is the most common state a shelf
 * is ever in. `not_applicable` is a real answer for a film you stream; absent
 * means nobody has recorded it, which is not the same thing and is never
 * invented by a migration.
 */
export type OwnershipStatus = "wishlist" | "owned" | "borrowed" | "not_applicable";

/**
 * How far through it you are. Books and films share this exactly.
 *
 * `abandoned` is not `completed`. Stopping forty pages in is a real outcome and
 * collapsing it into "done" would put things on the finished shelf that were
 * never finished — the same reason `ScheduledItem` keeps `cancelled` apart from
 * `completed`.
 */
export type ConsumptionStatus = "not_started" | "in_progress" | "completed" | "abandoned";

/** Somewhere to go. `revisit` is a place you liked enough to return to. */
export type DestinationStatus = "want_to_visit" | "visited" | "revisit";

/**
 * A purchase you are thinking about, not a shop.
 *
 * `waiting` is deliberate: "decided, but not now" is the state most considered
 * purchases sit in for months, and without it the only honest options are to
 * lie about still researching or to drop the item entirely.
 */
export type PurchaseStatus =
  | "researching"
  | "want_to_buy"
  | "waiting"
  | "purchased"
  | "abandoned";

/** How much of you it takes. The single most useful filter in the set. */
export type LeisureEnergy = "low" | "medium" | "high";

export type LeisureCompany = "alone" | "partner" | "family" | "friends";

export type LeisurePlace = "home" | "out";

export type LeisureCost = "free" | "cheap" | "moderate" | "expensive";

/** Idea → planned → done. Three, because a fourth would need explaining. */
export type LeisureStatus = "idea" | "planned" | "done";

export interface LeisureItem {
  id: string;
  kind: LeisureKind;
  /** User content. */
  title: string;
  /** One line. Never rendered in a list view — see the compact card rule. */
  note?: string;
  /** A real destination, or absent. Never a placeholder. */
  url?: string;
  /** An address only. */
  imageUrl?: string;
  /** Local artwork, for a seeded item with no picture of its own. */
  thumb?: ThumbKey;
  /** Roughly how long it takes, in minutes. */
  minutes?: number;
  energy?: LeisureEnergy;
  /** Who it works with. Empty means "anyone, or alone". */
  company?: LeisureCompany[];
  place?: LeisurePlace;
  cost?: LeisureCost;
  /** The user's own words. Searchable, never translated, never prefixed. */
  tags: string[];
  status: LeisureStatus;
  /**
   * The kind this item had before the five categories existed.
   *
   * Written once by the migration and never read by a screen. It is here so the
   * mapping is reversible: "series" became "movie" and "evening" became "idea",
   * and throwing the original away would have made those the only truth. A
   * migration fills in; it does not destroy.
   */
  legacyKind?: string;
  /** Yours, borrowed, or on a wishlist. Books, mostly. Absent = not recorded. */
  ownershipStatus?: OwnershipStatus;
  /** How far through it you are. Books and films. */
  consumptionStatus?: ConsumptionStatus;
  /** Been, want to go, want to go back. Destinations. */
  destinationStatus?: DestinationStatus;
  /** Where a considered purchase has got to. */
  purchaseStatus?: PurchaseStatus;
  /** Roughly what it would cost. A number the user typed, never fetched. */
  estimatedBudget?: number;
  /** The currency that budget is in. User content — a code or a symbol. */
  currency?: string;
  /** Country or region, for a destination. User content. */
  region?: string;
  /**
   * The item's own blocks, using the shared `ProjectNote` model.
   *
   * Not a second note model, and not a set of fixed rubrics: an item with
   * nothing to say carries none. Templates are offered per kind when a note is
   * being written — a title and a prompt, never content.
   */
  notes?: ProjectNote[];
  /**
   * The last time the suggester offered this, and until when it agreed to stop.
   *
   * Both live on the item rather than in a separate log because they are facts
   * about the item, and because a cooldown that is not stored next to what it
   * cools down is a cooldown that gets lost in a migration.
   */
  lastSuggestedAt?: string;
  /** ISO 8601. Set by "not now" and by "stop suggesting this for a while". */
  dismissedUntil?: string;
  /** ISO 8601, stamped when marked done. */
  doneAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type LeisureDraft = Omit<
  LeisureItem,
  "id" | "createdAt" | "updatedAt" | "lastSuggestedAt" | "dismissedUntil" | "doneAt"
>;

/** What the user says about right now, before anything is suggested. */
export interface LeisureContext {
  /** Minutes available. Absent means "no constraint". */
  minutes?: number;
  energy?: LeisureEnergy;
  company?: LeisureCompany;
  place?: LeisurePlace;
  /** The most they want to spend. */
  cost?: LeisureCost;
  /** How busy life is right now — the one input that can silence the whole thing. */
  load?: "busy" | "normal" | "free";
}

/** How long a "not now" lasts, and whether suggestions are wanted at all. */
export interface SuggestionPreference {
  /** Off means the card never renders. Nothing pops up either way. */
  enabled: boolean;
  /** ISO 8601; the whole suggester stays quiet until this passes. */
  mutedUntil: string | null;
}
