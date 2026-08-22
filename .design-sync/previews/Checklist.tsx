import { Checklist } from "focus-client";
import type { Checklist as ChecklistModel } from "../../client/src/types";

/**
 * The one checklist mechanism. A trip, a project, an event and a shopping list
 * all render this component — building three of them would have been three
 * sets of bugs.
 *
 * The two things worth looking at here are the modes. `view` keeps the boxes
 * tickable and hides every structural control, because ticking something off
 * is not editing the list; `edit` is the one that shows reorder, rename and
 * delete. A list is shown part-done on purpose: an untouched list and a
 * finished one both hide what the ticked state actually looks like.
 *
 * `onChange` is a no-op here. In the app it is a pure operation from
 * `lib/checklist` handed to the provider, which is what makes the same
 * component safe to drop into five screens.
 */

const noop = () => {};

const PACKING: ChecklistModel = {
  ownerId: "trip:japan-2027",
  title: "רשימת אריזה — יפן",
  updatedAt: "2026-08-14T07:20:00.000Z",
  groups: [
    {
      id: "g-docs",
      title: "מסמכים וכסף",
      items: [
        { id: "i-passport", text: "דרכונים — לבדוק תוקף", done: true, note: "שלי בתוקף עד 2029" },
        { id: "i-insurance", text: "ביטוח נסיעות", done: true },
        { id: "i-jrpass", text: "Japan Rail Pass", done: false, note: "לקנות לפני הטיסה, לא שם" },
        { id: "i-cash", text: "ין מזומן", done: false, note: "הרבה מקומות קטנים לא מקבלים כרטיס" },
      ],
    },
    {
      id: "g-clothes",
      title: "בגדים",
      items: [
        { id: "i-shoes", text: "נעלי הליכה", done: true },
        { id: "i-rain", text: "מעיל גשם דק", done: true },
        { id: "i-layers", text: "שכבות לערב — אוקטובר קריר בקיוטו", done: false },
        { id: "i-socks", text: "גרביים להורדת נעליים במסעדות", done: false },
      ],
    },
    {
      id: "g-tech",
      title: "אלקטרוניקה",
      collapsed: true,
      items: [
        { id: "i-adapter", text: "מתאם לשקע יפני", done: true },
        { id: "i-powerbank", text: "סוללה ניידת", done: false },
        { id: "i-charger", text: "מטען למצלמה", done: false },
      ],
    },
  ],
};

const SHOPPING: ChecklistModel = {
  ownerId: "page:shop-weekly",
  title: "קנייה שבועית",
  templateId: "shop-weekly",
  updatedAt: "2026-08-20T16:05:00.000Z",
  groups: [
    {
      id: "g-shop",
      title: "קנייה שבועית",
      items: [
        { id: "s-milk", text: "חלב 3%", done: true },
        { id: "s-eggs", text: "ביצים L", done: true },
        { id: "s-bread", text: "לחם מחמצת", done: true },
        { id: "s-tomato", text: "עגבניות שרי", done: false },
        { id: "s-cucumber", text: "מלפפונים", done: false },
        { id: "s-chicken", text: "פרגיות לשבת", done: false, note: "לבקש בלי עצם" },
        { id: "s-coffee", text: "קפה טחון", done: false },
      ],
    },
  ],
};

const EVENT_TASKS: ChecklistModel = {
  ownerId: "event:bar-mitzvah-2026",
  title: "בר מצווה — מה נשאר",
  updatedAt: "2026-08-18T11:00:00.000Z",
  groups: [
    {
      id: "e-hall",
      title: "אולם וקייטרינג",
      items: [
        { id: "e-book", text: "לסגור תאריך עם האולם", done: true },
        { id: "e-menu", text: "לאשר תפריט", done: true },
        { id: "e-count", text: "למסור מספר סופי של אורחים", done: false, note: "שבועיים לפני" },
      ],
    },
    {
      id: "e-people",
      title: "אנשים",
      items: [
        { id: "e-invites", text: "לשלוח הזמנות", done: true },
        { id: "e-photographer", text: "צלם — לקבל הצעה שנייה", done: false },
        { id: "e-seating", text: "סידור הושבה", done: false },
      ],
    },
  ],
};

/**
 * The canonical use: view mode. Boxes are live, and there is not a delete
 * button in sight. The third group is collapsed, so its header carries the
 * count instead.
 */
export const PackingList = () => (
  <Checklist checklist={PACKING} onChange={noop} mode="view" />
);

/**
 * Edit mode, entered by one explicit action beside the page title. Only now do
 * reorder arrows, rename, delete and the "add an item" inputs appear — and the
 * header picks up "save as a template".
 */
export const EditMode = () => (
  <Checklist
    checklist={EVENT_TASKS}
    onChange={noop}
    mode="edit"
    action={
      <button type="button" className="btn btn-link btn-sm">
        שמירה כתבנית
      </button>
    }
  />
);

/**
 * A shopping list is a checklist page, not a new entity. One group means the
 * group header and "add a group" are noise, so `hideGroupChrome` drops both.
 */
export const ShoppingList = () => (
  <Checklist checklist={SHOPPING} onChange={noop} mode="view" hideGroupChrome />
);

/**
 * `hideProgress` is for the screens that already show progress above the list —
 * the checklist page prints it under the title, and printing it twice is the
 * duplication rule broken.
 */
export const WithoutProgress = () => (
  <Checklist checklist={EVENT_TASKS} onChange={noop} mode="view" hideProgress />
);
