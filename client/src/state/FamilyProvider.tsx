import { useCallback, useMemo, type ReactNode } from "react";
import { familyRepository, quickLogRepository } from "../repositories";
import { useManage } from "./manageContext";
import { normaliseUrl } from "../lib/links";
import { referenceKey, type EntityReference } from "../types/reference";
import { DEFAULT_SECTIONS } from "../types/family";
import type {
  FamilyProfile,
  FamilyProfileDraft,
  FamilySection,
  FamilySectionKind,
  ProjectNote,
  QuickLogEntry,
} from "../types";
import {
  FamilyContext,
  type DeleteProfileOptions,
  type FamilyContextValue,
} from "./familyContext";
import { usePersistentState } from "./usePersistentState";

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function renumber(sections: FamilySection[]): FamilySection[] {
  return [...sections]
    .sort((a, b) => a.order - b.order)
    .map((section, order) => ({ ...section, order }));
}

/**
 * Family profiles and the quick log.
 *
 * The two live together because a log entry only ever means something in the
 * context of whose it is, and every screen that renders one renders the other.
 *
 * Deleting a profile is the interesting operation. It **does not** cascade by
 * default: appointments, medications and log entries point at a profile by weak
 * reference, and removing "Luna" must not quietly delete next Tuesday's vet
 * appointment from the calendar. The caller opts in, and the dialog that asks
 * counts the records first.
 *
 * The cascade goes through `useManage` rather than through the scheduled and
 * medication repositories directly. Two providers holding their own state over
 * one repository would each be authoritative and neither would see the other's
 * writes until a reload — so this provider must sit **inside** `ManageProvider`,
 * and reaches its data the same way a screen does.
 */
export function FamilyProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = usePersistentState(familyRepository);
  const [logs, setLogs] = usePersistentState(quickLogRepository);
  const { scheduled, medications, deleteScheduled, deleteMedication } = useManage();

  const getProfile = useCallback(
    (id: string) => profiles.find((profile) => profile.id === id),
    [profiles]
  );

  const patch = useCallback(
    (id: string, updater: (profile: FamilyProfile) => FamilyProfile) => {
      setProfiles((current) =>
        current.map((profile) =>
          profile.id === id ? { ...updater(profile), updatedAt: nowIso() } : profile
        )
      );
    },
    [setProfiles]
  );

  const createProfile = useCallback(
    (draft: FamilyProfileDraft): FamilyProfile => {
      const id = newId("profile");
      const profile: FamilyProfile = {
        id,
        name: draft.name,
        type: draft.type,
        relationship: draft.relationship,
        birthDate: draft.birthDate,
        photoUrl: normaliseUrl(draft.photoUrl),
        species: draft.species,
        // A short default set, so a new profile reads as a name and a photo
        // rather than as a form with ten empty headings.
        activeSections: DEFAULT_SECTIONS[draft.type].map((kind, order) => ({
          id: `${id}-${kind}`,
          kind,
          order,
        })),
        notes: [],
        // Enabled only when there is a date to derive one from. Switching it on
        // for a profile with no birth date would promise a countdown to nothing.
        birthday: { enabled: Boolean(draft.birthDate) },
        savedItemIds: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setProfiles((current) => [...current, profile]);
      return profile;
    },
    [setProfiles]
  );

  const updateProfile = useCallback(
    (id: string, changes: Partial<FamilyProfile>) =>
      patch(id, (profile) => ({
        ...profile,
        ...changes,
        photoUrl:
          changes.photoUrl !== undefined ? normaliseUrl(changes.photoUrl) : profile.photoUrl,
      })),
    [patch]
  );

  const deleteProfile = useCallback(
    (id: string, options?: DeleteProfileOptions) => {
      setProfiles((current) => current.filter((profile) => profile.id !== id));

      if (!options?.cascade) return;

      const key = referenceKey({ kind: "family", id });
      const points = (entity: { relatedEntity?: EntityReference }): boolean =>
        Boolean(entity.relatedEntity && referenceKey(entity.relatedEntity) === key);

      scheduled.filter(points).forEach((item) => deleteScheduled(item.id));
      medications.filter(points).forEach((item) => deleteMedication(item.id));
      setLogs((current) => current.filter((entry) => !points(entry)));
    },
    [setProfiles, setLogs, scheduled, medications, deleteScheduled, deleteMedication]
  );

  const toggleSection = useCallback(
    (id: string, kind: FamilySectionKind) =>
      patch(id, (profile) => {
        const has = profile.activeSections.some((section) => section.kind === kind);
        const sections = has
          ? profile.activeSections.filter((section) => section.kind !== kind)
          : [
              ...profile.activeSections,
              { id: `${id}-${kind}-${Date.now().toString(36)}`, kind, order: profile.activeSections.length },
            ];
        return { ...profile, activeSections: renumber(sections) };
      }),
    [patch]
  );

  const moveSection = useCallback(
    (id: string, sectionId: string, direction: -1 | 1) =>
      patch(id, (profile) => {
        const sections = renumber(profile.activeSections);
        const index = sections.findIndex((section) => section.id === sectionId);
        const target = index + direction;
        if (index === -1 || target < 0 || target >= sections.length) return profile;
        [sections[index], sections[target]] = [sections[target], sections[index]];
        return { ...profile, activeSections: renumber(sections) };
      }),
    [patch]
  );

  const renameSection = useCallback(
    (id: string, sectionId: string, title: string) =>
      patch(id, (profile) => ({
        ...profile,
        activeSections: profile.activeSections.map((section) =>
          section.id === sectionId
            ? // An empty title means "go back to the translated default", so
              // clearing the box does not leave a section with no name.
              { ...section, titleOverride: title.trim() ? title.trim() : undefined }
            : section
        ),
      })),
    [patch]
  );

  const setProfileNotes = useCallback(
    (id: string, notes: ProjectNote[]) => patch(id, (profile) => ({ ...profile, notes })),
    [patch]
  );

  const setSavedItemIds = useCallback(
    (id: string, savedItemIds: string[]) => patch(id, (profile) => ({ ...profile, savedItemIds })),
    [patch]
  );

  const addLog = useCallback(
    (entry: Omit<QuickLogEntry, "id">): QuickLogEntry => {
      const created: QuickLogEntry = { ...entry, id: newId("log") };
      setLogs((current) => [created, ...current]);
      return created;
    },
    [setLogs]
  );

  const updateLog = useCallback(
    (id: string, changes: Partial<QuickLogEntry>) =>
      setLogs((current) => current.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry))),
    [setLogs]
  );

  const deleteLog = useCallback(
    (id: string) => setLogs((current) => current.filter((entry) => entry.id !== id)),
    [setLogs]
  );

  const value = useMemo<FamilyContextValue>(
    () => ({
      profiles,
      logs,
      getProfile,
      createProfile,
      updateProfile,
      deleteProfile,
      toggleSection,
      moveSection,
      renameSection,
      setProfileNotes,
      setSavedItemIds,
      addLog,
      updateLog,
      deleteLog,
    }),
    [
      profiles,
      logs,
      getProfile,
      createProfile,
      updateProfile,
      deleteProfile,
      toggleSection,
      moveSection,
      renameSection,
      setProfileNotes,
      setSavedItemIds,
      addLog,
      updateLog,
      deleteLog,
    ]
  );

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}
