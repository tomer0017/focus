/**
 * A meal that comes round again.
 *
 * Friday dinner is the same six dishes most weeks, with two swapped when there
 * are guests. Writing that down once and turning it into a shopping list is
 * most of what a "meal planner" is ever asked to do, so that is all this is.
 *
 * A menu never touches the shopping list on its own. Generating a list is an
 * explicit action with a confirmation, because a feature that quietly adds
 * fourteen items to the list you are standing in the supermarket holding is
 * worse than no feature.
 */
export type MenuKind = "shabbat" | "shabbatGuests" | "holiday" | "free";

export type MenuCourse =
  | "starter"
  | "main"
  | "side"
  | "salad"
  | "dessert"
  | "drink"
  | "other";

export const MENU_COURSES: MenuCourse[] = [
  "starter",
  "main",
  "side",
  "salad",
  "dessert",
  "drink",
  "other",
];

export interface MenuDish {
  id: string;
  course: MenuCourse;
  /** Set when the user typed the dish. User content. */
  title?: string;
  /** Translation key, for a dish seeded from a template. Dropped on rename. */
  titleKey?: string;
  /** A recipe from the cooking collection, when there is one. A reference. */
  entryId?: string;
  /** What to buy for it, one per line. User content. */
  shoppingItems?: string[];
  note?: string;
  order: number;
}

export interface Menu {
  id: string;
  /** Set when the user names it. User content. */
  title?: string;
  /** Translation key for a seeded menu; dropped the moment it is renamed. */
  titleKey?: string;
  kind: MenuKind;
  /** How many people. Shown, never used to scale a recipe. */
  servings?: number;
  dishes: MenuDish[];
  note?: string;
  /** ISO date this menu is for, when it is for a particular day. */
  date?: string;
  /** ISO 8601 of the last time a shopping list was generated from this menu. */
  lastListCreatedAt?: string;
  /**
   * The `checklist` page this menu writes its shopping into.
   *
   * Stored rather than remembered in component state: without it, every visit
   * to the menu created a *new* list, so "regenerate" quietly produced a second
   * and a third copy instead of merging into the one you are shopping from.
   * The merge's no-duplicates guarantee is only worth anything if it is applied
   * to the same list each time.
   */
  listPageId?: string;
  createdAt: string;
  updatedAt: string;
}

export type MenuDraft = Pick<Menu, "title" | "kind" | "servings" | "note" | "date">;
