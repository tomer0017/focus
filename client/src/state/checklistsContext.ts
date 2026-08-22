import { createContext, useContext } from "react";
import type { Checklist, ChecklistTemplate } from "../types";

export interface ChecklistsContextValue {
  /** Every checklist, keyed by owner id. */
  checklists: Record<string, Checklist>;
  /** Built-in templates plus any the user saved. */
  templates: ChecklistTemplate[];
  getChecklist: (ownerId: string) => Checklist | undefined;
  /**
   * Applies a pure operation from `lib/checklist.ts`. One entry point keeps the
   * context small: the rules live in `lib/`, not in the provider.
   */
  update: (ownerId: string, change: (checklist: Checklist) => Checklist) => void;
  createEmpty: (ownerId: string) => void;
  createFromTemplate: (ownerId: string, templateId: string) => void;
  /** Copies another owner's list, unticked. */
  duplicateInto: (ownerId: string, sourceOwnerId: string) => void;
  /** Saves the owner's list as a reusable personal template. */
  saveAsTemplate: (ownerId: string, name: string) => void;
  removeChecklist: (ownerId: string) => void;
}

export const ChecklistsContext = createContext<ChecklistsContextValue | null>(null);

export function useChecklists(): ChecklistsContextValue {
  const value = useContext(ChecklistsContext);
  if (!value) {
    throw new Error("useChecklists must be used inside <ChecklistsProvider>");
  }
  return value;
}
