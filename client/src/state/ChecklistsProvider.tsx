import { useCallback, useMemo, type ReactNode } from "react";
import { checklistsRepository, checklistTemplatesRepository } from "../repositories";
import { BUILT_IN_TEMPLATES } from "../mocks/checklistTemplates";
import { duplicate, emptyChecklist, fromTemplate, toTemplate } from "../lib/checklist";
import type { Checklist } from "../types";
import { ChecklistsContext, type ChecklistsContextValue } from "./checklistsContext";
import { usePersistentState } from "./usePersistentState";

/**
 * Every checklist in the app, in one place.
 *
 * Trips, projects and events share this: there is one model, one component and
 * one provider, rather than a `TripChecklist`, an `EventChecklist` and a
 * `ProjectChecklist` with three sets of bugs.
 */
export function ChecklistsProvider({ children }: { children: ReactNode }) {
  const [checklists, setChecklists] = usePersistentState(checklistsRepository);
  const [ownTemplates, setOwnTemplates] = usePersistentState(checklistTemplatesRepository);

  const templates = useMemo(
    () => [...BUILT_IN_TEMPLATES, ...ownTemplates],
    [ownTemplates]
  );

  const getChecklist = useCallback(
    (ownerId: string) => checklists[ownerId],
    [checklists]
  );

  const put = useCallback(
    (ownerId: string, checklist: Checklist) => {
      setChecklists((current) => ({ ...current, [ownerId]: checklist }));
    },
    [setChecklists]
  );

  const update = useCallback(
    (ownerId: string, change: (checklist: Checklist) => Checklist) => {
      setChecklists((current) => {
        const existing = current[ownerId] ?? emptyChecklist(ownerId);
        return { ...current, [ownerId]: change(existing) };
      });
    },
    [setChecklists]
  );

  const createEmpty = useCallback(
    (ownerId: string) => put(ownerId, emptyChecklist(ownerId)),
    [put]
  );

  const createFromTemplate = useCallback(
    (ownerId: string, templateId: string) => {
      const template = templates.find((entry) => entry.id === templateId);
      if (!template) return;
      put(ownerId, fromTemplate(ownerId, template));
    },
    [put, templates]
  );

  const duplicateInto = useCallback(
    (ownerId: string, sourceOwnerId: string) => {
      setChecklists((current) => {
        const source = current[sourceOwnerId];
        if (!source) return current;
        return { ...current, [ownerId]: duplicate(source, ownerId) };
      });
    },
    [setChecklists]
  );

  const saveAsTemplate = useCallback(
    (ownerId: string, name: string) => {
      const source = checklists[ownerId];
      if (!source || !name.trim()) return;
      setOwnTemplates((current) => [...current, toTemplate(source, name)]);
    },
    [checklists, setOwnTemplates]
  );

  const removeChecklist = useCallback(
    (ownerId: string) => {
      setChecklists((current) => {
        const next = { ...current };
        delete next[ownerId];
        return next;
      });
    },
    [setChecklists]
  );

  const value = useMemo<ChecklistsContextValue>(
    () => ({
      checklists,
      templates,
      getChecklist,
      update,
      createEmpty,
      createFromTemplate,
      duplicateInto,
      saveAsTemplate,
      removeChecklist,
    }),
    [
      checklists,
      templates,
      getChecklist,
      update,
      createEmpty,
      createFromTemplate,
      duplicateInto,
      saveAsTemplate,
      removeChecklist,
    ]
  );

  return <ChecklistsContext.Provider value={value}>{children}</ChecklistsContext.Provider>;
}
