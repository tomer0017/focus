import type { ChecklistContext } from "./checklist";
import type { SpaceId } from "./space";

/** The kinds of page Focus is designed around. */
export type PageType =
  | "project"
  | "collection"
  | "checklist"
  | "routine"
  | "event"
  | "showcase"
  /**
   * Something being learned.
   *
   * A seventh type rather than a flag on `project`, because the screen it opens
   * is genuinely different: a learning page leads with where you stopped and
   * what to do next, and carries a level, a goal and a way of learning that no
   * other project has. It is emphatically not a course platform — see
   * `LearningFacts`.
   */
  | "learning";

export type Visibility = "private" | "public";

/** How far along something is. Three words, no scores, no percentages. */
export type LearningLevel = "beginner" | "intermediate" | "advanced";

/**
 * The four extra facts a learning page carries.
 *
 * There is no lesson model, no quiz, no grade and no completion percentage:
 * this is a *project* that happens to be about learning something, and the
 * mechanisms it uses — notes, a checklist, saved resources, "where I stopped" —
 * already exist. `lastStudiedAt` earns its place by being the one thing a
 * page cannot derive: `lastUpdatedAt` moves when you tidy the notes, and "I
 * last actually sat down with this in March" is a different, more honest fact.
 */
export interface LearningFacts {
  level?: LearningLevel;
  /** What you are trying to be able to do. User content. */
  goal?: string;
  /** How you are learning it: a book, a course, a person. User content. */
  method?: string;
  /** ISO 8601 of the last real session, recorded by one tap. */
  lastStudiedAt?: string;
  /**
   * How the saved items attached to this page are filed *for this page*.
   *
   * The link between a saved item and a page is still `SavedItem.contextIds` —
   * this adds nothing to it and replaces none of it. What it holds is the part
   * that belongs to the pairing rather than to either side: which level the
   * user was at when the material was useful, a line about why it was kept, and
   * where it sits in the list. Putting the level on the `SavedItem` would be
   * wrong the moment the same video is attached to two learning pages.
   */
  resources?: LearningResource[];
  /**
   * Saved items that reach this page through `contextIds` and that the user has
   * removed *from this learning page*.
   *
   * A tombstone rather than a deletion, because the item may be attached to
   * three other things: "take this off my English page" and "delete this video"
   * are different requests, and only the user makes the second one.
   */
  detachedResourceIds?: string[];
}

/**
 * One saved item, as it is filed on one learning page.
 *
 * Deliberately *not* a new entity. It carries no title, no URL and no kind —
 * those live on the `SavedItem`, which is the thing that exists. This is the
 * edge, and it is stored on the learning page because that is the side that
 * cares: the same YouTube video can be beginner material on one page and the
 * only advanced thing on another.
 */
export interface LearningResource {
  savedItemId: string;
  /** Absent means "general" — material that is not tied to one level. */
  level?: LearningLevel;
  /** Why this was kept, in one line. User content. */
  note?: string;
  order?: number;
}

/**
 * Lifecycle state — three values, and only three.
 *
 * "Blocked" is deliberately NOT one of them. A project can be active *and*
 * blocked at the same time, so being stuck is a separate attribute (`blocker`)
 * rather than a fourth column. Mixing the two is what makes a board lie about
 * how much is actually in flight.
 */
export type PageStatus = "active" | "paused" | "completed";

/**
 * One free-form block on a project page.
 *
 * This replaces the six narrative rubrics the page used to force on every
 * project ("what does success look like", "what is already done", "and after
 * that"…). Those made sense for a long-running build and made no sense at all
 * for "replace the sofa", which needs a picture, some measurements and three
 * product links. A note is a title the user chooses and text they write, and a
 * project with nothing to say carries none.
 *
 * The three Pareto facts — current state, blocker and next action — are NOT
 * notes. They stay structured fields because the dashboard, the board and
 * `isBlocked()` read them; they are indexed data, not page prose. See
 * CLAUDE.md → "Flexible project notes".
 */
