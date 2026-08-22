import { createContext, useContext } from "react";
import type { LeisureContext as Context, LeisureDraft, LeisureItem, SuggestionPreference } from "../types";
import type { Suggestion } from "../lib/leisureRules";

export interface LeisureContextValue {
  items: LeisureItem[];
  preference: SuggestionPreference;
  /** Ids of the templates the user reached for most recently, newest first. */
  recentTemplates: string[];

  createItem: (draft: LeisureDraft) => LeisureItem;
  updateItem: (id: string, patch: Partial<LeisureItem>) => void;
  deleteItem: (id: string) => void;

  /**
   * The one suggestion that fits, or nothing.
   *
   * Calling this **stamps the cooldown** on whatever it returns, which is why
   * it lives on the provider rather than being a pure call from a component:
   * "was this offered recently" is persisted state, and a suggester that
   * forgets it offers the same film every evening for a week.
   */
  suggest: (context: Context) => Suggestion | undefined;
  /** Accepted — it becomes a plan and stops being offered. */
  acceptItem: (id: string) => void;
  /** "Not now": quiet for a few days, still on the list. */
  dismissItem: (id: string, hours?: number) => void;
  markItemDone: (id: string) => void;
  /** Silences the whole suggester for a while, or turns it off entirely. */
  setPreference: (preference: Partial<SuggestionPreference>) => void;

  rememberTemplateUse: (templateId: string) => void;
}

export const LeisureStateContext = createContext<LeisureContextValue | null>(null);

export function useLeisure(): LeisureContextValue {
  const value = useContext(LeisureStateContext);
  if (!value) {
    throw new Error("useLeisure must be used inside <LeisureProvider>");
  }
  return value;
}
