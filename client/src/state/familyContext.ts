import { createContext, useContext } from "react";
import type {
  FamilyProfile,
  FamilyProfileDraft,
  FamilySectionKind,
  ProjectNote,
  QuickLogEntry,
} from "../types";

/** What deleting a profile is allowed to take with it. */
export interface DeleteProfileOptions {
  /**
   * Also delete the scheduled items, log entries and medications pointing at
   * it. Default **false**: a vet appointment is a thing in your calendar, and
   * removing a profile must not silently empty next week. The confirmation
   * dialog says exactly how many records each choice affects.
   */
  cascade?: boolean;
}

export interface FamilyContextValue {
  profiles: FamilyProfile[];
  logs: QuickLogEntry[];
  getProfile: (id: string) => FamilyProfile | undefined;

  createProfile: (draft: FamilyProfileDraft) => FamilyProfile;
  updateProfile: (id: string, patch: Partial<FamilyProfile>) => void;
  deleteProfile: (id: string, options?: DeleteProfileOptions) => void;

  /** Switches a section on or off. Order is preserved for the ones that stay. */
  toggleSection: (id: string, kind: FamilySectionKind) => void;
  /** -1 moves a section earlier, 1 later. */
  moveSection: (id: string, sectionId: string, direction: -1 | 1) => void;
  renameSection: (id: string, sectionId: string, title: string) => void;
  /** Replaces a profile's notes wholesale — the same contract as `setNotes`. */
  setProfileNotes: (id: string, notes: ProjectNote[]) => void;
  /** Attaches or detaches a saved item (a document, picture or video link). */
  setSavedItemIds: (id: string, savedItemIds: string[]) => void;

  addLog: (entry: Omit<QuickLogEntry, "id">) => QuickLogEntry;
  updateLog: (id: string, patch: Partial<QuickLogEntry>) => void;
  deleteLog: (id: string) => void;
}

export const FamilyContext = createContext<FamilyContextValue | null>(null);

export function useFamily(): FamilyContextValue {
  const value = useContext(FamilyContext);
  if (!value) {
    throw new Error("useFamily must be used inside <FamilyProvider>");
  }
  return value;
}
