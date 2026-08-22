import type { FocusEvent } from "../types";
import { daysAgo, daysAhead } from "./relativeDates";

/**
 * Mock events. Titles, notes and list entries are user content and are never
 * translated; section names come from each section's `kind`, so nothing here
 * hardcodes a language into stored data.
 *
 * Two templates are filled in properly — Birthday and Holiday — because a
 * template only proves itself when it holds real content.
 */
export const MOCK_EVENTS: FocusEvent[] = [
  {
    /*
     * The id is `birthday:<profileId>`, which is what a derived birthday for
     * that profile would be called. That is the collision rule doing its job:
     * this event holds a restaurant booking, a gift list and a budget, so it
     * wins and the computed row stands down. Two cards for one birthday — one
     * with the work on it and one bare — is precisely what that rule prevents.
     */
    id: "birthday:mom",
    kind: "birthday",
    title: "יום הולדת לאמא",
    startsAt: daysAhead(18, 19),
    spaceId: "personal",
    description: "Small dinner, the people she actually wants there, one good gift.",
    nextAction: "Book the courtyard table for eight.",
    createdAt: daysAgo(24, 20),
    // Eighteen days out, and a restaurant needs booking now — so this one is
    // in its preparation window while the dentist, further off, is not.
    prepDaysBefore: 21,
    sections: [
      {
        id: "mom-birthday-tasks",
        kind: "tasks",
        order: 0,
        items: [
          { id: "t1", title: "להזמין שולחן במסעדה", done: false },
          { id: "t2", title: "לוודא מי מגיע", done: true },
          { id: "t3", title: "להזמין עוגה", done: false },
          { id: "t4", title: "לכתוב את הברכה", done: false },
        ],
      },
      {
        id: "mom-birthday-gifts",
        kind: "gifts",
        order: 1,
        items: [
          { id: "g1", title: "שרשרת זהב דקה, 45 ס״מ", done: false },
          { id: "g2", title: "סדנת קרמיקה לשניים", done: false },
        ],
        savedItemIds: ["saved-gift-necklace", "saved-gift-workshop"],
      },
      {
        id: "mom-birthday-budget",
        kind: "budget",
        order: 2,
        amount: 900,
        body: "600 למתנה, 300 לארוחה. את הארוחה מתחלקים עם אחי.",
      },
      {
        id: "mom-birthday-guests",
        kind: "guests",
        order: 3,
        items: [
          { id: "p1", title: "Dad", done: true },
          { id: "p2", title: "My brother + partner", done: true },
          { id: "p3", title: "Aunt Rina", done: false },
          { id: "p4", title: "Yael", done: true },
        ],
      },
      {
        id: "mom-birthday-food",
        kind: "food",
        order: 4,
        body: "The place with the courtyard. Quiet enough to talk, takes eight.",
        savedItemIds: ["saved-restaurant"],
      },
      {
        id: "mom-birthday-greeting",
        kind: "greeting",
        order: 5,
        body: "Start with the summer she drove us all north in that van — she tells it better, but it is still the story.",
      },
      {
        id: "mom-birthday-links",
        kind: "links",
        order: 6,
        savedItemIds: ["saved-decor-clip"],
      },
      {
        id: "mom-birthday-vision",
        kind: "vision",
        order: 7,
        visionBoardId: "board-mom-birthday",
      },
    ],
  },
  {
    id: "holiday-dinner",
    kind: "holiday",
    title: "ארוחת חג",
    startsAt: daysAhead(41, 18),
    spaceId: "home",
    description: "Fourteen people, one oven. The menu is the whole problem.",
    nextAction: "Lock the menu so the shopping list can be written.",
    createdAt: daysAgo(9, 21),
    sections: [
      {
        id: "holiday-dinner-guests",
        kind: "guests",
        order: 0,
        items: [
          { id: "hg1", title: "Both families", done: true },
          { id: "hg2", title: "The neighbours", done: false },
          { id: "hg3", title: "Two vegetarians — check the mains", done: false },
        ],
      },
      {
        id: "holiday-dinner-menu",
        kind: "menu",
        order: 1,
        body: "Roast, two salads, honey cake. One vegetarian main that is not a side dish.",
      },
      {
        id: "holiday-dinner-tasks",
        kind: "tasks",
        order: 2,
        items: [
          { id: "ht1", title: "Borrow the second table", done: false },
          { id: "ht2", title: "Write the oven timing down", done: false },
          { id: "ht3", title: "Wash the good glasses", done: false },
        ],
      },
      {
        id: "holiday-dinner-shopping",
        kind: "shopping",
        order: 3,
        items: [
          { id: "hs1", title: "Shoulder, 3kg", done: false },
          { id: "hs2", title: "Squash + pomegranate", done: false },
          { id: "hs3", title: "Honey, good one", done: true },
        ],
      },
      {
        id: "holiday-dinner-decor",
        kind: "decor",
        order: 4,
        body: "Low centrepiece. Last year nobody could see across the table.",
        savedItemIds: ["saved-table-setting", "saved-decor-clip"],
      },
      {
        id: "holiday-dinner-recipes",
        kind: "recipes",
        order: 5,
        // References into the Holiday Recipes collection. Nothing is copied.
        collectionEntryIds: ["recipe-roast", "recipe-autumn-salad", "recipe-honey-cake"],
      },
      {
        id: "holiday-dinner-inspiration",
        kind: "inspiration",
        order: 6,
        savedItemIds: ["saved-roast-reel"],
      },
    ],
  },
  {
    id: "upcoming-wedding",
    kind: "wedding",
    title: "Upcoming Wedding",
    startsAt: daysAhead(74, 19),
    spaceId: "personal",
    description: "Venue booked, catering signed. The 20%: guest list drives every other number.",
    nextAction: "Close the guest list and send it to the caterer.",
    createdAt: daysAgo(120, 20),
    /*
     * 74 days out and already in the preparation window: a wedding takes three
     * months of work, so it is asking for attention now. This is the case that
     * days-remaining alone gets wrong.
     */
    prepDaysBefore: 90,
    importance: "high",
    sections: [
      {
        id: "upcoming-wedding-tasks",
        kind: "tasks",
        order: 0,
        items: [
          { id: "wt1", title: "Send the final headcount to the caterer", done: false },
          { id: "wt2", title: "Confirm the music", done: true },
        ],
      },
      { id: "upcoming-wedding-guests", kind: "guests", order: 1, items: [] },
      { id: "upcoming-wedding-budget", kind: "budget", order: 2 },
      { id: "upcoming-wedding-links", kind: "links", order: 3, savedItemIds: [] },
    ],
  },
  {
    id: "parents-flight-georgia",
    kind: "family",
    title: "טיסת ההורים לגאורגיה",
    // Tomorrow morning, so the event is `critical` and the 24-hour reminder
    // has already come due — which is the state worth being able to look at.
    startsAt: daysAhead(1, 6),
    spaceId: "personal",
    description: "טיסה בבוקר מנתב״ג. הם לא עושים צ׳ק־אין לבד, אז זה עלינו.",
    nextAction: "לבצע צ׳ק־אין ולהדפיס כרטיסים.",
    createdAt: daysAgo(45, 12),
    prepDaysBefore: 14,
    importance: "high",
    /*
     * The 24-hour reminder from the brief. It is already due when the demo
     * loads (the flight is two days out), which is the point: the alert has to
     * be visible on the overview without anyone hunting for it.
     */
    reminders: [
      // Due this morning.
      { id: "flight-checkin", hoursBefore: 24, label: "לבצע צ׳ק־אין לטיסה" },
      // Due yesterday, so one reminder is overdue whatever hour the demo is
      // opened at — otherwise the alert surface is invisible before 06:00.
      { id: "flight-print", hoursBefore: 48, label: "להדפיס כרטיסים ואישור ביטוח" },
      // Already dealt with: a handled reminder stops asking.
      {
        id: "flight-packing-list",
        hoursBefore: 24 * 7,
        label: "לשלוח להורים את רשימת האריזה",
        handled: true,
      },
    ],
    sections: [
      {
        id: "flight-tasks",
        kind: "tasks",
        order: 0,
        items: [
          { id: "ft1", title: "צ׳ק־אין אונליין", done: false },
          { id: "ft2", title: "להדפיס כרטיסים", done: false },
          { id: "ft3", title: "לשלוח רשימת אריזה", done: true },
          { id: "ft4", title: "לוודא שהדרכונים בתוקף", done: true },
        ],
      },
      { id: "flight-notes", kind: "notes", order: 1, body: "טרמינל 3, דלפק C. להיות שם ב־03:30." },
      { id: "flight-links", kind: "links", order: 2, savedItemIds: [] },
    ],
  },
  {
    id: "cousin-flight-later",
    kind: "family",
    title: "Flight to Porto",
    startsAt: daysAhead(63, 11),
    spaceId: "personal",
    description: "Booked and paid. Nothing to do until much nearer the time.",
    createdAt: daysAgo(10, 15),
    /*
     * Sixty-three days out and deliberately carrying no preparation window —
     * this is the flight that must stay neutral. Same distance as the wedding
     * above, opposite treatment, and only the user could have told them apart.
     */
    sections: [
      { id: "porto-notes", kind: "notes", order: 0, body: "Aisle seats, row 14. Confirmation in email." },
    ],
  },
  {
    id: "dentist-checkup",
    kind: "custom",
    title: "Dentist — six month check",
    startsAt: daysAhead(41, 8),
    spaceId: "personal",
    createdAt: daysAgo(140, 9),
    // Small and distant: `low` keeps it out of the preparation window entirely,
    // so it stays quiet until the week before.
    importance: "low",
    prepDaysBefore: 30,
    sections: [],
  },
];
