import type { FamilyProfile, FamilySectionKind } from "../types";
import { DEFAULT_SECTIONS } from "../types/family";
import { daysAgo } from "./relativeDates";

/**
 * Mock family profiles.
 *
 * Names, relationships and notes are user content and are never translated.
 * Everything medical here is invented and deliberately vague — a demo must not
 * put a real dose, a real vaccine schedule or a real diagnosis on the screen,
 * because somebody will read it as advice.
 */

function sections(kinds: FamilySectionKind[]): FamilyProfile["activeSections"] {
  return kinds.map((kind, order) => ({ id: `sec-${kind}-${order}`, kind, order }));
}

/** A birth date that lands `daysFromNow` away, at the given age. */
function birthDateFor(daysFromNow: number, age: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + daysFromNow);
  date.setFullYear(date.getFullYear() - age);
  const pad = (value: number): string => (value < 10 ? `0${value}` : String(value));
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const MOCK_FAMILY_PROFILES: FamilyProfile[] = [
  {
    id: "mom",
    name: "אמא",
    type: "adult",
    relationship: "אמא",
    // Eighteen days out, with a three-week preparation window — the same
    // birthday the events mock already has an event for, so the derived one
    // stands down and no duplicate appears.
    birthDate: birthDateFor(18, 66),
    activeSections: sections(["dates", "reminders", "notes", "documents"]),
    notes: [
      {
        id: "mom-note-1",
        title: "מה היא אמרה בפעם האחרונה",
        content: "רוצה משהו לגינה, לא עוד צעיף. ביקשה שלא נעשה הפתעה גדולה.",
        order: 0,
      },
    ],
    birthday: { enabled: true, prepDaysBefore: 21, importance: "high" },
    savedItemIds: [],
    createdAt: daysAgo(120, 10),
    updatedAt: daysAgo(6, 21),
  },
  {
    id: "dad",
    name: "אבא",
    type: "adult",
    relationship: "אבא",
    birthDate: birthDateFor(64, 70),
    activeSections: sections(["dates", "reminders", "notes"]),
    notes: [],
    // Seventy is worth starting on early; the window is what puts it on the
    // overview two months out instead of the week before.
    birthday: { enabled: true, prepDaysBefore: 60, importance: "high" },
    savedItemIds: [],
    createdAt: daysAgo(120, 10),
    updatedAt: daysAgo(20, 19),
  },
  {
    id: "grandma",
    name: "סבתא רחל",
    type: "adult",
    relationship: "סבתא",
    birthDate: birthDateFor(203, 89),
    activeSections: sections([
      "reminders",
      "health",
      "medications",
      "shopping",
      "documents",
      "media",
      "notes",
    ]),
    notes: [
      {
        id: "grandma-note-1",
        title: "מה היא ביקשה בפעם האחרונה",
        content: "קפה טחון דק, ומגבות מטבח. אמרה שהמאוורר בסלון עושה רעש.",
        order: 0,
      },
      {
        id: "grandma-note-2",
        title: "מי לדבר איתו",
        content: "השכנה מקומה 2 יש לה מפתח. הטלפון שלה על המקרר.",
        order: 1,
      },
    ],
    birthday: { enabled: true, prepDaysBefore: 14 },
    savedItemIds: [],
    createdAt: daysAgo(200, 10),
    updatedAt: daysAgo(11, 17),
  },
  {
    id: "baby-noam",
    name: "נועם",
    type: "baby",
    relationship: "בן",
    birthDate: birthDateFor(129, 1),
    activeSections: sections(["feeding", "tasting", "vaccinations", "notes", "media"]),
    notes: [
      {
        id: "noam-note-1",
        title: "מה עובד",
        content: "נרדם יותר מהר אחרי אמבטיה. הבקבוק הכחול פחות מטפטף.",
        order: 0,
      },
    ],
    birthday: { enabled: true, prepDaysBefore: 14 },
    savedItemIds: [],
    createdAt: daysAgo(200, 10),
    updatedAt: daysAgo(1, 8),
  },
  {
    id: "dog-luna",
    name: "לונה",
    type: "pet",
    relationship: "הכלבה",
    species: "כלבת רחוב, בערך בת 4",
    activeSections: sections(["vaccinations", "reminders", "health", "documents", "notes"]),
    notes: [
      {
        id: "luna-note-1",
        title: "מה לא לתת לה",
        content: "לא אוהבת את האוכל היבש הישן — הקיאה ממנו פעמיים. עברנו לשק הירוק.",
        order: 0,
      },
    ],
    birthday: { enabled: false },
    savedItemIds: [],
    createdAt: daysAgo(300, 10),
    updatedAt: daysAgo(4, 16),
  },
];

/** Fallback section set, used when a profile somehow arrives with none. */
export { DEFAULT_SECTIONS };
