import { SavedItemCard } from "focus-client";
import type { SavedItem } from "../../client/src/types";

/**
 * A saved link, clip, product or note.
 *
 * The axis worth showing is the one the card itself makes visible: an item with
 * a real destination is an external link, opened in a new tab and marked as
 * such; an item without one has **no** `url` at all and opens an internal
 * preview behind a "no link" badge. Nothing here points at a placeholder host,
 * because a card that opens `example.com` looks like a working link and is not.
 *
 * The thumbnail is local artwork keyed by `thumb`, and the source is the user's
 * own answer to "where did I get this?" — no metadata is fetched from anywhere.
 *
 * `savedAt` is a fixed ISO date a few days either side of the present, because
 * the card prints it as "saved N days ago" and a fixture from two years back
 * would say so.
 */

const base: Pick<SavedItem, "spaceId" | "contextIds"> = {
  spaceId: "home",
  contextIds: [],
};

const PIZZA: SavedItem = {
  ...base,
  id: "saved-pizza",
  kind: "recipe",
  title: "בצק פיצה נפוליטני — 72 שעות",
  note: "הבצק שיצא הכי טוב. לוותר על השמרים היבשים ולהשתמש בשאור.",
  source: "web",
  url: "https://www.seriouseats.com/recipes",
  thumb: "pizza",
  category: "אוכל",
  savedAt: "2026-08-18T18:20:00.000Z",
};

const SIDEBOARD: SavedItem = {
  ...base,
  id: "saved-sideboard",
  kind: "product",
  title: "מזנון אלון 180 ס״מ",
  note: "נכנס בול מתחת לחלון. לבדוק אם יש בגוון בהיר יותר.",
  source: "store",
  url: "https://www.ikea.com/il/he/",
  thumb: "sideboard",
  category: "סלון",
  savedAt: "2026-08-11T09:05:00.000Z",
};

/** No honest destination, so no `url` — the card opens an internal preview instead. */
const MOOD: SavedItem = {
  ...base,
  id: "saved-mood",
  kind: "image",
  title: "סלון עם קיר ספרים מלא",
  note: "בעיקר בגלל התאורה הנמוכה מעל הספה.",
  source: "own",
  thumb: "livingRoom",
  category: "השראה",
  savedAt: "2026-07-28T20:40:00.000Z",
};

const LOGICAL_PROPS: SavedItem = {
  ...base,
  spaceId: "work-tech",
  id: "saved-logical",
  kind: "link",
  title: "CSS logical properties — the whole reference",
  note: "This is what keeps one layout working in both directions.",
  source: "web",
  url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values",
  thumb: "laptop",
  category: "Reference",
  savedAt: "2026-08-20T07:30:00.000Z",
};

const PLAN: SavedItem = {
  ...base,
  spaceId: "personal",
  id: "saved-plan",
  kind: "document",
  title: "תוכנית אימונים — מחזור אביב",
  note: "שלושה אימונים בשבוע, דגש על גב תחתון.",
  source: "file",
  thumb: "document",
  category: "אימונים",
  savedAt: "2026-08-04T06:15:00.000Z",
};

const NOTE: SavedItem = {
  ...base,
  spaceId: "cooking",
  id: "saved-note",
  kind: "note",
  title: "מה להביא לארוחת החג",
  note: "סלט ירוק, יין לבן, ותבנית אחת של עוגת דבש.",
  source: "own",
  thumb: "notebook",
  savedAt: "2026-07-15T16:00:00.000Z",
};

const Grid = ({ items }: { items: SavedItem[] }) => (
  <ul className="list-unstyled focus-grid focus-grid--saved mb-0">
    {items.map((item) => (
      <li key={item.id}>
        <SavedItemCard item={item} />
      </li>
    ))}
  </ul>
);

/** One card with a real destination: external icon, "open", and a new tab. */
export const WithDestination = () => <Grid items={[PIZZA]} />;

/** No `url` at all. The title opens an internal preview and the card says so. */
export const WithoutDestination = () => <Grid items={[MOOD]} />;

/** The kinds sweep — recipe, product, link, document, note — as the app grids them. */
export const KindSweep = () => (
  <Grid items={[PIZZA, SIDEBOARD, LOGICAL_PROPS, PLAN, NOTE]} />
);
