/**
 * One checklist mechanism for the whole app.
 *
 * Trips, projects and events all need "a list of things, in groups, that get
 * ticked off". Building three of those would be three sets of bugs, so there is
 * exactly one model and one component. See CLAUDE.md → 80/20.
 */

/**
 * What a list is *for*.
 *
 * A checklist has always recorded what it belongs to; it never recorded what it
 * was for, and that is the whole reason a camping packing list turned up on the
 * household shopping screen next to the weekly supermarket run. Nothing was
 * broken in the rendering — the screen asked for "every list", and a packing
 * list is one.
 */
export type ChecklistPurpose =
  | "tasks"
  | "shopping"
  | "packing"
  | "event"
  | "training"
  | "general";

/**
 * Whose life the list belongs to.
 *
 * A second axis rather than more values on `purpose`, because the two vary
 * independently: a trip has a packing list *and* can have a shopping list, and
 * the household shopping screen wants exactly one of those.
 */
export type ChecklistScope =
  | "household"
  | "trip"
  | "project"
  | "event"
  | "person"
  | "page";

/**
 * The pair, together — what a screen has to match before it may show a list.
 *
 * Stored on the *page* for page-owned lists (`PageSummary.checklist`), because
 * the page is the thing a user names, dates and opens, and it exists before its
 * checklist record does. For a list owned by an entity — `trip:japan-2027`,
 * `event:wedding` — nothing is stored: the owner key is already an explicit
 * `EntityReference`, so `checklistContextOf` reads the parent the writer wrote
 * rather than guessing from a route or a title.
 */
export interface ChecklistContext {
  purpose: ChecklistPurpose;
  scope: ChecklistScope;
}

export interface ChecklistItem {
  id: string;
  /** Set once the user writes or edits the item. User content, never translated. */
  text?: string;
  /**
   * Translation key in the `checklist` namespace, for an item seeded from a
   * built-in template. Cleared the moment the user edits the item — the same
   * rule as group titles and event sections, so a template ships in both
   * languages without writing either one into stored data.
   */
  textKey?: string;
  done: boolean;
  /** One line of detail, when the item needs it. User content. */
  note?: string;
}

export interface ChecklistGroup {
  id: string;
  /**
   * Translation key for a group seeded from a template, in the `checklist`
   * namespace. Absent for groups the user made, which store `title` instead —
   * the same rule as event sections: a template writes no language into data.
   */
  titleKey?: string;
  /** Set when the user names or renames the group. User content. */
  title?: string;
  collapsed?: boolean;
  items: ChecklistItem[];
}

export interface Checklist {
  /**
   * What this checklist belongs to, e.g. `project:sorcol` or `trip:japan-2027`.
   * Using the owner as the key means nothing has to carry a checklist id.
   */
  ownerId: string;
  /** Set when the user names the list. User content. */
  title?: string;
  /** The template it was created from, when it came from one. */
  templateId?: string;
  groups: ChecklistGroup[];
  updatedAt: string;
}

/**
 * What a template is for.
 *
 * The picker filters on this so a packing list never appears among the shopping
 * templates. `general` is the honest answer for a list the user saved
 * themselves, and it appears everywhere rather than nowhere.
 */
export type ChecklistTemplateCategory = "trip" | "shopping" | "event" | "general";

/** A named starting point for a checklist. */
export interface ChecklistTemplate {
  id: string;
  /** Translation key in the `checklist` namespace, for built-in templates. */
  nameKey?: string;
  /** Set for a template the user saved. User content. */
  name?: string;
  /** Absent means `general`, which is what a user-saved template is. */
  category?: ChecklistTemplateCategory;
  /** Offered before "all templates" is expanded. */
  recommended?: boolean;
  groups: ChecklistGroup[];
}
