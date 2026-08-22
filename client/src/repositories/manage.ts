import { createRepository, type Repository } from "./createRepository";
import { normaliseUrl } from "../lib/links";
import { STORAGE_KEYS } from "../lib/storage/keys";
import { DEFAULT_SECTIONS } from "../types/family";
import { MOCK_FAMILY_PROFILES } from "../mocks/family";
import { MOCK_LEISURE } from "../mocks/leisure";
import {
  MOCK_COMMITMENTS,
  MOCK_MEDICATIONS,
  MOCK_MENUS,
  MOCK_MONEY,
  MOCK_QUICK_LOG,
  MOCK_SCHEDULED,
} from "../mocks/manage";
import type {
  Commitment,
  FamilyProfile,
  LeisureItem,
  Medication,
  Menu,
  MoneyEntry,
  PageSummary,
  QuickLogEntry,
  ScheduledItem,
  SuggestionPreference,
} from "../types";

/**
 * The slices ongoing management, family and leisure persist through.
 *
 * Each one exists because it has independent identity — something references it
 * by id, or it survives the thing that created it. Templates, birthdays and
 * month summaries deliberately have no repository: they are derived on every
 * read, which is what makes them impossible to duplicate.
 *
 * Every migration below **fills in and never removes**. `undefined` is left
 * alone wherever absent means something different from empty: a scheduled item
 * with no `dueAt` is an undated reminder, not one due at the epoch, and a
 * profile with no `birthDate` must not acquire one.
 */

export const scheduledRepository: Repository<ScheduledItem[]> = createRepository<ScheduledItem[]>(
  STORAGE_KEYS.scheduled,
  () => MOCK_SCHEDULED,
  (items) =>
    items.map((item) => ({
      ...item,
      // Arrays every screen maps over. An item stored before these existed has
      // no such key, and `.map` on undefined is a blank screen.
      reminderOffsets: item.reminderOffsets ?? [],
      savedItemIds: item.savedItemIds ?? [],
      status: item.status ?? "active",
      completionCount: item.completionCount ?? 0,
      // `dueAt`, `recurrence` and `snoozedUntil` are deliberately untouched:
      // absent means undated, non-repeating and not snoozed, and each of those
      // is a real answer rather than a missing default.
    }))
);

export const commitmentsRepository: Repository<Commitment[]> = createRepository<Commitment[]>(
  STORAGE_KEYS.commitments,
  () => MOCK_COMMITMENTS,
  (items) =>
    items.map((item) => ({
      ...item,
      status: item.status ?? "active",
      savedItemIds: item.savedItemIds ?? [],
      manageUrl: normaliseUrl(item.manageUrl),
    }))
);

export const moneyRepository: Repository<MoneyEntry[]> = createRepository<MoneyEntry[]>(
  STORAGE_KEYS.money,
  () => MOCK_MONEY,
  (entries) =>
    entries.map((entry) => ({
      ...entry,
      recurring: entry.recurring ?? false,
      // Not defaulted to true: an entry whose paid flag was never written is
      // one nobody has confirmed, and guessing "paid" would hide a real bill.
      paid: entry.paid ?? false,
    }))
);

export const medicationsRepository: Repository<Medication[]> = createRepository<Medication[]>(
  STORAGE_KEYS.medications,
  () => MOCK_MEDICATIONS,
  (medications) =>
    medications.map((medication) => ({
      ...medication,
      times: medication.times ?? [],
      taken: medication.taken ?? [],
      status: medication.status ?? "active",
      // `weekdays` stays absent on purpose — absent means "every day", and an
      // empty array happens to mean the same thing, so neither is corrected
      // into the other.
    }))
);

export const familyRepository: Repository<FamilyProfile[]> = createRepository<FamilyProfile[]>(
  STORAGE_KEYS.family,
  () => MOCK_FAMILY_PROFILES,
  (profiles) =>
    profiles.map((profile) => ({
      ...profile,
      notes: profile.notes ?? [],
      savedItemIds: profile.savedItemIds ?? [],
      photoUrl: normaliseUrl(profile.photoUrl),
      // A profile with no sections at all would render as a bare name with no
      // way to add anything, so the type's default set stands in. An *empty*
      // array the user created is preserved — see the length check.
      activeSections:
        profile.activeSections && profile.activeSections.length > 0
          ? profile.activeSections.map((section, index) => ({
              ...section,
              order: section.order ?? index,
            }))
          : DEFAULT_SECTIONS[profile.type].map((kind, order) => ({
              id: `${profile.id}-${kind}`,
              kind,
              order,
            })),
      birthday: profile.birthday ?? { enabled: Boolean(profile.birthDate) },
    }))
);

export const quickLogRepository: Repository<QuickLogEntry[]> = createRepository<QuickLogEntry[]>(
  STORAGE_KEYS.quickLog,
  () => MOCK_QUICK_LOG
);

export const menusRepository: Repository<Menu[]> = createRepository<Menu[]>(
  STORAGE_KEYS.menus,
  () => MOCK_MENUS,
  (menus) =>
    menus.map((menu) => ({
      ...menu,
      dishes: (menu.dishes ?? []).map((dish, index) => ({
        ...dish,
        order: dish.order ?? index,
        shoppingItems: dish.shoppingItems ?? [],
      })),
    }))
);

export const leisureRepository: Repository<LeisureItem[]> = createRepository<LeisureItem[]>(
  STORAGE_KEYS.leisure,
  () => MOCK_LEISURE,
  (items) =>
    items.map((item) => ({
      ...item,
      tags: item.tags ?? [],
      status: item.status ?? "idea",
      url: normaliseUrl(item.url),
      imageUrl: normaliseUrl(item.imageUrl),
    }))
);

const SUGGESTION_DEFAULT: SuggestionPreference = {
  // On, because the card is quiet and only renders when something fits. It
  // never pops up: there is no modal anywhere in this feature.
  enabled: true,
  mutedUntil: null,
};

export const suggestionPreferenceRepository: Repository<SuggestionPreference> = createRepository(
  STORAGE_KEYS.suggestionPreference,
  () => SUGGESTION_DEFAULT
);

/** Template ids the user reached for most recently, newest first. */
export const recentTemplatesRepository: Repository<string[]> = createRepository<string[]>(
  STORAGE_KEYS.recentTemplates,
  () => []
);

/**
 * Pages the user created themselves.
 *
 * Kept apart from `MOCK_PAGES` for the same reason saved items are: the seed
 * may change between versions, and merging a user's page into a copy of the
 * demo set would freeze the demo at whatever it looked like on their first
 * visit. Overrides apply to both.
 */
export const ownPagesRepository: Repository<PageSummary[]> = createRepository<PageSummary[]>(
  STORAGE_KEYS.ownPages,
  () => [],
  (pages) =>
    pages.map((page) => ({
      ...page,
      favorite: page.favorite ?? false,
      visibility: page.visibility ?? "private",
      visionImageUrl: normaliseUrl(page.visionImageUrl),
      visionLinkUrl: normaliseUrl(page.visionLinkUrl),
    }))
);
