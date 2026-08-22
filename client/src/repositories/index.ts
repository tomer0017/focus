import { createRepository, type Repository } from "./createRepository";
import { normaliseUrl } from "../lib/links";
import { STORAGE_KEYS } from "../lib/storage/keys";
import { MOCK_ROUTINES } from "../mocks/routines";
import { MOCK_EVENTS } from "../mocks/events";
import { MOCK_VISION_BOARDS } from "../mocks/visionBoards";
import { MOCK_CHECKLISTS } from "../mocks/checklists";
import { MOCK_COLLECTION_ENTRIES } from "../mocks/savedItems";
import { MOCK_TRIPS } from "../mocks/trips";
import { DEFAULT_CATEGORIES } from "../lib/projectCategories";
import { DEFAULT_LEARNING_TOPICS } from "../lib/learning";
import type {
  Checklist,
  CollectionEntry,
  ChecklistTemplate,
  FocusEvent,
  PageOverride,
  ProjectCategory,
  Routine,
  SavedItem,
  Trip,
  VisionBoard,
  VisionDailyPreference,
} from "../types";

/**
 * The app's persisted slices, all in one place.
 *
 * Each one is seeded from `mocks/` on a first visit. The screens never see
 * storage: they see a provider, which sees a repository. Replacing these five
 * with API calls is the swap this layer exists for.
 */

export const routinesRepository: Repository<Routine[]> = createRepository(
  STORAGE_KEYS.routines,
  () => MOCK_ROUTINES
);

/**
 * Events.
 *
 * The migration fills in the timing fields that arrived with preparation
 * windows and reminders. `reminders` in particular has to become an array:
 * every screen maps over it, and an event stored before this build has no such
 * key at all. Nothing is dropped and no id changes — `prepDaysBefore` stays
 * absent when it was absent, because absent is a real answer meaning "nothing
 * to prepare", and defaulting it to a number would put every old event into a
 * preparation window nobody asked for.
 */
export const eventsRepository: Repository<FocusEvent[]> = createRepository<FocusEvent[]>(
  STORAGE_KEYS.events,
  () => MOCK_EVENTS,
  (events) =>
    events.map((event) => ({
      ...event,
      sections: event.sections ?? [],
      reminders: event.reminders ?? [],
    }))
);

export const visionBoardsRepository: Repository<VisionBoard[]> = createRepository<VisionBoard[]>(
  STORAGE_KEYS.visionBoards,
  () => MOCK_VISION_BOARDS,
  // Tiles gained an optional `imageUrl`; older ones only had local artwork, and
  // a tile with neither would have nothing to draw.
  (boards) =>
    boards.map((board) => ({
      ...board,
      tiles: board.tiles.map((tile) => ({
        ...tile,
        thumb: tile.thumb ?? (tile.imageUrl ? undefined : "notebook"),
        imageUrl: normaliseUrl(tile.imageUrl),
      })),
    }))
);

/**
 * Only the *changes* to mock pages are stored, keyed by page id — not a copy
 * of the pages themselves. A stored copy would freeze the demo data at
 * whatever it looked like on the day the user first opened the app.
 */
export const pageOverridesRepository: Repository<Record<string, PageOverride>> = createRepository<
  Record<string, PageOverride>
>(
  STORAGE_KEYS.pageOverrides,
  () => ({}),
  /*
   * Notes and pictures are stored in the override, so the migration has to be
   * careful about one thing above all: `notes` must keep the difference between
   * absent and empty. Absent means "never edited", and the page reads its
   * legacy fields through `notesForPage`; an empty array means the user deleted
   * every note and must stay empty. Defaulting `notes` to `[]` here would
   * silently wipe the content of every project written before this build.
   */
  (overrides) =>
    Object.fromEntries(
      Object.entries(overrides).map(([id, override]) => [
        id,
        {
          ...override,
          notes: override.notes?.map((note, index) => ({
            ...note,
            order: note.order ?? index,
            content: note.content ?? "",
          })),
          progressImages: override.progressImages?.map((image, index) => ({
            ...image,
            order: image.order ?? index,
            imageUrl: normaliseUrl(image.imageUrl),
            linkUrl: normaliseUrl(image.linkUrl),
          })),
          visionImageUrl: normaliseUrl(override.visionImageUrl),
          visionLinkUrl: normaliseUrl(override.visionLinkUrl),
        },
      ])
    )
);

/** Items the user saved themselves, kept apart from the mock set for the same reason. */
export const savedItemsRepository: Repository<SavedItem[]> = createRepository<SavedItem[]>(
  STORAGE_KEYS.savedItems,
  () => [],
  // Older builds stored "#" and placeholder hosts as if they were destinations.
  (items) =>
    items.map((item) => {
      const url = normaliseUrl(item.url);
      return url ? { ...item, url } : { ...item, url: undefined };
    })
);

