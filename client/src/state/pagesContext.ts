import { createContext, useContext } from "react";
import type { RecipeGroup } from "../lib/recipes";
import type {
  ChecklistContext,
  CollectionEntry,
  LearningResource,
  EditablePageFields,
  LearningFacts,
  PageStatus,
  ProjectCategory,
  PageSummary,
  ProjectNote,
  ProjectProgressImage,
  SavedItem,
} from "../types";

/** The picture fields a project's vision image is written through, together. */
export interface VisionImagePatch {
  visionImageUrl?: string;
  visionSavedItemId?: string;
  visionLinkUrl?: string;
}

/** The minimum a new page needs. Everything else is filled in or edited later. */
export interface CreatePageDraft {
  type: PageSummary["type"];
  spaceId: PageSummary["spaceId"];
  title: string;
  description?: string;
  dueAt?: string;
  /** The subject a learning page is filed under. Optional; nothing is derived. */
  categoryId?: string;
  /** A representative picture. An address only — never bytes, never a data URI. */
  visionImageUrl?: string;
  learning?: LearningFacts;
  /**
   * What a checklist page is for, and whose it is. Required in practice for a
   * page of type `checklist`: a list that does not say what it is appears on no
   * screen that filters, which is the safe failure rather than the loud one.
   */
  checklist?: ChecklistContext;
}

export interface PagesContextValue {
  pages: PageSummary[];
  savedItems: SavedItem[];
  collectionEntries: CollectionEntry[];
  getPage: (id: string) => PageSummary | undefined;
  /** Applies an edit and persists it locally. */
  updatePage: (id: string, changes: Partial<EditablePageFields>) => void;
  /** Creates a page the user owns — a learning project, a checklist, a project. */
  createPage: (draft: CreatePageDraft) => PageSummary;
  /**
   * Deletes a page the user created. Seeded demo pages are not deletable:
   * removing one would need a tombstone list that grows for ever.
   */
  deletePage: (id: string) => void;
  /** Sets the level, goal, method or last-studied stamp on a learning page. */
  setLearning: (id: string, facts: Partial<LearningFacts>) => void;
  /** "I studied today" — distinct from an edit, which is not studying. */
  markStudied: (id: string) => void;
  toggleFavorite: (id: string) => void;
  /**
   * Moves a project to a column, optionally at a position within it.
   * `pausedReason` is written only when parking; `completedAt` is stamped when
   * a project is completed and cleared when it comes back.
   */
  moveProject: (
    id: string,
    status: PageStatus,
    targetIndex?: number,
    pausedReason?: string
  ) => void;
  /** Records (or clears) why a parked project is parked. */
  setPausedReason: (id: string, reason: string) => void;
  /**
   * Sets a page's lifecycle status without touching board order.
   *
   * `moveProject` is the board's operation: it renumbers two columns because a
   * card was dragged between them. A learning page is not on that board, and
   * "I have finished French" should not renumber anything.
   */
  setPageStatus: (id: string, status: PageStatus) => void;

  /* ------------------------------------------------------- categories -- */

  /**
   * The user's project categories, in their order.
   *
   * A label with an order and nothing else: no behaviour branches on which
   * category a project is in, which is what keeps "add your own" from meaning
   * "and now maintain a code path per category".
   */
  categories: ProjectCategory[];
  /** Files a project under a category, or clears it back to the derived one. */
  setProjectCategory: (id: string, categoryId: string | undefined) => void;
  addCategory: (name: string) => ProjectCategory;
  renameCategory: (id: string, name: string) => void;
  /** Refuses when anything is still filed under it — see `canRemove`. */
  removeCategory: (id: string) => void;
  moveCategory: (id: string, direction: -1 | 1) => void;

  /* -------------------------------------------------- learning subjects -- */

  /**
   * The user's learning subjects — languages, career, leisure, and whatever
   * they add.
   *
   * The same `ProjectCategory` model as `categories`, deliberately a separate
   * list: a subject is not a project column and a project column is not a
   * subject. Both are stored on `PageSummary.categoryId`, which is safe because
   * the projects board only ever looks at pages of type `project`.
   */
  learningTopics: ProjectCategory[];
  addLearningTopic: (name: string) => ProjectCategory;
  renameLearningTopic: (id: string, name: string) => void;
  /** Refuses while a learning page is still filed under it. */
  removeLearningTopic: (id: string) => void;
  moveLearningTopic: (id: string, direction: -1 | 1) => void;

  /* ------------------------------------------------- learning resources -- */

  /** Files an already-attached saved item under a level, or notes it. */
  setLearningResource: (
    pageId: string,
    savedItemId: string,
    patch: Omit<Partial<LearningResource>, "savedItemId">
  ) => void;
  /** Creates a saved item already attached to the page, and files it. */
  addLearningResource: (
    pageId: string,
    item: SavedItem,
    patch: Omit<Partial<LearningResource>, "savedItemId">
  ) => void;
  /**
   * Removes a resource from one learning page. Records a tombstone; never
   * deletes the saved item, which other pages may share.
   */
  removeLearningResource: (pageId: string, savedItemId: string) => void;
  /**
   * Replaces a page's notes wholesale.
   *
   * Whole-list rather than one mutator per operation: every edit (add, rename,
   * reorder, delete) is the same single write, and the caller has already built
   * the array it wants. The same reasoning as `updateTrip` — see CLAUDE.md.
   */
  setNotes: (id: string, notes: ProjectNote[]) => void;
  /** Sets or clears the picture a project is aiming at. */
  setVisionImage: (id: string, patch: VisionImagePatch) => void;
  /** Replaces a page's progress pictures wholesale, for the reason above. */
  setProgressImages: (id: string, images: ProjectProgressImage[]) => void;
  /** Adds a saved item from Quick save. */
  addSavedItem: (item: SavedItem) => void;
  /** Everything referencing this context id — a page, an event or a routine. */
  savedItemsFor: (contextId: string) => SavedItem[];
  /** Edits a collection entry (a recipe or a place). */
  updateEntry: (id: string, patch: Partial<CollectionEntry>) => void;
  /**
   * Moves an entry into one of the three cooking groups, optionally at a
   * position within it. Status and `recommended` follow from the group.
   */
  moveEntry: (id: string, group: RecipeGroup, targetIndex?: number) => void;
}

export const PagesContext = createContext<PagesContextValue | null>(null);

export function usePages(): PagesContextValue {
  const value = useContext(PagesContext);
  if (!value) {
    throw new Error("usePages must be used inside <PagesProvider>");
  }
  return value;
}
