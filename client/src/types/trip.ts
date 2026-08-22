import type { ProjectNote } from "./page";
import type { SavedItemSource, ThumbKey } from "./savedItem";

/** How far along the planning is. Not a project status — a trip is not work. */
export type TripStatus = "dreaming" | "booking" | "planned" | "travelling" | "done";

/**
 * What shape of trip this is.
 *
 * Not a second data model — every kind is the same `Trip`. It decides which
 * parts of the screen are worth *leading with*: a camping weekend opens on
 * notes, gear and a checklist, and asking it for flights and a multi-city
 * itinerary is the heavy structure this field exists to avoid. It is optional
 * because trips stored before it existed have none, and `tripKindOf` reads a
 * sensible answer off the trip itself rather than a migration writing one in.
 */
export type TripKind = "abroad" | "hotel" | "weekend" | "outdoors";

/** A flight. Only the facts you look for at 05:00 in a taxi. */
export interface TripFlight {
  id: string;
  /** Airline flight number. User content. */
  number?: string;
  from?: string;
  to?: string;
  /** ISO 8601. */
  departsAt?: string;
  arrivesAt?: string;
  confirmation?: string;
  /** A real booking link, or absent. */
  url?: string;
  note?: string;
}

/** Somewhere to sleep. */
export interface TripStay {
  id: string;
  name: string;
  destinationId?: string;
  address?: string;
  checkIn?: string;
  checkOut?: string;
  confirmation?: string;
  url?: string;
  note?: string;
}

export type FoodKind = "restaurant" | "cafe" | "market" | "dish";
export type FoodStatus = "option" | "planned" | "visited";

/**
 * Somewhere to eat, or something to eat. No map and no coordinates: an address
 * and a note is what you actually re-read, and a map would be a different app.
 */
export interface TripFood {
  id: string;
  destinationId: string;
  name: string;
  kind: FoodKind;
  address?: string;
  note?: string;
  url?: string;
  source?: SavedItemSource;
  /** The day it is penciled in for, `YYYY-MM-DD`. */
  day?: string;
  status: FoodStatus;
}

/** A city or area within the trip. */
export interface TripDestination {
  id: string;
  /** User content. */
  name: string;
  country?: string;
  /** A picture from a link; only the address is stored. */
  imageUrl?: string;
  /** Local artwork, used when there is no URL or the URL fails. */
  thumb?: ThumbKey;
  /** `YYYY-MM-DD`. */
  arriveOn?: string;
  leaveOn?: string;
  /**
   * The block that saves the trip: local closing days, market hours, transport
   * quirks, weather, rules. Plain lines, because that is how people write them.
   */
  goodToKnow: string[];
  /** What to pack or wear for this leg. User content. */
  clothing?: string;
  /** Saved items filed against this destination — links, clips, inspiration. */
  savedItemIds: string[];
  notes?: string;
}

/** One day of the trip. */
export interface TripDayPlan {
  id: string;
  /** `YYYY-MM-DD`. */
  date: string;
  destinationId: string;
  morning?: string;
  afternoon?: string;
  evening?: string;
  /** Things you could do instead, if it rains or you are tired. */
  alternatives?: string;
  /** Anything booked for that day. */
  bookings?: string;
  clothing?: string;
  notes?: string;
}

/** What a look is for. Drives grouping and the day it usually belongs to. */
export type OutfitOccasion =
  | "flight"
  | "day"
  | "evening"
  | "restaurant"
  | "beach"
  | "walking"
  | "custom";

/** One garment in a look. Deliberately just a name and a count. */
export interface OutfitClothingItem {
  id: string;
  /** User content. */
  name: string;
  category?: string;
  quantity?: number;
}

/**
 * A planned look for the trip.
 *
 * Lives on the `Trip` like destinations and days do — it is never read without
 * one, so it needs no `tripId` of its own. The picture is a *reference*: an
 * image address, a saved item, or a Pinterest page that has no thumbnail. It is
 * never downloaded and no metadata is fetched.
 */
export interface TripOutfit {
  id: string;
  /** User content. */
  title?: string;
  /** A direct image address. Only the address is stored. */
  imageUrl?: string;
  /** A saved item this look came from — its picture is used when there is one. */
  savedItemId?: string;
  /**
   * A Pinterest (or similar) page. Kept even though it yields no picture:
   * the link is the point, and inventing a thumbnail for it would be a lie.
   */
  pinterestUrl?: string;
  destinationId?: string;
  /** The days this look is assigned to. A look can serve several. */
  dayIds: string[];
  occasion?: OutfitOccasion;
  note?: string;
  clothingItems: OutfitClothingItem[];
  /** `selected` is the one you actually intend to wear. */
  status: "idea" | "selected";
  order: number;
}

export interface Trip {
  id: string;
  /** User content. */
  title: string;
  countries: string[];
  /** `YYYY-MM-DD`. */
  startDate: string;
  endDate: string;
  coverImageUrl?: string;
  coverThumb?: ThumbKey;
  status: TripStatus;
  kind?: TripKind;
  nextAction?: string;
  /**
   * The single free-text note a trip has always had. Kept, and read as the
   * first note block when `noteBlocks` has never been written — the same
   * adapter shape `notesForPage` uses, so nothing old is destroyed.
   */
  notes?: string;
  /**
   * Free-form blocks, each with a title the user chose. The same `ProjectNote`
   * a page uses — an outdoors trip is mostly notes, and building a second note
   * model for it would be the duplication this app exists to avoid.
   *
   * `undefined` means never edited (read `notes` instead). `[]` means the user
   * deleted every block and must stay empty.
   */
  noteBlocks?: ProjectNote[];
  flights: TripFlight[];
  stays: TripStay[];
  destinations: TripDestination[];
  days: TripDayPlan[];
  food: TripFood[];
  outfits: TripOutfit[];
  createdAt: string;
}
