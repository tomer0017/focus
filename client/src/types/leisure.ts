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
  | "movie"
  | "series"
  | "book"
  | "place"
  | "activity"
  | "evening"
  | "wishlist";

export const LEISURE_KINDS: LeisureKind[] = [
  "movie",
  "series",
  "book",
  "place",
  "activity",
  "evening",
  "wishlist",
];

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
