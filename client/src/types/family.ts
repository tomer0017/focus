import type { EventImportance } from "./event";
import type { ProjectNote } from "./page";

/**
 * A person or an animal the user wants to keep track of.
 *
 * Four types and one model. A dog needs vaccinations, a repeat treatment, a
 * vet, some documents and a photograph; a grandmother needs appointments,
 * medications, a shopping list and a reminder to visit. Those are the same
 * *shape* with different sections switched on, which is why there is no
 * `Pet` model and no baby tracker hiding in here.
 *
 * This is emphatically **not** a family tree. There are no relationships
 * between profiles, no generations and no genealogy: `relationship` is a word
 * the user typed, because "Mum" is all anybody actually needs stored.
 */
export type FamilyProfileType = "adult" | "child" | "baby" | "pet";

/**
 * A section is shown only when the user switches it on.
 *
 * The default set is deliberately tiny. Ten empty headings on a new profile is
 * the exact noise this app exists to avoid, and a profile that has nothing to
 * say should render almost nothing.
 */
export type FamilySectionKind =
  | "dates"
  | "reminders"
  | "health"
  | "checkups"
  | "medications"
  | "vaccinations"
  | "feeding"
  | "tasting"
  | "shopping"
  | "checklists"
  | "documents"
  | "media"
  | "notes"
  | "history";

export interface FamilySection {
  id: string;
  kind: FamilySectionKind;
  /**
   * Set only when the user renames the section. Absent means "use the
   * translated name for `kind`" — the same rule as event sections, so a default
   * set writes no language into stored data.
   */
  titleOverride?: string;
  order: number;
}

/** How a profile's birthday should behave once it reaches the calendar. */
export interface BirthdayPreference {
  /** Whether a birthday event is derived at all. */
  enabled: boolean;
  /**
   * How long before the day preparation starts mattering. Absent means the
   * birthday stays quiet until the week before — the same rule every other
   * event follows, and the reason a distant birthday does not shout.
   */
  prepDaysBefore?: number;
  importance?: EventImportance;
}

export interface FamilyProfile {
  id: string;
  /** User content. */
  name: string;
  type: FamilyProfileType;
  /** "Mum", "my brother", "the dog". User content, never a taxonomy. */
  relationship?: string;
  /** Local calendar date, `YYYY-MM-DD`. Drives the derived birthday. */
  birthDate?: string;
  /** An address only, never bytes. Absent renders initials, not a grey box. */
  photoUrl?: string;
  /** For pets: breed or species, in the user's words. */
  species?: string;
  activeSections: FamilySection[];
  /** The same free-form blocks a project page uses. One notes mechanism. */
  notes: ProjectNote[];
  birthday: BirthdayPreference;
  /** Documents, links, pictures and videos. References, never copies. */
  savedItemIds: string[];
  createdAt: string;
  updatedAt: string;
}

/** What the create/edit form writes. */
export type FamilyProfileDraft = Pick<
  FamilyProfile,
  "name" | "type" | "relationship" | "birthDate" | "photoUrl" | "species"
>;

/**
 * The sections a new profile starts with, by type.
 *
 * Short lists on purpose: a new profile should look like a name and a photo,
 * not like a form. Everything else is one tap away in edit mode.
 */
export const DEFAULT_SECTIONS: Record<FamilyProfileType, FamilySectionKind[]> = {
  adult: ["dates", "reminders", "notes"],
  child: ["dates", "reminders", "notes"],
  baby: ["feeding", "tasting", "vaccinations", "notes"],
  pet: ["vaccinations", "reminders", "notes"],
};

/** Every section a user may switch on, in the order the picker offers them. */
export const ALL_SECTIONS: FamilySectionKind[] = [
  "dates",
  "reminders",
  "health",
  "checkups",
  "medications",
  "vaccinations",
  "feeding",
  "tasting",
  "shopping",
  "checklists",
  "documents",
  "media",
  "notes",
  "history",
];
