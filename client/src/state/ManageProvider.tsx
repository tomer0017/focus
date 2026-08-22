import { useCallback, useMemo, type ReactNode } from "react";
import {
  commitmentsRepository,
  medicationsRepository,
  menusRepository,
  moneyRepository,
  scheduledRepository,
} from "../repositories";
import { advanceCharge } from "../lib/money";
import { completeOccurrence, reopen, snoozeByHours } from "../lib/scheduled";
import { toggleDose } from "../lib/medications";
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
import { ManageContext, type ManageContextValue } from "./manageContext";
import { usePersistentState } from "./usePersistentState";

/** Ids only need to be unique in one browser; no id service exists yet. */
function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Ongoing management: dated obligations, commitments, money, medications and
 * menus.
 *
 * Every mutator is whole-record: the caller builds what it wants and this
 * writes it. The alternative — a narrow mutator per field — is what turned the
 * trip editor into four writes that could disagree with each other, and the
 * reasoning is recorded in CLAUDE.md.
 */
export function ManageProvider({ children }: { children: ReactNode }) {
  const [scheduled, setScheduled] = usePersistentState(scheduledRepository);
  const [commitments, setCommitments] = usePersistentState(commitmentsRepository);
  const [money, setMoney] = usePersistentState(moneyRepository);
  const [medications, setMedications] = usePersistentState(medicationsRepository);
  const [menus, setMenus] = usePersistentState(menusRepository);

  /* ---------------------------------------------------------- scheduled -- */

  const createScheduled = useCallback(
    (draft: ScheduledDraft): ScheduledItem => {
      const item: ScheduledItem = {
        ...draft,
        id: newId("sched"),
        completionCount: 0,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setScheduled((current) => [item, ...current]);
      return item;
    },
    [setScheduled]
  );

  const patchScheduled = useCallback(
    (id: string, updater: (item: ScheduledItem) => ScheduledItem) => {
      setScheduled((current) => current.map((item) => (item.id === id ? updater(item) : item)));
    },
    [setScheduled]
  );

  const updateScheduled = useCallback(
    (id: string, patch: Partial<ScheduledItem>) =>
      patchScheduled(id, (item) => ({ ...item, ...patch, updatedAt: nowIso() })),
    [patchScheduled]
  );

  const deleteScheduled = useCallback(
    (id: string) => setScheduled((current) => current.filter((item) => item.id !== id)),
    [setScheduled]
  );

  const completeScheduled = useCallback(
    (id: string) => patchScheduled(id, (item) => completeOccurrence(item)),
    [patchScheduled]
  );

  const snoozeScheduled = useCallback(
    (id: string, hours: number) => patchScheduled(id, (item) => snoozeByHours(item, hours)),
    [patchScheduled]
  );

  const reopenScheduled = useCallback(
    (id: string) => patchScheduled(id, (item) => reopen(item)),
    [patchScheduled]
  );

  /* -------------------------------------------------------- commitments -- */

  const createCommitment = useCallback(
    (draft: CommitmentDraft): Commitment => {
      const commitment: Commitment = {
        ...draft,
        id: newId("com"),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setCommitments((current) => [commitment, ...current]);
      return commitment;
    },
    [setCommitments]
  );

  const updateCommitment = useCallback(
    (id: string, patch: Partial<Commitment>) =>
      setCommitments((current) =>
        current.map((entry) =>
          entry.id === id ? { ...entry, ...patch, updatedAt: nowIso() } : entry
        )
      ),
    [setCommitments]
  );

  const deleteCommitment = useCallback(
    (id: string) => setCommitments((current) => current.filter((entry) => entry.id !== id)),
    [setCommitments]
  );

  const markCharged = useCallback(
    (id: string) =>
      setCommitments((current) =>
        current.map((entry) => {
          if (entry.id !== id || !entry.nextChargeAt) return entry;
          // Advanced from the stored date, not from today, so a charge on the
          // 4th stays on the 4th however late it is ticked off.
          const next = advanceCharge(entry.nextChargeAt, entry.cycle);
          return { ...entry, nextChargeAt: next, updatedAt: nowIso() };
        })
      ),
    [setCommitments]
  );

  /* -------------------------------------------------------------- money -- */

  const createMoneyEntry = useCallback(
    (draft: MoneyEntryDraft): MoneyEntry => {
      const entry: MoneyEntry = {
        ...draft,
        id: newId("money"),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setMoney((current) => [entry, ...current]);
      return entry;
    },
    [setMoney]
  );

  const updateMoneyEntry = useCallback(
    (id: string, patch: Partial<MoneyEntry>) =>
      setMoney((current) =>
        current.map((entry) =>
          entry.id === id ? { ...entry, ...patch, updatedAt: nowIso() } : entry
        )
      ),
    [setMoney]
  );

  const deleteMoneyEntry = useCallback(
    (id: string) => setMoney((current) => current.filter((entry) => entry.id !== id)),
    [setMoney]
  );

  const setPaid = useCallback(
    (id: string, paid: boolean) => updateMoneyEntry(id, { paid }),
    [updateMoneyEntry]
  );

  /* -------------------------------------------------------- medications -- */

  const createMedication = useCallback(
    (draft: MedicationDraft): Medication => {
      const medication: Medication = {
        ...draft,
        id: newId("med"),
        taken: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setMedications((current) => [medication, ...current]);
      return medication;
    },
    [setMedications]
  );

  const updateMedication = useCallback(
    (id: string, patch: Partial<Medication>) =>
      setMedications((current) =>
        current.map((entry) =>
          entry.id === id ? { ...entry, ...patch, updatedAt: nowIso() } : entry
        )
      ),
    [setMedications]
  );

  const deleteMedication = useCallback(
    (id: string) => setMedications((current) => current.filter((entry) => entry.id !== id)),
    [setMedications]
  );

  const toggleDoseTaken = useCallback(
    (id: string, key: string) =>
      setMedications((current) =>
        current.map((entry) => (entry.id === id ? toggleDose(entry, key) : entry))
      ),
    [setMedications]
  );

  /* -------------------------------------------------------------- menus -- */

  const createMenu = useCallback(
    (draft: MenuDraft): Menu => {
      const menu: Menu = {
        ...draft,
        id: newId("menu"),
        dishes: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setMenus((current) => [menu, ...current]);
      return menu;
    },
    [setMenus]
  );

  const updateMenu = useCallback(
    (id: string, patch: Partial<Menu>) =>
      setMenus((current) =>
        current.map((menu) => (menu.id === id ? { ...menu, ...patch, updatedAt: nowIso() } : menu))
      ),
    [setMenus]
  );

  const deleteMenu = useCallback(
    (id: string) => setMenus((current) => current.filter((menu) => menu.id !== id)),
    [setMenus]
  );

  const value = useMemo<ManageContextValue>(
    () => ({
      scheduled,
      commitments,
      money,
      medications,
      menus,
      createScheduled,
      updateScheduled,
      deleteScheduled,
      completeScheduled,
      snoozeScheduled,
      reopenScheduled,
      createCommitment,
      updateCommitment,
      deleteCommitment,
      markCharged,
      createMoneyEntry,
      updateMoneyEntry,
      deleteMoneyEntry,
      setPaid,
      createMedication,
      updateMedication,
      deleteMedication,
      toggleDoseTaken,
      createMenu,
      updateMenu,
      deleteMenu,
    }),
    [
      scheduled,
      commitments,
      money,
      medications,
      menus,
      createScheduled,
      updateScheduled,
      deleteScheduled,
      completeScheduled,
      snoozeScheduled,
      reopenScheduled,
      createCommitment,
      updateCommitment,
      deleteCommitment,
      markCharged,
      createMoneyEntry,
      updateMoneyEntry,
      deleteMoneyEntry,
      setPaid,
      createMedication,
      updateMedication,
      deleteMedication,
      toggleDoseTaken,
      createMenu,
      updateMenu,
      deleteMenu,
    ]
  );

  return <ManageContext.Provider value={value}>{children}</ManageContext.Provider>;
}
