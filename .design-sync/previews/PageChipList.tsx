import { PageChipList } from "focus-client";
import type { PageSummary } from "../../client/src/types";

/**
 * The compact chip list: Quick access on the overview, and the grouped page
 * lists inside a space view (checklists, parked projects, finished work).
 *
 * One line of context per page — the next action if there is one, otherwise
 * where things stand. When the page owns a checklist, the card shows the first
 * few things still to do *above* the bar: "5 of 26" tells you how far along
 * you are and nothing about what is left, which is the only thing you opened
 * it for.
 */

/*
 * These ids match checklists the app seeds (`page:sorcol`,
 * `page:before-a-flight`…), which is what makes the item preview and the
 * progress bar appear. A page with no checklist simply renders neither.
 */
const WITH_CHECKLISTS: PageSummary[] = [
  {
    id: "sorcol",
    type: "project",
    spaceId: "work-tech",
    status: "active",
    title: "Sorcol",
    nextAction: "Finish the size chart for S and L, then re-run the checkout smoke test.",
    lastUpdatedAt: "2026-08-14T09:20:00.000Z",
    favorite: true,
    visibility: "private",
  },
  {
    id: "living-room-renovation",
    type: "project",
    spaceId: "home",
    status: "active",
    title: "שיפוץ הסלון",
    nextAction: "לבדוק אם יש מזנון ברוחב 180 בסניף בראשון.",
    lastUpdatedAt: "2026-08-05T17:40:00.000Z",
    favorite: false,
    visibility: "private",
  },
  {
    id: "before-a-flight",
    type: "checklist",
    spaceId: "trips",
    status: "active",
    title: "לפני טיסה",
    currentState: "הרשימה שאני פותח ערב לפני כל טיסה, כדי לא לשכוח שוב את המטען.",
    dueAt: "2026-09-03",
    lastUpdatedAt: "2026-08-18T20:10:00.000Z",
    favorite: true,
    visibility: "private",
  },
  {
    id: "trip-north",
    type: "checklist",
    spaceId: "trips",
    status: "active",
    title: "סופ״ש בצפון",
    nextAction: "להוציא את הצידנית מהמחסן ולבדוק שהיא לא דולפת.",
    lastUpdatedAt: "2026-08-10T11:00:00.000Z",
    favorite: false,
    visibility: "private",
  },
];

const PARKED: PageSummary[] = [
  {
    id: "old-site-migration",
    type: "project",
    spaceId: "work-tech",
    status: "paused",
    title: "Old Site Migration",
    currentState: "Half the content is copied over; the redirects were never written.",
    pausedReason: "Parked until the new platform stops moving.",
    lastUpdatedAt: "2026-04-02T13:00:00.000Z",
    favorite: false,
    visibility: "private",
  },
  {
    id: "home-office",
    type: "project",
    spaceId: "home",
    status: "paused",
    title: "פינת עבודה בבית",
    currentState: "השולחן נמדד, הכיסא לא נבחר. חיכיתי למבצעי סוף עונה.",
    lastUpdatedAt: "2026-03-19T09:30:00.000Z",
    favorite: false,
    visibility: "private",
  },
  {
    id: "grandmother-portrait",
    type: "project",
    spaceId: "personal",
    status: "paused",
    title: "Oil portrait — grandmother",
    currentState: "Underpainting is dry. I stopped because the light in the room changed.",
    lastUpdatedAt: "2026-02-27T15:45:00.000Z",
    favorite: false,
    visibility: "private",
  },
  {
    id: "pizza-recipes",
    type: "collection",
    spaceId: "cooking",
    status: "active",
    title: "Pizza Recipes",
    currentState: "Eleven doughs saved, three actually made.",
    lastUpdatedAt: "2026-07-30T18:00:00.000Z",
    favorite: false,
    visibility: "private",
  },
];

/** Quick access on the overview: short enough to share a row. */
export const QuickAccess = () => (
  <div className="focus-sections">
    <PageChipList title="גישה מהירה" pages={WITH_CHECKLISTS.slice(0, 2)} span="auto" />
  </div>
);

/** Checklist pages: the open items first, then the bar. */
export const ChecklistsWithProgress = () => (
  <div className="focus-sections">
    <PageChipList title="צ׳קליסטים" pages={WITH_CHECKLISTS} span="full" />
  </div>
);

/** Parked and finished work: one line of context, no checklist, no bar. */
export const ParkedProjects = () => (
  <div className="focus-sections">
    <PageChipList title="מוקפא" pages={PARKED} span="full" />
  </div>
);

/** Nothing in the group renders nothing — no heading, no empty panel. */
export const NothingInThisGroup = () => (
  <div className="focus-sections">
    <PageChipList title="הושלם" pages={[]} span="auto" />
    <p className="text-secondary small mb-0" dir="auto">
      (An empty section renders nothing at all. That is the rule, not a broken cell.)
    </p>
  </div>
);
