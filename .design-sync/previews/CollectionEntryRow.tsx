import { CollectionEntryRow } from "focus-client";
import type { CollectionEntry } from "../../client/src/types";

/**
 * The contents of a collection — recipes *and* places, one model.
 *
 * A place has no ingredients and a recipe has no opening hours, so the
 * recipe-shaped fields are optional rather than a second entity. What the row
 * shows is the picture, the name, the one line worth having kept, and when it
 * was last cooked or visited.
 *
 * Status is two fields, not three values: `status` is want-to-try or tried,
 * and `recommended` is a separate boolean — a recipe you liked is a recipe you
 * have tried, so recommending must never be able to un-try something.
 *
 * The thumbnails are the app's own local artwork. Nothing is fetched.
 */

const PLACES: CollectionEntry[] = [
  {
    id: "place-spring",
    pageId: "places-up-north",
    title: "המעיין ליד הכביש הצפוני",
    note: "ריק לפני תשע, בלתי נסבל אחרי אחת עשרה. חניה 300 מטר לפני השלט.",
    status: "tried",
    recommended: true,
    tags: ["צפון", "עם ילדים", "בוקר"],
    thumb: "spring",
    lastDoneAt: "2026-07-31T07:00:00.000Z",
    order: 0,
  },
  {
    id: "place-courtyard",
    pageId: "places-up-north",
    title: "המסעדה עם החצר",
    note: "צריך להזמין שולחן בחוץ מראש. הם מחזיקים אותו רק רבע שעה.",
    status: "tried",
    recommended: true,
    tags: ["ערב", "יום הולדת"],
    thumb: "city",
    lastDoneAt: "2026-06-14T19:30:00.000Z",
    order: 1,
  },
  {
    id: "place-lookout",
    pageId: "places-up-north",
    title: "התצפית מעל הכפר",
    note: "עלייה של עשרים דקות, אין צל בכלל בדרך.",
    status: "tried",
    recommended: false,
    tags: ["טיול", "שקיעה"],
    thumb: "mountain",
    lastDoneAt: "2026-05-02T16:45:00.000Z",
    order: 2,
  },
];

const RECIPES: CollectionEntry[] = [
  {
    id: "recipe-neapolitan",
    pageId: "pizza-recipes",
    title: "בצק נפוליטני ל‑72 שעות",
    note: "הכי טוב שיצא. חצי כפית שמרים, לא יותר.",
    status: "tried",
    recommended: true,
    tags: ["פיצה", "שישי"],
    thumb: "pizza",
    prepMinutes: 30,
    cookMinutes: 8,
    servings: 4,
    rating: 5,
    nextTime: "לפזר פחות קמח על המשטח — נשרף בתנור.",
    lastDoneAt: "2026-08-14T18:00:00.000Z",
    order: 0,
  },
  {
    id: "recipe-honey-cake",
    pageId: "holiday-recipes",
    title: "עוגת דבש של סבתא",
    note: "המתכון מהמחברת הכחולה. יוצא נמוך אבל רטוב.",
    status: "tried",
    recommended: true,
    tags: ["ראש השנה", "משפחה"],
    thumb: "cake",
    prepMinutes: 25,
    cookMinutes: 50,
    rating: 5,
    lastDoneAt: "2025-09-22T15:00:00.000Z",
    order: 1,
  },
  {
    id: "recipe-slow-roast",
    pageId: "holiday-recipes",
    title: "Slow roast, high finish",
    note: "Four hours at 140, then twenty minutes at 220 for the crust.",
    status: "want_to_try",
    recommended: false,
    tags: ["Main", "Hosting"],
    thumb: "salad",
    order: 2,
  },
  {
    id: "recipe-garden-salad",
    pageId: "holiday-recipes",
    title: "סלט עם עשבים מהמרפסת",
    note: "רק אם הבזיליקום שרד את הקיץ.",
    status: "want_to_try",
    recommended: false,
    tags: ["קיץ", "מהיר"],
    thumb: "plant",
    order: 3,
  },
];

/** Places the user has actually been — how the Trips space shows them. */
export const PlacesAlreadyVisited = () => (
  <div className="focus-sections">
    <CollectionEntryRow title="מקומות" entries={PLACES} span="full" />
  </div>
);

/** The same component over recipes: one model, two very different collections. */
export const Recipes = () => (
  <div className="focus-sections">
    <CollectionEntryRow title="מתכונים" entries={RECIPES} span="full" />
  </div>
);

/**
 * An entry that has never been cooked or visited carries no date line at all —
 * the row simply ends after the note rather than reserving a band for it.
 */
export const NeverDoneCarriesNoDate = () => (
  <div className="focus-sections">
    <CollectionEntryRow title="רוצה לנסות" entries={RECIPES.slice(2)} />
  </div>
);

/** An empty collection group renders nothing — no heading, no empty panel. */
export const EmptyGroup = () => (
  <div className="focus-sections">
    <CollectionEntryRow title="מומלץ" entries={[]} />
    <p className="text-secondary small mb-0" dir="auto">
      (An empty section renders nothing at all. That is the rule, not a broken cell.)
    </p>
  </div>
);