const DAILY_DEFAULT: VisionDailyPreference = {
  // Off by default: an app that opens with a modal on day one is a worse app.
  enabled: false,
  boardId: null,
  lastShownDate: null,
};

export const visionDailyRepository: Repository<VisionDailyPreference> = createRepository(
  STORAGE_KEYS.visionDaily,
  () => DAILY_DEFAULT
);

/**
 * Collection entries — recipes and places.
 *
 * The migration is the reason this repository has one: entries used to carry a
 * three-way `state` where "recommended" excluded "tried". Splitting it into a
 * status and a flag has to happen for data already in someone's browser, not
 * only for the seed.
 */
export const entriesRepository: Repository<CollectionEntry[]> = createRepository<CollectionEntry[]>(
  STORAGE_KEYS.recipes,
  () => MOCK_COLLECTION_ENTRIES,
  (entries) =>
    entries.map((entry) => {
      const legacy = entry.state;
      const status =
        entry.status ?? (legacy === "wantToTry" || legacy === undefined ? "want_to_try" : "tried");
      const recommended = entry.recommended ?? legacy === "recommended";

      return {
        ...entry,
        status,
        recommended,
        tags: entry.tags ?? [],
        imageUrl: normaliseUrl(entry.imageUrl),
        sourceUrl: normaliseUrl(entry.sourceUrl),
        // The legacy field is dropped once it has been read.
        state: undefined,
      };
    })
);

/**
 * Checklists, keyed by what they belong to (`project:sorcol`, `trip:japan-2027`).
 * Keying by owner means no entity has to carry a checklist id.
 */
export const checklistsRepository: Repository<Record<string, Checklist>> = createRepository<
  Record<string, Checklist>
>(STORAGE_KEYS.checklists, () => MOCK_CHECKLISTS);

/** Templates the user saved from a list they built. Built-ins are not stored. */
export const checklistTemplatesRepository: Repository<ChecklistTemplate[]> = createRepository<
  ChecklistTemplate[]
>(STORAGE_KEYS.checklistTemplates, () => []);

/** Trips, with their destinations, day plans and food. */
export const tripsRepository: Repository<Trip[]> = createRepository<Trip[]>(
  STORAGE_KEYS.trips,
  () => MOCK_TRIPS,
  (trips) =>
    trips.map((trip) => ({
      ...trip,
      coverImageUrl: normaliseUrl(trip.coverImageUrl),
      destinations: trip.destinations.map((destination) => ({
        ...destination,
        imageUrl: normaliseUrl(destination.imageUrl),
        goodToKnow: destination.goodToKnow ?? [],
        savedItemIds: destination.savedItemIds ?? [],
      })),
      flights: trip.flights.map((flight) => ({ ...flight, url: normaliseUrl(flight.url) })),
      stays: trip.stays.map((stay) => ({ ...stay, url: normaliseUrl(stay.url) })),
      food: trip.food.map((entry) => ({ ...entry, url: normaliseUrl(entry.url) })),
      // Outfits arrived after the first trips were stored.
      outfits: (trip.outfits ?? []).map((outfit) => ({
        ...outfit,
        dayIds: outfit.dayIds ?? [],
        clothingItems: outfit.clothingItems ?? [],
        imageUrl: normaliseUrl(outfit.imageUrl),
        pinterestUrl: normaliseUrl(outfit.pinterestUrl),
      })),
    }))
);

/**
 * Project categories.
 *
 * A tiny slice of its own rather than a field on something else: it is a list
 * the user reorders and renames, and there is nowhere else it could live
 * without one project's data owning a label every other project reads.
 *
 * The migration only fills in `order`, which arrived with drag-free reordering.
 * It never invents a category and never stamps one onto a page.
 */
export const projectCategoriesRepository: Repository<ProjectCategory[]> = createRepository<
  ProjectCategory[]
>(
  STORAGE_KEYS.projectCategories,
  () => DEFAULT_CATEGORIES,
  (categories) => categories.map((entry, index) => ({ ...entry, order: entry.order ?? index }))
);

/**
 * Learning subjects.
 *
 * The `ProjectCategory` model again — a label with an order — kept in its own
 * slice so the projects board and the learning screen never show each other's
 * tabs. The migration only fills in `order`; it never invents a subject and
 * never stamps one onto a page.
 */
export const learningTopicsRepository: Repository<ProjectCategory[]> = createRepository<
  ProjectCategory[]
>(
  STORAGE_KEYS.learningTopics,
  () => DEFAULT_LEARNING_TOPICS,
  (topics) => topics.map((entry, index) => ({ ...entry, order: entry.order ?? index }))
);

export type { Repository } from "./createRepository";

export {
  commitmentsRepository,
  familyRepository,
  leisureRepository,
  medicationsRepository,
  menusRepository,
  moneyRepository,
  ownPagesRepository,
  quickLogRepository,
  recentTemplatesRepository,
  scheduledRepository,
  suggestionPreferenceRepository,
} from "./manage";
