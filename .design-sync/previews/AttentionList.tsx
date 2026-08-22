import { AttentionList } from "focus-client";
import type { PageSummary } from "../../client/src/types";

/**
 * "What needs me now?" — blocked work as three lines, not three panels.
 *
 * The fixtures are fixed strings with no dates in them on purpose: anything
 * computed from `Date.now()` would give the card a different render on every
 * sync and throw away its grade for no reason.
 */

const BLOCKED: PageSummary[] = [
  {
    id: "sorcol",
    type: "project",
    spaceId: "work-tech",
    status: "active",
    title: "Sorcol",
    blocker: "Waiting on the models for the remaining sizes.",
    nextAction: "Review the models and print one trial size.",
    lastUpdatedAt: "2026-06-14T09:00:00.000Z",
    boardOrder: 0,
    visibility: "private",
  },
  {
    id: "kitchen-lighting",
    type: "project",
    spaceId: "home",
    status: "active",
    title: "תאורה במטבח",
    blocker: "החשמלאי לא חוזר. צריך למצוא מישהו אחר.",
    nextAction: "לבקש המלצה בקבוצת השכונה.",
    lastUpdatedAt: "2026-06-02T09:00:00.000Z",
    boardOrder: 1,
    visibility: "private",
  },
  {
    id: "painter-platform",
    type: "project",
    spaceId: "work-tech",
    status: "active",
    title: "Painter Platform",
    blocker: "Uploads fail over 8MB and I do not know why yet.",
    nextAction: "Reproduce with one large file and read the server log.",
    lastUpdatedAt: "2026-05-28T09:00:00.000Z",
    boardOrder: 2,
    visibility: "private",
  },
  {
    id: "car-service",
    type: "project",
    spaceId: "personal",
    status: "active",
    title: "טיפול לרכב",
    blocker: "המוסך מחכה לחלק שהוזמן.",
    nextAction: "להתקשר ביום ראשון לבדוק אם הגיע.",
    lastUpdatedAt: "2026-05-20T09:00:00.000Z",
    boardOrder: 3,
    visibility: "private",
  },
];

export const ThreeBlockers = () => (
  <div className="focus-sections">
    <AttentionList pages={BLOCKED} showAllHref="/projects" />
  </div>
);

export const CappedWithShowAll = () => (
  <div className="focus-sections">
    <AttentionList pages={BLOCKED} showAllHref="/projects" limit={2} />
  </div>
);

/** Nothing blocked renders nothing at all — the rule the whole overview rests on. */
export const NothingBlocked = () => (
  <div className="focus-sections">
    <AttentionList pages={[]} showAllHref="/projects" />
    <p className="text-secondary small mb-0" dir="auto">
      (An empty section renders nothing — no heading, no placeholder panel.)
    </p>
  </div>
);
