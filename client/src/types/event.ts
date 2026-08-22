import type { SpaceId } from "./space";

/**
 * Event kinds. Each maps to a starting set of sections in
 * `lib/eventTemplates.ts` — a template is a starting point, never a cage: the
 * user can add, rename, reorder and remove any section afterwards.
 */
export type EventKind =
  | "birthday"
  | "holiday"
  | "wedding"
  | "barMitzvah"
  | "batMitzvah"
  | "anniversary"
  | "party"
  | "hosting"
  | "family"
  | "custom";

/**
 * What a section *is*, which decides how it renders. The title shown comes
 * from this kind's translation unless the user renamed it — that is why a
 * template can be seeded without writing Hebrew strings into stored data.
 */
export type EventSectionKind =
  | "tasks"
  | "gifts"
  | "budget"
  | "guests"
  | "food"
  | "greeting"
  | "links"
  | "vision"
  | "menu"
  | "shopping"
  | "decor"
  | "recipes"
  | "inspiration"
  | "notes";

/**
 * How much this event matters when it competes for attention.
 *
 * `low` is the one that earns its keep: a low-importance event stays quiet
 * until the week before, so "coffee with Dana in two months" never sits in the
 * preparation window taking up room next to a wedding.
 */
export type EventImportance = "low" | "normal" | "high";

/**
 * A reminder that fires **inside Focus**, and only inside Focus.
 *
 * There is no server and no push infrastructure, so a reminder is something the
 * app shows you the next time you open it — not a notification that arrives
 * while the tab is closed. The UI says so rather than implying otherwise; see
 * CLAUDE.md → "Local-only reminders".
 */
export interface EventReminder {
  id: string;
  /**
   * Hours before the event. The usual form, because "24 hours before" survives
   * the event being moved and an absolute date does not.
   */
  hoursBefore?: number;
  /** An absolute moment instead, for "the shop shuts at noon on the 3rd". */
  at?: string;
  /** What to do. User content. */
  label?: string;
  /** Ticked off. A handled reminder stops asking. */
  handled?: boolean;
  /** ISO 8601; the reminder stays quiet until this passes. */
  snoozedUntil?: string;
}

export interface EventTask {
  id: string;
  /** User content. */
  title: string;
  done: boolean;
}

export interface EventSection {
  id: string;
  kind: EventSectionKind;
  /**
   * Set only when the user renames the section. Absent means "use the
   * translated name for `kind`", so a template seeds no language into storage.
   */
  titleOverride?: string;
  order: number;
  /** Free text, for note-like sections. User content. */
  body?: string;
  /** Checkable entries, for tasks / shopping / guests / gifts. */
  items?: EventTask[];
  /** Budget sections only. */
  amount?: number;
  /** Saved items referenced by this section — never copies of them. */
  savedItemIds?: string[];
  /** Collection entries (recipes, places) referenced by this section. */
  collectionEntryIds?: string[];
  /** Vision sections point at a board rather than holding images. */
  visionBoardId?: string;
}

export interface FocusEvent {
  id: string;
  kind: EventKind;
  /** User content. */
  title: string;
  /** ISO 8601. */
  startsAt: string;
  spaceId: SpaceId;
  description?: string;
  nextAction?: string;
  sections: EventSection[];
  createdAt: string;

  /* ------------------------- when it starts asking for attention ---------- */

  /**
   * How many days before the event preparation starts mattering.
   *
   * Absent means "nothing to prepare", and that is the whole point of the
   * field: days-remaining alone cannot tell a flight in two months (nothing to
   * do yet) from a 60th birthday in two months (book the hall now). Urgency
   * follows what the user said they need, not the calendar on its own.
   */
  prepDaysBefore?: number;
  importance?: EventImportance;
  reminders?: EventReminder[];

  /**
   * True for an event computed at read time rather than stored — today, only a
   * birthday derived from a family profile's birth date.
   *
   * A flag rather than sniffing the id, because the id is *also* the slot a
   * real event can claim: a user who builds "Mum's 70th" with a venue and a
   * gift list stores it under `birthday:mom` so the computed row stands down.
   * That event is not derived — it has sections, a title of its own and a
   * screen — and telling the two apart by their shared id would strip it of
   * all three. Never persisted: nothing writes this to storage.
   */
  derived?: true;
}