export interface ProjectNote {
  id: string;
  /**
   * Set when the user names or renames the note. User content, never
   * translated.
   */
  title?: string;
  /**
   * Translation key in the `pages` namespace, for a note seeded from a
   * template or derived from a legacy field. Dropped the moment the user
   * renames the note — the same rule as event sections and checklist groups,
   * so a template writes no language into stored data.
   */
  titleKey?: string;
  /** User content. */
  content: string;
  order: number;
  /**
   * The level this note belongs to, on a learning page.
   *
   * Optional and unused everywhere else — a project note has no level and never
   * gains one. Absent means "general", which is material that stays visible at
   * every level rather than material with no level yet; see `matchesLevel` in
   * `lib/learning.ts` for why that distinction is the one that makes the filter
   * useful rather than annoying.
   */
  level?: LearningLevel;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * A picture of where a project is meant to end up, or where it stands today.
 *
 * Only an address is ever stored — never bytes, never a data URI. A page link
 * with no picture behind it (a Pinterest board) is kept as `linkUrl` and shown
 * as a link, because inventing a thumbnail for it would be inventing content.
 */
export interface ProjectProgressImage {
  id: string;
  /** A direct address of a picture. */
  imageUrl?: string;
  /** A saved item that already holds the picture. */
  savedItemId?: string;
  /** A page that has no picture of its own, e.g. a Pinterest board. */
  linkUrl?: string;
  /** One line about what changed. User content. */
  note?: string;
  /** ISO date the picture was taken. */
  capturedAt?: string;
  order: number;
}

/**
 * The summary shape every page shares — the Pareto core. This is what the
 * dashboard renders and what a future `GET /api/pages` will return.
 *
 * Recurring activity and dated occasions are NOT page fields: they are their
 * own entities (`Routine`, `FocusEvent`), because each needs history and
 * structure a summary line cannot carry.
 */
export interface PageSummary {
  id: string;
  type: PageType;
  spaceId: SpaceId;
  status: PageStatus;
  title: string;
  /** Why this page exists at all. Written once, rarely changed. */
  description?: string;
  /** Where things stand right now, in one or two sentences. */
  currentState?: string;
  /**
   * The exact point work stopped. Distinct from `currentState`: state is the
   * summary, this is the breadcrumb you need to pick the thread back up.
   */
  stoppedAt?: string;
  /**
   * What is stopping progress, if anything. Independent of `status`: an active
   * project with a blocker is the normal case, not a contradiction.
   */
  blocker?: string;
  /** The single next concrete step. */
  nextAction?: string;
  /** The last decision worth not re-litigating months later. */
  lastDecision?: string;
  /** ISO 8601 timestamp. */
  lastUpdatedAt: string;
  /** ISO 8601, set when the status becomes `completed`. */
  completedAt?: string;
  /** Optional reason recorded when a project is parked. User content. */
  pausedReason?: string;
  /** Position within its board column; lower comes first. */
  boardOrder?: number;
  /**
   * Which project category this is filed under.
   *
   * Optional, and purely a classification — no behaviour anywhere branches on
   * its value. Absent means "never categorised", and `categoryOf` derives one
   * from the space instead; nothing writes that guess back, so moving the page
   * between spaces keeps correcting it until the user chooses for themselves.
   */
  categoryId?: string;
  /** ISO date this page is needed by, for checklists and dated work. */
  dueAt?: string;

  /* ---- The 80/20 block a returning reader needs before anything else ---- */

  /** What finishing this actually looks like. */
  outcome?: string;
  /** What is already done. Distinct from `currentState`, which is the summary. */
  doneSoFar?: string;
  /** The step after the next one — context, deliberately secondary. */
  afterThat?: string;
  /**
   * The page's free-form blocks.
   *
   * `undefined` means "never edited", and the legacy narrative fields are read
   * instead — see `notesForPage`. An empty array means the user deleted every
   * note and must stay empty, which is why the two are not collapsed.
   */
  notes?: ProjectNote[];
  /** Where this project is trying to get to. An address, never bytes. */
  visionImageUrl?: string;
  /** A saved item standing in for the vision picture. */
  visionSavedItemId?: string;
  /** A page with no picture behind it, kept and shown as a link. */
  visionLinkUrl?: string;
  /** Pictures of the work as it went. */
  progressImages?: ProjectProgressImage[];
  /** Set only on pages of type `learning`. */
  learning?: LearningFacts;
  /**
   * What a checklist page is for, and whose it is. Set only on pages of type
   * `checklist`.
   *
   * This is what stops a packing list appearing on the household shopping
   * screen. It is stored rather than derived because "Trip North" and "Weekly
   * shop" are the same *shape* and only the user knows which is which — and
   * because deriving it from the space would keep re-guessing every time the
   * page moved. See `checklistContextOf`, which is the single judge.
   */
  checklist?: ChecklistContext;
  /** Pinned to Quick Access. */
  favorite: boolean;
  visibility: Visibility;
}

/**
 * A user-managed grouping for projects.
 *
 * Deliberately three fields. It is a label with an order, not a container: it
 * owns no projects, carries no rules, and no code branches on which one a
 * project is in. That is what keeps "let the user add a category" from becoming
 * "let the user add a category and then maintain four behaviours per category".
 */
export interface ProjectCategory {
  id: string;
  /** Set when the user names or renames it. User content, never translated. */
  name?: string;
  /** Translation key in the `projects` namespace, for a seeded category. */
  nameKey?: string;
  order: number;
}

/** True when a page is stuck, whatever its lifecycle status says. */
export function isBlocked(page: PageSummary): boolean {
  return Boolean(page.blocker && page.blocker.trim());
}

/** The subset of a page the inline editor is allowed to change. */
export type EditablePageFields = Pick<
  PageSummary,
  | "title"
  | "description"
  | "outcome"
  | "currentState"
  | "doneSoFar"
  | "stoppedAt"
  | "blocker"
  | "nextAction"
  | "afterThat"
  | "lastDecision"
  | "dueAt"
>;

/**
 * Everything the local storage layer may overlay on top of a mock page:
 * the editable text plus the board facts a status change writes.
 */
export type PageOverride = Partial<
  EditablePageFields &
    Pick<
      PageSummary,
      | "status"
      | "completedAt"
      | "pausedReason"
      | "boardOrder"
      | "categoryId"
      | "lastUpdatedAt"
      | "notes"
      | "visionImageUrl"
      | "visionSavedItemId"
      | "visionLinkUrl"
      | "progressImages"
      | "learning"
      | "checklist"
      | "favorite"
    >
>;
