import type { LeisureItem } from "../types";
import { daysAgo } from "./relativeDates";

/**
 * Mock leisure items.
 *
 * The tags carry the whole point: enough structure that "ninety minutes, at
 * home, no energy left" has an answer, and not one field more. Titles and notes
 * are user content and are never translated.
 */
const stamp = daysAgo(40, 21);

export const MOCK_LEISURE: LeisureItem[] = [
  {
    id: "leisure-film-noir",
    kind: "movie",
    title: "הסרט שדנה המליצה עליו",
    note: "היא אמרה שכדאי לראות אותו בלי לקרוא עליו קודם",
    minutes: 110,
    energy: "low",
    company: ["partner", "alone"],
    place: "home",
    cost: "free",
    tags: ["ערב שקט"],
    status: "idea",
    thumb: "laptop",
    createdAt: stamp,
    updatedAt: stamp,
  },
  {
    id: "leisure-book-history",
    kind: "book",
    title: "הספר על תל אביב שקיבלנו במתנה",
    minutes: 45,
    energy: "low",
    company: ["alone"],
    place: "home",
    cost: "free",
    tags: ["קריאה", "לפני שינה"],
    status: "idea",
    thumb: "books",
    createdAt: stamp,
    updatedAt: stamp,
  },
  {
    id: "leisure-walk-port",
    kind: "activity",
    title: "הליכה בנמל ולשבת על קפה",
    minutes: 90,
    energy: "medium",
    company: ["partner", "friends"],
    place: "out",
    cost: "cheap",
    tags: ["בחוץ", "ערב זוגי"],
    status: "idea",
    thumb: "sea",
    createdAt: stamp,
    updatedAt: stamp,
  },
  {
    id: "leisure-bakery",
    kind: "place",
    title: "המאפייה החדשה ליד השוק",
    note: "פתוחה עד 15:00 בשישי",
    minutes: 60,
    energy: "low",
    company: ["family", "partner"],
    place: "out",
    cost: "cheap",
    tags: ["אוכל", "סוף שבוע"],
    status: "planned",
    thumb: "cake",
    createdAt: stamp,
    updatedAt: daysAgo(9, 11),
  },
  {
    id: "leisure-board-games",
    kind: "evening",
    title: "ערב משחקים עם הילדים",
    minutes: 60,
    energy: "medium",
    company: ["family"],
    place: "home",
    cost: "free",
    tags: ["משפחה"],
    status: "idea",
    thumb: "notebook",
    createdAt: stamp,
    updatedAt: stamp,
  },
  {
    id: "leisure-camera",
    kind: "wishlist",
    title: "עדשה 35 מ״מ",
    note: "לא דחוף. לבדוק יד שנייה.",
    energy: "low",
    cost: "expensive",
    tags: ["צילום"],
    status: "idea",
    thumb: "camera",
    createdAt: stamp,
    updatedAt: stamp,
  },
];
