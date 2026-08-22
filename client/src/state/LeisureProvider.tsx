import { useCallback, useMemo, type ReactNode } from "react";
import {
  leisureRepository,
  recentTemplatesRepository,
  suggestionPreferenceRepository,
} from "../repositories";
import { normaliseUrl } from "../lib/links";
import {
  acceptSuggestion,
  dismissFor,
  markDone,
  markSuggested,
  suggestOne,
  type Suggestion,
} from "../lib/leisureRules";
import { rememberTemplate } from "../lib/templates";
import type { LeisureContext as Context, LeisureDraft, LeisureItem, SuggestionPreference } from "../types";
import { LeisureStateContext, type LeisureContextValue } from "./leisureContext";
import { usePersistentState } from "./usePersistentState";

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Leisure items, and the suggester's memory.
 *
 * The cooldown state lives on the items themselves rather than in a separate
 * log, so a suggestion history cannot be orphaned by a migration or drift out
 * of step with the list it describes.
 */
export function LeisureProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = usePersistentState(leisureRepository);
  const [preference, setPreferenceState] = usePersistentState(suggestionPreferenceRepository);
  const [recentTemplates, setRecentTemplates] = usePersistentState(recentTemplatesRepository);

  const createItem = useCallback(
    (draft: LeisureDraft): LeisureItem => {
      const now = new Date().toISOString();
      const item: LeisureItem = {
        ...draft,
        id: newId("leisure"),
        url: normaliseUrl(draft.url),
        imageUrl: normaliseUrl(draft.imageUrl),
        tags: draft.tags ?? [],
        createdAt: now,
        updatedAt: now,
      };
      setItems((current) => [item, ...current]);
      return item;
    },
    [setItems]
  );

  const patch = useCallback(
    (id: string, updater: (item: LeisureItem) => LeisureItem) =>
      setItems((current) => current.map((item) => (item.id === id ? updater(item) : item))),
    [setItems]
  );

  const updateItem = useCallback(
    (id: string, changes: Partial<LeisureItem>) =>
      patch(id, (item) => ({
        ...item,
        ...changes,
        url: changes.url !== undefined ? normaliseUrl(changes.url) : item.url,
        imageUrl: changes.imageUrl !== undefined ? normaliseUrl(changes.imageUrl) : item.imageUrl,
        updatedAt: new Date().toISOString(),
      })),
    [patch]
  );

  const deleteItem = useCallback(
    (id: string) => setItems((current) => current.filter((item) => item.id !== id)),
    [setItems]
  );

  /**
   * Ask for a suggestion.
   *
   * Deliberately **not** memoised by context. An earlier version cached the
   * last answer per set of inputs so a re-render could not re-roll it, and that
   * broke the one interaction the card is built around: pressing "suggest
   * something else" with the same inputs returned the identical idea, because
   * the inputs had not changed. The screen already holds its result in state
   * and only calls this from a click handler, so there is nothing to guard
   * against — and the cooldown stamp below is what stops repetition properly.
   */
  const suggest = useCallback(
    (context: Context): Suggestion | undefined => {
      if (!preference.enabled) return undefined;
      if (preference.mutedUntil && preference.mutedUntil > new Date().toISOString()) return undefined;

      const found = suggestOne(items, context);
      // Stamped now, so the same idea does not come back this evening or the
      // next. `items` is the current list, so the very next call already sees
      // the stamp through the state update.
      if (found) patch(found.item.id, (item) => markSuggested(item));
      return found;
    },
    [items, preference, patch]
  );

  const acceptItem = useCallback(
    (id: string) => patch(id, (item) => acceptSuggestion(item)),
    [patch]
  );

  const dismissItem = useCallback(
    (id: string, hours?: number) => patch(id, (item) => dismissFor(item, hours)),
    [patch]
  );

  const markItemDone = useCallback((id: string) => patch(id, (item) => markDone(item)), [patch]);

  const setPreference = useCallback(
    (next: Partial<SuggestionPreference>) =>
      setPreferenceState((current) => ({ ...current, ...next })),
    [setPreferenceState]
  );

  const rememberTemplateUse = useCallback(
    (templateId: string) => setRecentTemplates((current) => rememberTemplate(current, templateId)),
    [setRecentTemplates]
  );

  const value = useMemo<LeisureContextValue>(
    () => ({
      items,
      preference,
      recentTemplates,
      createItem,
      updateItem,
      deleteItem,
      suggest,
      acceptItem,
      dismissItem,
      markItemDone,
      setPreference,
      rememberTemplateUse,
    }),
    [
      items,
      preference,
      recentTemplates,
      createItem,
      updateItem,
      deleteItem,
      suggest,
      acceptItem,
      dismissItem,
      markItemDone,
      setPreference,
      rememberTemplateUse,
    ]
  );

  return <LeisureStateContext.Provider value={value}>{children}</LeisureStateContext.Provider>;
}
