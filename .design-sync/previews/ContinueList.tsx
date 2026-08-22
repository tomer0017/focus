import { ContinueList } from "focus-client";
import type { PageSummary } from "../../client/src/types";

/**
 * "Pick up where you left off."
 *
 * The card leads with the breadcrumb — where work actually stopped — and the
 * next action underneath it, because those are the two facts somebody needs
 * after two months away. The list is capped; it is never the project list.
 *
 * Dates are hard-coded ISO strings: anything derived from `Date.now()` would
 * give the card a different render on every sync.
 */

const RESUME: PageSummary[] = [
  {
    id: "sorcol",
    type: "project",
    spaceId: "work-tech",
    status: "active",
    title: "Sorcol",
    currentState: "Sizing engine works for M; the site copy is half written.",
    stoppedAt: "Halfway through the size-chart component — M renders, S and L are placeholders.",
    nextAction: "Finish the size chart for S and L, then re-run the checkout smoke test.",
    lastUpdatedAt: "2026-08-14T09:20:00.000Z",
    boardOrder: 0,
    favorite: true,
    visibility: "private",
  },
  {
    id: "living-room-renovation",
    type: "project",
    spaceId: "home",
    status: "active",
    title: "שיפוץ הסלון",
    stoppedAt: "עצרתי אחרי שמדדתי את הגומחה — יצא 182 ס״מ, והמזנון שאהבתי רחב יותר.",
    blocker: "המזנון מאלון רחב מדי לגומחה.",
    nextAction: "לבדוק אם יש דגם 180 בסניף בראשון, אחרת לוותר על האלון.",
    lastUpdatedAt: "2026-08-05T17:40:00.000Z",
    boardOrder: 1,
    favorite: false,
    visibility: "private",
  },
  {
    id: "painter-platform",
    type: "project",
    spaceId: "work-tech",
    status: "active",
    title: "Painter Platform",
    stoppedAt: "Uploads over 8MB fail silently — I never got to reading the server log.",
    nextAction: "Reproduce with one 12MB file and read the log while it happens.",
    lastUpdatedAt: "2026-07-22T08:05:00.000Z",
    boardOrder: 2,
    favorite: false,
    visibility: "private",
  },
  {
    id: "balcony-garden",
    type: "project",
    spaceId: "home",
    status: "active",
    title: "גינת המרפסת",
    currentState: "שלוש עציצים גדולים כבר בחוץ, הפינה השמאלית עדיין ריקה.",
    stoppedAt: "קניתי אדמה ולא הספקתי לשתול את הבזיליקום.",
    nextAction: "לשתול את הבזיליקום ואת הרוזמרין בסוף השבוע.",
    lastUpdatedAt: "2026-07-09T06:15:00.000Z",
    boardOrder: 3,
    favorite: false,
    visibility: "private",
  },
  {
    id: "calligraphy",
    type: "learning",
    spaceId: "personal",
    status: "active",
    title: "כתב יד וקליגרפיה",
    stoppedAt: "עצרתי אחרי תרגילי הזוויות בעמוד 40 בחוברת.",
    nextAction: "לתרגל עשר דקות אותיות עגולות לפני שממשיכים לעמוד הבא.",
    lastUpdatedAt: "2026-06-28T19:00:00.000Z",
    boardOrder: 4,
    favorite: false,
    visibility: "private",
  },
  {
    id: "shed-door",
    type: "project",
    spaceId: "home",
    status: "active",
    title: "Fix the shed door",
    stoppedAt: "Took the hinge off and found the frame is rotten at the bottom.",
    nextAction: "Buy a length of treated timber and cut a new bottom rail.",
    lastUpdatedAt: "2026-06-11T14:30:00.000Z",
    boardOrder: 5,
    favorite: false,
    visibility: "private",
  },
];

/** The overview's version: full width, capped at three. */
export const OnTheOverview = () => (
  <div className="focus-sections">
    <ContinueList pages={RESUME} span="full" />
  </div>
);

/** A space view raises the cap to six and titles the section itself. */
export const ActiveProjectsInASpace = () => (
  <div className="focus-sections">
    <ContinueList title="פרויקטים פעילים" pages={RESUME} limit={6} span="full" />
  </div>
);

/** With `onEdit`, every card grows a quiet edit control beside its badges. */
export const Editable = () => (
  <div className="focus-sections">
    <ContinueList
      pages={RESUME}
      limit={2}
      span="full"
      onEdit={() => {
        /* opens the edit modal in the app */
      }}
    />
  </div>
);

/** Nothing to resume renders nothing — no heading, no empty panel. */
export const NothingToResume = () => (
  <div className="focus-sections">
    <ContinueList pages={[]} span="full" />
    <p className="text-secondary small mb-0" dir="auto">
      (An empty section renders nothing at all. That is the rule, not a broken cell.)
    </p>
  </div>
);
