import { createContext, useContext } from "react";
import type {
  Commitment,
  CommitmentDraft,
  Medication,
  MedicationDraft,
  Menu,
  MenuDraft,
  MoneyEntry,
  MoneyEntryDraft,
  ScheduledDraft,
  ScheduledItem,
} from "../types";

/**
 * Everything on the ongoing-management screen, in one slice.
 *
 * Five repositories, one provider. They are read together on every surface that
 * matters — the manage screen, the overview's relevance list, a family profile —
 * and splitting them into five contexts would mean five subscriptions and five
 * re-renders for what is conceptually one answer to "what do I owe anybody".
 */
export interface ManageContextValue {
  scheduled: ScheduledItem[];
  commitments: Commitment[];
  money: MoneyEntry[];
  medications: Medication[];
  menus: Menu[];

  /* ---------------------------------------------------------- scheduled -- */

  createScheduled: (draft: ScheduledDraft) => ScheduledItem;
  updateScheduled: (id: string, patch: Partial<ScheduledItem>) => void;
  deleteScheduled: (id: string) => void;
  /**
   * Marks an occurrence done. A recurring item advances to its next date and
   * stays active; a one-off is completed. See `lib/scheduled.ts`.
   */
  completeScheduled: (id: string) => void;
  /** Quiet for `hours`, still owed. */
  snoozeScheduled: (id: string, hours: number) => void;
  reopenScheduled: (id: string) => void;

  /* -------------------------------------------------------- commitments -- */

  createCommitment: (draft: CommitmentDraft) => Commitment;
  updateCommitment: (id: string, patch: Partial<Commitment>) => void;
  deleteCommitment: (id: string) => void;
  /** Records a charge and moves the date on by one cycle. */
  markCharged: (id: string) => void;

  /* -------------------------------------------------------------- money -- */

  createMoneyEntry: (draft: MoneyEntryDraft) => MoneyEntry;
  updateMoneyEntry: (id: string, patch: Partial<MoneyEntry>) => void;
  deleteMoneyEntry: (id: string) => void;
  setPaid: (id: string, paid: boolean) => void;

  /* -------------------------------------------------------- medications -- */

  createMedication: (draft: MedicationDraft) => Medication;
  updateMedication: (id: string, patch: Partial<Medication>) => void;
  deleteMedication: (id: string) => void;
  /** Ticks or un-ticks one `YYYY-MM-DD@HH:MM` dose. */
  toggleDoseTaken: (id: string, doseKey: string) => void;

  /* -------------------------------------------------------------- menus -- */

  createMenu: (draft: MenuDraft) => Menu;
  updateMenu: (id: string, patch: Partial<Menu>) => void;
  deleteMenu: (id: string) => void;
}

export const ManageContext = createContext<ManageContextValue | null>(null);

export function useManage(): ManageContextValue {
  const value = useContext(ManageContext);
  if (!value) {
    throw new Error("useManage must be used inside <ManageProvider>");
  }
  return value;
}
