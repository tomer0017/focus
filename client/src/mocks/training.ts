import type { TrainingPlan } from "../types";
import { daysAgo } from "./relativeDates";

/**
 * Seeded training plans.
 *
 * Deliberately four, not forty: two live gym plans running at the same time —
 * which is the arrangement the old screen could not represent at all — one home
 * plan for the weeks the gym is out of reach, and one finished plan kept for
 * reference. Titles, exercise names and notes are user content and are never
 * translated.
 */
const stamp = daysAgo(30, 19);

export const MOCK_TRAINING_PLANS: TrainingPlan[] = [
  {
    id: "plan-a",
    title: "חזה, כתפיים ויד אחורית",
    label: "A",
    status: "active",
    environment: "gym",
    description: "היום הכבד של השבוע. להתחיל אחרי חימום של עשר דקות.",
    order: 0,
    groups: [
      {
        id: "plan-a-main",
        title: "חלק ראשי",
        order: 0,
        exercises: [
          { id: "a1", name: "לחיצת חזה במוט", sets: "4", reps: "8", lastWeight: "60 ק״ג", order: 0 },
          {
            id: "a2",
            name: "לחיצת חזה בשיפוע עם משקולות",
            sets: "3",
            reps: "10",
            lastWeight: "22 ק״ג",
            note: "לרדת לאט. בפעם שעברה זה היה מהיר מדי",
            order: 1,
          },
          { id: "a3", name: "לחיצת כתפיים בישיבה", sets: "3", reps: "10", lastWeight: "18 ק״ג", order: 2 },
        ],
      },
      {
        id: "plan-a-finish",
        title: "לסיום",
        description: "קצר, בלי לשבור שיאים",
        order: 1,
        exercises: [
          { id: "a4", name: "פשיטת מרפקים בפולי", sets: "3", reps: "12–15", order: 0 },
          { id: "a5", name: "הרמות צד", sets: "3", reps: "15", lastWeight: "8 ק״ג", order: 1 },
        ],
      },
    ],
    notes: [
      {
        id: "plan-a-note",
        title: "המשקלים האחרונים",
        content:
          "לחיצת חזה: 60 ק״ג לארבע חזרות טובות, החמישית כבר עם עזרה.\nכתפיים: 18 ק״ג הרגיש נוח, אפשר לנסות 20.",
        order: 0,
      },
    ],
    createdAt: stamp,
    updatedAt: daysAgo(3, 20),
  },
  {
    id: "plan-b",
    title: "גב, יד קדמית ובטן",
    label: "B",
    status: "active",
    environment: "gym",
    order: 1,
    groups: [
      {
        id: "plan-b-main",
        title: "חלק ראשי",
        order: 0,
        exercises: [
          { id: "b1", name: "מתח בהנחיה", sets: "4", reps: "8", order: 0 },
          { id: "b2", name: "חתירה בפולי תחתון", sets: "4", reps: "10", lastWeight: "50 ק״ג", order: 1 },
          {
            id: "b3",
            name: "כפיפת מרפקים במוט",
            sets: "3",
            reps: "10",
            lastWeight: "25 ק״ג",
            note: "בלי להתנדנד",
            order: 2,
          },
        ],
      },
      {
        id: "plan-b-core",
        title: "בטן",
        order: 1,
        exercises: [{ id: "b4", name: "פלאנק", sets: "3", reps: "45 שניות", order: 0 }],
      },
    ],
    createdAt: stamp,
    updatedAt: daysAgo(6, 20),
  },
  {
    id: "plan-home",
    title: "אימון בית קצר",
    label: "בית",
    status: "active",
    environment: "home",
    description: "לשבועות שבהם אין זמן להגיע. עשרים דקות, בלי ציוד.",
    order: 2,
    groups: [
      {
        id: "plan-home-round",
        title: "סבב, שלוש פעמים",
        order: 0,
        exercises: [
          { id: "h1", name: "שכיבות סמיכה", sets: "3", reps: "12", order: 0 },
          { id: "h2", name: "סקוואט משקל גוף", sets: "3", reps: "20", order: 1 },
          { id: "h3", name: "מכרעים לסירוגין", sets: "3", reps: "10 לכל רגל", order: 2 },
          { id: "h4", name: "פלאנק צד", sets: "3", reps: "30 שניות", order: 3 },
        ],
      },
    ],
    createdAt: stamp,
    updatedAt: daysAgo(12, 8),
  },
  {
    id: "plan-old-fullbody",
    title: "Full body מהחורף",
    label: "Full body",
    status: "completed",
    environment: "gym",
    description: "שלושה אימונים בשבוע. עבד טוב, אבל נמאס מהחזרתיות.",
    order: 3,
    groups: [
      {
        id: "plan-old-all",
        title: "כל הגוף",
        order: 0,
        exercises: [
          { id: "o1", name: "סקוואט", sets: "3", reps: "8", lastWeight: "70 ק״ג", order: 0 },
          { id: "o2", name: "לחיצת חזה", sets: "3", reps: "8", lastWeight: "55 ק״ג", order: 1 },
          { id: "o3", name: "חתירה", sets: "3", reps: "10", lastWeight: "45 ק״ג", order: 2 },
        ],
      },
    ],
    createdAt: daysAgo(200, 18),
    updatedAt: daysAgo(90, 18),
  },
];
