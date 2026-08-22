import { RelatedLinks } from "focus-client";
import type { SavedItem } from "../../client/src/types";

/**
 * Attached links as a dense list, not a wall of cards.
 *
 * Seven attachments used to mean seven full-width cards, which pushed the
 * recipe method off the screen. A link's whole job here is to be recognised and
 * clicked, so a row — thumbnail, name, where it came from — does it in a fifth
 * of the height. The note is one line, and only when there is one.
 *
 * An item with no honest destination is rendered as plain text rather than as a
 * dead link — see the note in `.design-sync/learnings/rows.md` for why that
 * branch is not one of the cells below.
 */

const base: Pick<SavedItem, "spaceId" | "contextIds"> = {
  spaceId: "cooking",
  contextIds: ["recipe-pizza"],
};

const ATTACHED: SavedItem[] = [
  {
    ...base,
    id: "rel-dough",
    kind: "link",
    title: "בצק 72 שעות — ההסבר המלא",
    note: "הטבלה של אחוזי המים היא החלק החשוב.",
    source: "web",
    url: "https://www.seriouseats.com/recipes",
    thumb: "pizza",
    savedAt: "2026-06-11T18:20:00.000Z",
  },
  {
    ...base,
    id: "rel-stretch",
    kind: "video",
    title: "איך מותחים בלי לקרוע",
    source: "youtube",
    url: "https://www.youtube.com/",
    thumb: "camera",
    savedAt: "2026-06-09T12:00:00.000Z",
  },
  {
    ...base,
    id: "rel-oven",
    kind: "link",
    title: "אבן שמוט מול תבנית הפוכה",
    note: "בסוף התבנית ההפוכה ניצחה בתנור ביתי.",
    source: "web",
    url: "https://en.wikipedia.org/wiki/Baking_stone",
    thumb: "table",
    savedAt: "2026-05-30T08:10:00.000Z",
  },
];

const MANY: SavedItem[] = [
  ...ATTACHED,
  {
    ...base,
    id: "rel-sauce",
    kind: "recipe",
    title: "רוטב עגבניות בלי בישול",
    source: "web",
    url: "https://ottolenghi.co.uk/",
    thumb: "salad",
    savedAt: "2026-05-22T17:45:00.000Z",
  },
  {
    ...base,
    id: "rel-board",
    kind: "inspiration",
    title: "Pinterest — plating ideas",
    note: "Mostly for how flat the slices are cut.",
    source: "pinterest",
    url: "https://www.pinterest.com/",
    thumb: "notebook",
    savedAt: "2026-05-14T19:00:00.000Z",
  },
  {
    ...base,
    id: "rel-flour",
    kind: "product",
    title: "קמח 00 — איפה קונים בקילו",
    source: "store",
    url: "https://www.ikea.com/il/he/",
    thumb: "books",
    savedAt: "2026-04-28T11:20:00.000Z",
  },
  {
    ...base,
    id: "rel-fold",
    kind: "video",
    title: "הקיפול של הקצוות לפני ההתפחה השנייה",
    note: "הדקה השלישית היא היחידה שחשובה.",
    source: "youtube",
    url: "https://www.youtube.com/",
    thumb: "cake",
    savedAt: "2026-08-01T13:30:00.000Z",
  },
];

const LONG_NOTES: SavedItem[] = [
  {
    ...base,
    id: "rel-hydration",
    kind: "link",
    title: "אחוזי מים — הטבלה המלאה",
    note: "65% למי שאין לו תנור חזק, 70% אם אופים על אבן שחוממה שעה שלמה, ומעל זה הבצק פשוט נדבק לכף ואי אפשר לעבוד איתו ביד.",
    source: "web",
    url: "https://www.seriouseats.com/recipes",
    thumb: "notebook",
    savedAt: "2026-08-12T10:00:00.000Z",
  },
  ATTACHED[1],
  {
    ...base,
    id: "rel-oven-note",
    kind: "link",
    title: "לחמם את התנור שעה, לא עשרים דקות",
    note: "זה ההבדל בין תחתית חיוורת לתחתית עם כתמים שרופים, וזה גם מה שגרם לנו לחשוב שהבצק אשם.",
    source: "web",
    url: "https://en.wikipedia.org/wiki/Baking_stone",
    thumb: "table",
    savedAt: "2026-08-06T09:00:00.000Z",
  },
];

/** The common case: two or three, all with real destinations. */
export const Attached = () => <RelatedLinks items={ATTACHED} />;

/** Seven attachments, capped at three, with "show N more" underneath. */
export const CappedWithShowMore = () => <RelatedLinks items={MANY} initial={3} />;

/**
 * A note is one line, and only when there is one. The middle row has none, so it
 * takes two lines rather than reserving an empty third.
 */
export const NotesAreOneLine = () => <RelatedLinks items={LONG_NOTES} />;

/**
 * A saved thing with no real destination behind it — a Pinterest board kept as
 * a memory jog, say. It gets no `url` at all, and the row says "no link" rather
 * than rendering an anchor the app cannot honestly open.
 */
export const OneWithoutDestination = () => (
  <RelatedLinks
    items={[
      ATTACHED[0],
      {
        ...ATTACHED[0],
        id: "rel-no-destination",
        kind: "note",
        title: "לוח השראה למטבח",
        note: "נשמר כתזכורת — אין קישור אמיתי מאחוריו, רק המקום שבו זה נשמר.",
        source: "pinterest",
        url: undefined,
        thumb: "notebook",
        savedAt: "2026-08-15T09:00:00.000Z",
      },
    ]}
  />
);
