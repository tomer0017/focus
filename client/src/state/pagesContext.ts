import { createContext, useContext } from "react";
import type { RecipeGroup } from "../lib/recipes";
import type {
  CollectionEntry,
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
  learning?: LearningFacts;
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
