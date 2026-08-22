import { EventList } from "focus-client";
import type { FocusEvent } from "../../client/src/types";

/**
 * Dated occasions as chip cards: what it is, how far away it is, and the one
 * next step.
 *
 * The countdown is the loudest thing on the card and the date sits underneath
 * it — "in 9 days" is what makes an event feel like an event, and the date is
 * what you need to write in a diary. Urgency is an accent on the border plus a
 * chip in words; it is never colour on its own.
 *
 * Urgency is *not* days remaining: an event says how long its preparation
 * takes (`prepDaysBefore`) and how much it matters (`importance`), and an
 * event that declares no preparation window stays quiet until the week before.
 */

const WEDDING: FocusEvent = {
  id: "wedding-noa",
  kind: "wedding",
  title: "החתונה של נועה ואיתי",
  startsAt: "2026-10-08T18:30:00.000Z",
  spaceId: "personal",
  nextAction: "לאשר הגעה לשניים ולבדוק אם יש הסעה מהעיר.",
  prepDaysBefore: 60,
  importance: "high",
  sections: [],
  createdAt: "2026-05-02T10:00:00.000Z",
};

const MUM_SIXTY: FocusEvent = {
  id: "birthday-mum-60",
  kind: "birthday",
  title: "יום הולדת 60 לאמא",
  startsAt: "2026-08-26T17:00:00.000Z",
  spaceId: "personal",
  nextAction: "להזמין את השולחן בחצר לשמונה אנשים.",
  prepDaysBefore: 30,
  importance: "high",
  sections: [],
  createdAt: "2026-04-11T08:00:00.000Z",
};

const DINNER: FocusEvent = {
  id: "hosting-friday",
  kind: "hosting",
  title: "ארוחת שישי אצלנו",
  startsAt: "2026-08-22T18:00:00.000Z",
  spaceId: "home",
  nextAction: "לקנות סלמון ולהוציא את החלה מהפריזר.",
  sections: [],
  createdAt: "2026-08-16T09:00:00.000Z",
};

const NEW_YEAR: FocusEvent = {
  id: "holiday-rosh-hashana",
  kind: "holiday",
  title: "ראש השנה אצל ההורים",
  startsAt: "2026-09-11T18:00:00.000Z",
  spaceId: "home",
  nextAction: "לשאול את אמא מה להביא — בשנה שעברה יצאו שתי עוגות דבש.",
  prepDaysBefore: 14,
  importance: "normal",
  sections: [],
  createdAt: "2026-06-20T12:00:00.000Z",
};

const ANNIVERSARY: FocusEvent = {
  id: "anniversary-2027",
  kind: "anniversary",
  title: "עשר שנים לחתונה",
  startsAt: "2027-05-14T19:00:00.000Z",
  spaceId: "personal",
  sections: [],
  createdAt: "2026-01-03T09:00:00.000Z",
};

const PARTY_DONE: FocusEvent = {
  id: "party-leaving",
  kind: "party",
  title: "מסיבת פרידה ל‑Dana במשרד",
  startsAt: "2026-08-13T16:00:00.000Z",
  spaceId: "work-tech",
  sections: [],
  createdAt: "2026-08-01T09:00:00.000Z",
};

/** The section as a space view builds it: four real occasions, mixed urgency. */
export const UpcomingEvents = () => (
  <div className="focus-sections">
    <EventList
      title="אירועים קרובים"
      events={[DINNER, MUM_SIXTY, NEW_YEAR, WEDDING]}
      span="full"
    />
  </div>
);

/**
 * All five states side by side. The two that matter most are `neutral` — a
 * date far off with nothing to prepare, so the card stays quiet — and
 * `preparing`, which only exists because the user said how long preparation
 * takes.
 */
export const UrgencyStates = () => (
  <div className="focus-sections">
    <EventList
      title="דורש תשומת לב"
      events={[DINNER, MUM_SIXTY, WEDDING, ANNIVERSARY, PARTY_DONE]}
      span="full"
    />
  </div>
);

/** Two cards share a row rather than each taking one to itself. */
export const TwoCardsShareTheRow = () => (
  <div className="focus-sections">
    <EventList title="אירועים קרובים" events={[DINNER, MUM_SIXTY]} />
  </div>
);

/** Nothing dated coming up renders nothing — no heading, no empty panel. */
export const NothingComingUp = () => (
  <div className="focus-sections">
    <EventList title="אירועים קרובים" events={[]} />
    <p className="text-secondary small mb-0" dir="auto">
      (An empty section renders nothing at all. That is the rule, not a broken cell.)
    </p>
  </div>
);
