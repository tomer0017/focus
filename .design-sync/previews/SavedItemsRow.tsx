import { SavedItemsRow } from "focus-client";
import type { SavedItem } from "../../client/src/types";

/**
 * A visual row of saved content, built from the shared saved-item card.
 *
 * The row is capped — four on the overview, six in a space view — because
 * "recently saved" is a reminder that the pile exists, not the pile itself.
 *
 * Two kinds of card, and the difference is visible: an item with a real
 * destination opens in a new tab and is marked as external; an item with no
 * URL at all opens an internal preview and says so. Nothing here ever renders
 * a link the app cannot honestly open, and no metadata is fetched from
 * YouTube, Pinterest or anywhere else — the source chip is the user's own
 * answer to "where did I get this?".
 */

const RECENT: SavedItem[] = [
  {
    id: "saved-dough",
    kind: "video",
    title: "Neapolitan dough, start to finish",
    note: "72 שעות במקרר — הבצק הכי טוב שיצא לי עד עכשיו.",
    source: "youtube",
    url: "https://www.youtube.com/",
    spaceId: "cooking",
    thumb: "pizza",
    category: "בצק",
    contextIds: ["page:pizza-recipes"],
    savedAt: "2026-08-19T20:15:00.000Z",
  },
  {
    id: "saved-sideboard",
    kind: "product",
    title: "Oak sideboard, 180cm",
    note: "נמוך מספיק לגומחה. לבדוק שוב את הרוחב לפני שמזמינים.",
    source: "store",
    url: "https://www.ikea.com/",
    spaceId: "home",
    thumb: "sideboard",
    category: "ריהוט",
    contextIds: ["page:living-room-renovation"],
    savedAt: "2026-08-16T11:40:00.000Z",
  },
  {
    id: "saved-living-room",
    kind: "inspiration",
    title: "Warm living room, low sideboard",
    note: "הכיוון שאני רוצה — עץ בהיר וקיר בגוון חול.",
    source: "pinterest",
    spaceId: "home",
    thumb: "livingRoom",
    category: "סלון",
    contextIds: ["page:home-inspiration"],
    savedAt: "2026-08-12T09:05:00.000Z",
  },
  {
    id: "saved-courtyard",
    kind: "location",
    title: "The place with the courtyard",
    note: "לשאול אם אפשר שולחן בחוץ לשמונה — זה המקום ליום ההולדת של אמא.",
    source: "maps",
    spaceId: "personal",
    thumb: "city",
    category: "מסעדה",
    contextIds: ["event:birthday-mum-60"],
    savedAt: "2026-08-09T18:30:00.000Z",
  },
  {
    id: "saved-cooler",
    kind: "product",
    title: "Cooler box, 25L",
    note: "מספיק ליומיים בצפון, נכנס לתא המטען עם הכיסאות.",
    source: "store",
    spaceId: "trips",
    thumb: "mountain",
    category: "ציוד",
    contextIds: ["page:trip-north"],
    savedAt: "2026-08-04T07:20:00.000Z",
  },
  {
    id: "saved-north-note",
    kind: "note",
    title: "What I'd do differently up north",
    note: "Leave at six, not eight. The spring is empty before nine and unbearable after eleven.",
    source: "own",
    spaceId: "trips",
    thumb: "notebook",
    contextIds: ["page:trip-north"],
    savedAt: "2026-07-28T21:00:00.000Z",
  },
];

const TRAINING_PLANS: SavedItem[] = [
  {
    id: "plan-current",
    kind: "document",
    title: "תוכנית אימון — אוגוסט 2026",
    note: "שלוש פעמים בשבוע, דגש על רגליים. מהמאמן בחדר הכושר.",
    source: "file",
    spaceId: "personal",
    thumb: "gym",
    category: "תוכנית נוכחית",
    contextIds: ["routine:strength"],
    savedAt: "2026-08-01T06:30:00.000Z",
  },
  {
    id: "plan-spring",
    kind: "document",
    title: "תוכנית אימון — אביב 2026",
    note: "התוכנית הקודמת. שמרתי בגלל תרגילי הגב.",
    source: "file",
    spaceId: "personal",
    thumb: "running",
    category: "תוכנית קודמת",
    contextIds: ["routine:strength"],
    savedAt: "2026-03-04T06:30:00.000Z",
  },
];

/** The overview's row: capped at four, short enough to share a row. */
export const RecentlySaved = () => (
  <div className="focus-sections">
    <SavedItemsRow items={RECENT} span="full" />
  </div>
);

/** A space view raises the cap to six, so the whole pile shows. */
export const AllSixInASpace = () => (
  <div className="focus-sections">
    <SavedItemsRow items={RECENT} limit={6} span="full" />
  </div>
);

/** Filtered to one kind — how Training shows its plans. */
export const TrainingPlans = () => (
  <div className="focus-sections">
    <SavedItemsRow title="תוכניות אימון" items={TRAINING_PLANS} limit={6} span="auto" />
  </div>
);

/** Nothing saved renders nothing — no heading, no empty panel. */
export const NothingSaved = () => (
  <div className="focus-sections">
    <SavedItemsRow items={[]} span="auto" />
    <p className="text-secondary small mb-0" dir="auto">
      (An empty section renders nothing at all. That is the rule, not a broken cell.)
    </p>
  </div>
);
