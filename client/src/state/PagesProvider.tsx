import { useCallback, useMemo, type ReactNode } from "react";
import { MOCK_PAGES } from "../mocks/pages";
import { MOCK_SAVED_ITEMS } from "../mocks/savedItems";
import {
  entriesRepository,
  ownPagesRepository,
  pageOverridesRepository,
  learningTopicsRepository,
  projectCategoriesRepository,
  savedItemsRepository,
} from "../repositories";
import { columnPages, insertAt } from "../lib/projectBoard";
import { normaliseUrl } from "../lib/links";
import { entriesInGroup, statusForGroup, type RecipeGroup } from "../lib/recipes";
import type {
  CollectionEntry,
  EditablePageFields,
  LearningFacts,
  PageOverride,
  PageStatus,
  PageSummary,
  ProjectNote,
  ProjectProgressImage,
  SavedItem,
} from "../types";
import {
  PagesContext,
  type CreatePageDraft,
  type PagesContextValue,
  type VisionImagePatch,
} from "./pagesContext";
import { usePersistentState } from "./usePersistentState";
import {
  addTo,
  canRemove,
  categoryId as newCategoryId,
  moveIn,
  renameIn,
  sortedCategories,
} from "../lib/projectCategories";
import { learningTopicId, withResource, withoutResource } from "../lib/learning";

/**
 * Pages, and the local changes made to them.
 *
 * Only the *diff* against the mock data is stored — see
 * `pageOverridesRepository`. When the API lands, this provider keeps its shape
 * and its overrides become mutations; nothing above or below it changes.
 */
