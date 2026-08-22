/**
 * Every storage key in the app, in one place, under one namespace.
 *
 * A key is never removed and never renamed once it has shipped: the value on
 * someone's machine is the only copy that exists, and there is no server to
 * recover it from.
 */
export const STORAGE_KEYS = {
  language: "focus.language",
  routines: "focus.routines",
  pageOverrides: "focus.pages.overrides",
  /** Pages the user created themselves, kept apart from the seeded set. */
  ownPages: "focus.pages.own",
  events: "focus.events",
  savedItems: "focus.savedItems",
  visionBoards: "focus.visionBoards",
  visionDaily: "focus.visionDaily",
  checklists: "focus.checklists",
  checklistTemplates: "focus.checklistTemplates",
  recipes: "focus.recipes",
  trips: "focus.trips",
  /** User-managed project categories. Seeded with three; renameable. */
  projectCategories: "focus.projectCategories",
  /**
   * User-managed learning subjects — languages, career, leisure.
   *
   * A separate list from `projectCategories` on purpose: the two are the same
   * *model* and emphatically not the same *list*. "Languages" is not a column
   * on the projects board and "physical" is not a subject.
   */
  learningTopics: "focus.learningTopics",

  /* ------------------------------------------- ongoing management + family -- */

  scheduled: "focus.scheduled",
  commitments: "focus.commitments",
  money: "focus.money",
  medications: "focus.medications",
  family: "focus.family",
  quickLog: "focus.quickLog",
  menus: "focus.menus",
  leisure: "focus.leisure",
  suggestionPreference: "focus.leisure.suggestion",
  /** Ids of the templates most recently used, so the picker can lead with them. */
  recentTemplates: "focus.templates.recent",
} as const;
