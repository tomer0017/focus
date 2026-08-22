import type { VisionBoard } from "../types";
import { daysAgo } from "./relativeDates";

const YEAR = new Date().getFullYear();

/**
 * Mock vision boards. Tiles reference local artwork and, where it exists, the
 * goal or saved item they stand for — a tile is a pointer, never a copy.
 *
 * Mixed sizes are the whole point: an even grid of identical squares reads as
 * a photo gallery, not as a board somebody made for themselves.
 */
export const MOCK_VISION_BOARDS: VisionBoard[] = [
  {
    id: "board-year",
    title: `${YEAR}`,
    year: YEAR,
    createdAt: daysAgo(60, 20),
    tiles: [
      { id: "vt-1", thumb: "sea", caption: "Two weeks by the sea", category: "Travel", size: "large", order: 0 },
      { id: "vt-2", thumb: "running", caption: "10k without stopping", category: "Body", size: "medium", order: 1, linkedPageId: "routine-run" },
      { id: "vt-3", thumb: "livingRoom", caption: "The living room, finished", category: "Home", size: "medium", order: 2, linkedPageId: "living-room-renovation", savedItemId: "saved-living-room-pin" },
      { id: "vt-4", thumb: "books", caption: "A book a month", category: "Mind", size: "small", order: 3 },
      { id: "vt-5", thumb: "city", caption: "One city I have never seen", category: "Travel", size: "medium", order: 4 },
      { id: "vt-6", thumb: "plant", caption: "The balcony, green", category: "Home", size: "small", order: 5, linkedPageId: "balcony-garden" },
      { id: "vt-7", thumb: "laptop", caption: "Ship Sorcol", category: "Work", size: "large", order: 6, linkedPageId: "sorcol" },
      { id: "vt-8", thumb: "salad", caption: "Cook properly on weekdays", category: "Food", size: "small", order: 7 },
      { id: "vt-9", thumb: "camera", caption: "Photograph more, scroll less", category: "Mind", size: "medium", order: 8 },
      { id: "vt-10", thumb: "mountain", caption: "The ridge at sunset", category: "Travel", size: "small", order: 9 },
    ],
  },
  {
    id: "board-mom-birthday",
    title: "יום הולדת לאמא",
    year: YEAR,
    createdAt: daysAgo(20, 20),
    tiles: [
      { id: "vt-b1", thumb: "cake", caption: "The cake", size: "medium", order: 0 },
      { id: "vt-b2", thumb: "table", caption: "The courtyard table", size: "large", order: 1, savedItemId: "saved-restaurant" },
      { id: "vt-b3", thumb: "plant", caption: "Pottery workshop", size: "small", order: 2, savedItemId: "saved-gift-workshop" },
    ],
  },
];