export function PagesProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = usePersistentState(pageOverridesRepository);
  const [ownPages, setOwnPages] = usePersistentState(ownPagesRepository);
  const [ownSavedItems, setOwnSavedItems] = usePersistentState(savedItemsRepository);
  const [collectionEntries, setCollectionEntries] = usePersistentState(entriesRepository);
  const [storedCategories, setCategories] = usePersistentState(projectCategoriesRepository);
  const [storedTopics, setTopics] = usePersistentState(learningTopicsRepository);

  /*
   * Pages the user made, then the seeded set — newest first, and only the diff
   * against the seed is stored. Own pages are kept in their own slice for the
   * reason saved items are: storing a copy of the demo data would freeze it at
   * whatever it looked like on the day of the first visit.
   */
  const basePages = useMemo<PageSummary[]>(() => [...ownPages, ...MOCK_PAGES], [ownPages]);

  const pages = useMemo<PageSummary[]>(
    () =>
      basePages.map((page) => {
        const override = overrides[page.id];
        return override ? { ...page, ...override } : page;
      }),
    [basePages, overrides]
  );

  const savedItems = useMemo<SavedItem[]>(
    () => [...ownSavedItems, ...MOCK_SAVED_ITEMS],
    [ownSavedItems]
  );

  const getPage = useCallback((id: string) => pages.find((page) => page.id === id), [pages]);

  const savedItemsFor = useCallback(
    (contextId: string) => savedItems.filter((item) => item.contextIds.includes(contextId)),
    [savedItems]
  );

  const updatePage = useCallback(
    (id: string, changes: Partial<EditablePageFields>) => {
      setOverrides((current) => ({
        ...current,
        [id]: { ...current[id], ...changes, lastUpdatedAt: new Date().toISOString() },
      }));
    },
    [setOverrides]
  );

  const moveProject = useCallback(
    (id: string, status: PageStatus, targetIndex = -1, pausedReason?: string) => {
      setOverrides((current) => {
        const merged = basePages.map((page) =>
          current[page.id] ? { ...page, ...current[page.id] } : page
        );
        const moved = merged.find((page) => page.id === id);
        if (!moved) return current;

        const now = new Date().toISOString();
        const next: Record<string, PageOverride> = { ...current };

        const write = (pageId: string, patch: PageOverride): void => {
          next[pageId] = { ...next[pageId], ...patch };
        };

        // Re-number both affected columns so the stored order stays canonical.
        const sourceStatus = moved.status;
        const targetIds = insertAt(
          columnPages(merged, status)
            .filter((page) => page.id !== id)
            .map((page) => page.id),
          id,
          targetIndex
        );
        targetIds.forEach((pageId, index) => write(pageId, { boardOrder: index }));

        if (sourceStatus !== status) {
          columnPages(merged, sourceStatus)
            .filter((page) => page.id !== id)
            .forEach((page, index) => write(page.id, { boardOrder: index }));
        }

        write(id, {
          status,
          lastUpdatedAt: now,
          // Completion is a fact with a date; coming back off the board clears it.
          completedAt: status === "completed" ? (moved.completedAt ?? now) : undefined,
          // A reason belongs to being parked, and only to being parked.
          pausedReason:
            status === "paused" ? (pausedReason ?? moved.pausedReason) : undefined,
        });

        return next;
      });
    },
    [setOverrides, basePages]
  );

  /* ------------------------------------------------------- categories -- */

  const categories = useMemo(() => sortedCategories(storedCategories), [storedCategories]);

  const setProjectCategory = useCallback<PagesContextValue["setProjectCategory"]>(
    (id, categoryId) => {
      setOverrides((current) => ({ ...current, [id]: { ...current[id], categoryId } }));
    },
    [setOverrides]
  );

  const addCategory = useCallback<PagesContextValue["addCategory"]>(
    (name) => {
      const { category } = addTo(storedCategories, name, newCategoryId());
      setCategories((current) => addTo(current, name, category.id).list);
      return category;
    },
    [setCategories, storedCategories]
  );

  const renameCategory = useCallback<PagesContextValue["renameCategory"]>(
    (id, name) => setCategories((current) => renameIn(current, id, name)),
    [setCategories]
  );

  const removeCategory = useCallback<PagesContextValue["removeCategory"]>(
    (id) => {
      if (!canRemove(pages, id)) return;
      setCategories((current) => current.filter((entry) => entry.id !== id));
    },
    [setCategories, pages]
  );

  const moveCategory = useCallback<PagesContextValue["moveCategory"]>(
    (id, direction) => setCategories((current) => moveIn(current, id, direction)),
    [setCategories]
  );

  /* --------------------------------------------------- learning topics -- */

  /*
   * The same model and the same four operations, over a different list. What
   * differs is only which slice they touch, which is why the arithmetic lives
   * in `lib/projectCategories.ts` and is called twice rather than written twice.
   */
  const learningTopics = useMemo(() => sortedCategories(storedTopics), [storedTopics]);

  const addLearningTopic = useCallback<PagesContextValue["addLearningTopic"]>(
    (name) => {
      const { category } = addTo(storedTopics, name, learningTopicId());
      setTopics((current) => addTo(current, name, category.id).list);
      return category;
    },
    [setTopics, storedTopics]
  );

  const renameLearningTopic = useCallback<PagesContextValue["renameLearningTopic"]>(
    (id, name) => setTopics((current) => renameIn(current, id, name)),
    [setTopics]
  );

  const removeLearningTopic = useCallback<PagesContextValue["removeLearningTopic"]>(
    (id) => {
      // A subject can only go once nothing is filed under it — the same refusal
      // the projects board makes, and for the same reason: the alternative is
      // the app choosing where somebody else's pages end up.
      if (pages.some((page) => page.type === "learning" && page.categoryId === id)) return;
      setTopics((current) => current.filter((entry) => entry.id !== id));
    },
    [setTopics, pages]
  );

  const moveLearningTopic = useCallback<PagesContextValue["moveLearningTopic"]>(
    (id, direction) => setTopics((current) => moveIn(current, id, direction)),
    [setTopics]
  );

  const setPageStatus = useCallback<PagesContextValue["setPageStatus"]>(
    (id, status) => {
      const now = new Date().toISOString();
      setOverrides((current) => ({
        ...current,
        [id]: {
          ...current[id],
          status,
          lastUpdatedAt: now,
          // Completion is a fact with a date; reopening clears it.
          completedAt: status === "completed" ? (current[id]?.completedAt ?? now) : undefined,
        },
      }));
    },
    [setOverrides]
  );

  const setPausedReason = useCallback(
    (id: string, reason: string) => {
      setOverrides((current) => ({
        ...current,
        [id]: { ...current[id], pausedReason: reason.trim() ? reason.trim() : undefined },
      }));
    },
    [setOverrides]
  );

  const setNotes = useCallback(
    (id: string, notes: ProjectNote[]) => {
      setOverrides((current) => ({
        ...current,
        // Written even when empty: "the user deleted every note" is a real
        // answer, and storing `undefined` would hand the page straight back to
        // the legacy adapter and resurrect the notes on the next render.
        [id]: { ...current[id], notes, lastUpdatedAt: new Date().toISOString() },
      }));
    },
    [setOverrides]
  );

  const setVisionImage = useCallback(
    (id: string, patch: VisionImagePatch) => {
      setOverrides((current) => ({
        ...current,
        [id]: {
          ...current[id],
          // All three are written together so a new choice replaces the old one
          // rather than layering a URL on top of a stale saved-item reference.
          visionImageUrl: normaliseUrl(patch.visionImageUrl),
          visionSavedItemId: patch.visionSavedItemId,
          visionLinkUrl: normaliseUrl(patch.visionLinkUrl),
          lastUpdatedAt: new Date().toISOString(),
        },
      }));
    },
    [setOverrides]
  );

  const setProgressImages = useCallback(
    (id: string, images: ProjectProgressImage[]) => {
      setOverrides((current) => ({
        ...current,
        [id]: { ...current[id], progressImages: images, lastUpdatedAt: new Date().toISOString() },
      }));
    },
    [setOverrides]
  );

  /**
   * A page the user created.
   *
   * Written to the own-pages slice rather than to the override map: an override
   * describes a change to a page that exists, and a page that exists only as a
   * diff would vanish the moment the override map were cleared.
   */
  const createPage = useCallback(
    (draft: CreatePageDraft): PageSummary => {
      const now = new Date().toISOString();
      const page: PageSummary = {
        id: `page-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        type: draft.type,
        spaceId: draft.spaceId,
        status: "active",
        title: draft.title,
        description: draft.description,
        dueAt: draft.dueAt,
        categoryId: draft.categoryId,
        visionImageUrl: normaliseUrl(draft.visionImageUrl),
        learning: draft.learning,
        lastUpdatedAt: now,
        favorite: false,
        visibility: "private",
      };
      setOwnPages((current) => [page, ...current]);
      return page;
    },
    [setOwnPages]
  );

  /**
   * Removes a page the user created, and the override that described it.
   *
   * Seeded pages are deliberately not deletable: there is nowhere to record the
   * deletion except a tombstone list, and a demo page that stays put is a much
   * smaller problem than a storage key that quietly grows for ever.
   */
  const deletePage = useCallback(
    (id: string) => {
      setOwnPages((current) => current.filter((page) => page.id !== id));
      setOverrides((current) => {
        if (!(id in current)) return current;
        const next = { ...current };
        delete next[id];
        return next;
      });
    },
    [setOwnPages, setOverrides]
  );

  const setLearning = useCallback(
    (id: string, facts: Partial<LearningFacts>) => {
      setOverrides((current) => {
        const existing =
          current[id]?.learning ?? basePages.find((page) => page.id === id)?.learning ?? {};
        return {
          ...current,
          [id]: {
            ...current[id],
            learning: { ...existing, ...facts },
            lastUpdatedAt: new Date().toISOString(),
          },
        };
      });
    },
    [setOverrides, basePages]
  );

  /**
   * "I sat down with this today."
   *
   * A separate fact from `lastUpdatedAt`, which moves whenever the notes are
   * tidied. Learning pages surface on the overview when they have been left
   * alone for a month, and tidying is not studying.
   */
  const markStudied = useCallback(
    (id: string) => setLearning(id, { lastStudiedAt: new Date().toISOString() }),
    [setLearning]
  );

  /* ------------------------------------------------ learning resources -- */

  /*
   * The link between a saved item and a page stays where it has always been —
   * `SavedItem.contextIds`. These three write only the *decoration*: which
   * level the material belongs to on this page, the line about why it was kept,
   * and whether it is still shown here at all.
   */

  const factsFor = useCallback(
    (id: string): LearningFacts =>
      overrides[id]?.learning ?? basePages.find((page) => page.id === id)?.learning ?? {},
    [overrides, basePages]
  );

  const setLearningResource = useCallback<PagesContextValue["setLearningResource"]>(
    (pageId, savedItemId, patch) => {
      setLearning(pageId, withResource(factsFor(pageId), savedItemId, patch));
    },
    [setLearning, factsFor]
  );

  /**
   * Adds a saved item and files it on the page in one step.
   *
   * The item is created with the page already in its `contextIds`, so it is
   * attached the ordinary way; the level and note go into the page's own
   * `resources` list.
   */
  const addLearningResource = useCallback<PagesContextValue["addLearningResource"]>(
    (pageId, item, patch) => {
      // The page id goes into `contextIds` here, not in the form: attachment is
      // the saved item's own mechanism, and every caller getting it right is
      // one caller away from a resource that exists but belongs to nothing.
      const attached = {
        ...item,
        contextIds: item.contextIds.includes(pageId)
          ? item.contextIds
          : [...item.contextIds, pageId],
      };
      setOwnSavedItems((current) => [attached, ...current]);
      setLearning(pageId, withResource(factsFor(pageId), item.id, patch));
    },
    [setOwnSavedItems, setLearning, factsFor]
  );

  /**
   * Takes a resource off one learning page.
   *
   * A tombstone, never a delete: the same video may be attached to a trip and
   * two other pages, and nothing here decides that on the user's behalf.
   */
  const removeLearningResource = useCallback<PagesContextValue["removeLearningResource"]>(
    (pageId, savedItemId) => {
      setLearning(pageId, withoutResource(factsFor(pageId), savedItemId));
    },
    [setLearning, factsFor]
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      const current = pages.find((page) => page.id === id);
      if (!current) return;
      setOverrides((existing) => ({
        ...existing,
        [id]: { ...existing[id], favorite: !current.favorite },
      }));
    },
    [pages, setOverrides]
  );

  const updateEntry = useCallback(
    (id: string, patch: Partial<CollectionEntry>) => {
      setCollectionEntries((current) =>
        current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry))
      );
    },
    [setCollectionEntries]
  );

  const moveEntry = useCallback(
    (id: string, group: RecipeGroup, targetIndex = -1) => {
      setCollectionEntries((current) => {
        const moved = current.find((entry) => entry.id === id);
        if (!moved) return current;

        const { status, recommended } = statusForGroup(group);
        const updated = current.map((entry) =>
          entry.id === id ? { ...entry, status, recommended } : entry
        );

        // Re-number the destination group so the stored order stays canonical.
        const pageEntries = updated.filter((entry) => entry.pageId === moved.pageId);
        const ids = entriesInGroup(pageEntries, group)
          .filter((entry) => entry.id !== id)
          .map((entry) => entry.id);
        const index = targetIndex < 0 ? ids.length : Math.min(targetIndex, ids.length);
        const ordered = [...ids.slice(0, index), id, ...ids.slice(index)];

        return updated.map((entry) => {
          const position = ordered.indexOf(entry.id);
          return position === -1 ? entry : { ...entry, order: position };
        });
      });
    },
    [setCollectionEntries]
  );

  const addSavedItem = useCallback(
    (item: SavedItem) => {
      setOwnSavedItems((current) => [item, ...current]);
    },
    [setOwnSavedItems]
  );

  const value = useMemo<PagesContextValue>(
    () => ({
      pages,
      savedItems,
      collectionEntries,
      getPage,
      updatePage,
      createPage,
      deletePage,
      setLearning,
      markStudied,
      toggleFavorite,
      moveProject,
      setPausedReason,
      setPageStatus,
      categories,
      setProjectCategory,
      addCategory,
      renameCategory,
      removeCategory,
      moveCategory,
      learningTopics,
      addLearningTopic,
      renameLearningTopic,
      removeLearningTopic,
      moveLearningTopic,
      setLearningResource,
      addLearningResource,
      removeLearningResource,
      setNotes,
      setVisionImage,
      setProgressImages,
      addSavedItem,
      savedItemsFor,
      updateEntry,
      moveEntry,
    }),
    [
      pages,
      savedItems,
      collectionEntries,
      getPage,
      updatePage,
      createPage,
      deletePage,
      setLearning,
      markStudied,
      toggleFavorite,
      moveProject,
      setPausedReason,
      setPageStatus,
      categories,
      setProjectCategory,
      addCategory,
      renameCategory,
      removeCategory,
      moveCategory,
      learningTopics,
      addLearningTopic,
      renameLearningTopic,
      removeLearningTopic,
      moveLearningTopic,
      setLearningResource,
      addLearningResource,
      removeLearningResource,
      setNotes,
      setVisionImage,
      setProgressImages,
      addSavedItem,
      savedItemsFor,
      updateEntry,
      moveEntry,
    ]
  );

  return <PagesContext.Provider value={value}>{children}</PagesContext.Provider>;
}
