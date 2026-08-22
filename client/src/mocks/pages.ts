import type { PageSummary } from "../types";
import { daysAgo, daysAhead } from "./relativeDates";

/**
 * Mock pages: projects, collections, checklists and one showcase.
 *
 * Recurring activity lives in `mocks/routines.ts` and dated occasions in
 * `mocks/events.ts` — they are their own entities now, not page fields.
 *
 * The prose below is user content, not UI copy: it is deliberately NOT
 * translated. See CLAUDE.md → "UI strings vs user content".
 */
export const MOCK_PAGES: PageSummary[] = [
  {
    id: "sorcol",
    type: "project",
    spaceId: "work-tech",
    status: "active",
    title: "Sorcol",
    description:
      "Sizing product and marketing site. The 20%: the size model is the product — the site only has to explain it and take an order.",
    outcome:
      "A shop where somebody picks their size once, trusts it, and the garment fits when it arrives.",
    doneSoFar:
      "Size model for M is finished and prints correctly. Core order flow renders end to end.",
    afterThat: "Price the print run and decide whether to make the first batch.",
    currentState:
      "Site and product both in development. Core flow renders, the first size prints correctly.",
    stoppedAt:
      "Mid-way through the size chart component — the M model renders, the rest are placeholders.",
    blocker: "Waiting on the models for the remaining sizes.",
    nextAction: "Review the models and print one trial size.",
    lastDecision: "One size model per product, not per variant. Simpler to print and to explain.",
    lastUpdatedAt: daysAgo(2, 21),
    boardOrder: 0,
    favorite: true,
    visibility: "private",
  },
  {
    id: "painter-platform",
    type: "project",
    spaceId: "work-tech",
    status: "active",
    title: "Painter Platform",
    description:
      "Portfolio platform for painters: artists register, upload work, and get a public gallery page.",
    outcome: "A painter can sign up alone and have a gallery worth sending to someone within an hour.",
    doneSoFar: "Auth, the painting list and the gallery view all work against the API.",
    afterThat: "Custom domains, once uploads are reliable.",
    currentState: "Auth and the painting list work end to end. Gallery view renders from the API.",
    stoppedAt:
      "Debugging the upload handler — the file reaches the server but the URL comes back empty.",
    blocker: "Stuck on the image upload flow.",
    nextAction: "Trace the image upload flow and find where it breaks.",
    lastDecision: "Store images on a CDN, keep only the URL in Mongo.",
    lastUpdatedAt: daysAgo(9, 16),
    boardOrder: 1,
    favorite: false,
    visibility: "private",
  },
  {
    id: "living-room-renovation",
    type: "project",
    spaceId: "home",
    status: "active",
    title: "Living Room Renovation",
    description:
      "Refresh the living room: storage, seating, lighting. Budget matters more than speed here.",
    outcome: "A room we actually sit in during the evening, with somewhere to put things.",
    doneSoFar: "Measured, wall colour chosen, and the alcove width confirmed twice.",
    afterThat: "Lighting — two lamps rather than the ceiling light.",
    currentState: "Measurements taken, wall colour decided, saving inspiration as it comes up.",
    stoppedAt: "Comparing two sideboards — the oak one fits, the walnut one is 8cm too wide.",
    nextAction: "Pick a sideboard and a sofa.",
    lastDecision: "Off-white walls, wood accents. No dark furniture in this room.",
    lastUpdatedAt: daysAgo(5, 20),
    boardOrder: 2,
    favorite: false,
    visibility: "private",
  },
  {
    id: "focus-app",
    type: "project",
    spaceId: "work-tech",
    status: "active",
    title: "Focus",
    description:
      "This app. A personal operating system: projects, routines, events, saved content and vision boards in one place.",
    outcome:
      "Open a page after six months and understand where things stand within a minute.",
    doneSoFar:
      "Routines, the project board, events, recipes, checklists, trips and the vision board all run locally.",
    afterThat: "One read path against the API, then the write path.",
    currentState: "Routines, the project board, events and the vision board all run on local storage.",
    stoppedAt: "Right after the vision board — nothing is wired to a server yet.",
    nextAction: "Wire one read path to the API and drop the mock module.",
    lastDecision: "Local storage behind a repository layer, so the API swap touches one layer.",
    lastUpdatedAt: daysAgo(0, 12),
    boardOrder: 3,
    favorite: true,
    visibility: "private",
  },
  {
    id: "new-computer",
    type: "project",
    spaceId: "work-tech",
    status: "paused",
    title: "New Computer",
    description:
      "Replace the current machine. Mostly development work, some video, occasional travel.",
    currentState: "Shortlist narrowed to three machines, prices tracked.",
    stoppedAt: "Waiting to see whether the next generation lands before spending.",
    nextAction: "Compare the options against real usage and budget.",
    lastDecision: "32GB RAM minimum. Anything less is a false economy for this work.",
    pausedReason: "Parked until the next generation is announced.",
    lastUpdatedAt: daysAgo(14, 11),
    boardOrder: 0,
    favorite: false,
    visibility: "private",
  },
  {
    id: "balcony-garden",
    type: "project",
    spaceId: "home",
    status: "paused",
    title: "Balcony Garden",
    description: "Turn the balcony into somewhere worth sitting: planters, shade, a small table.",
    currentState: "Planters bought, nothing planted.",
    stoppedAt: "Waiting for the end of the heat before planting anything.",
    nextAction: "Plant the herbs once the nights cool down.",
    pausedReason: "Too hot to plant. Restart in autumn.",
    lastUpdatedAt: daysAgo(26, 17),
    boardOrder: 1,
    favorite: false,
    visibility: "private",
  },
  {
    id: "home-office",
    type: "project",
    spaceId: "home",
    status: "completed",
    title: "Home Office Corner",
    description: "A desk, a chair and light that works after dark.",
    currentState: "Done. Desk mounted, chair replaced, two lamps installed.",
    lastDecision: "Desk against the window, not the wall. Worth the cable mess.",
    completedAt: daysAgo(33, 19),
    lastUpdatedAt: daysAgo(33, 19),
    boardOrder: 0,
    favorite: false,
    visibility: "private",
  },
  {
    id: "site-migration",
    type: "project",
    spaceId: "work-tech",
    status: "completed",
    title: "Old Site Migration",
    description: "Move the old portfolio off the legacy host before the renewal date.",
    currentState: "Done. DNS moved, old host cancelled, redirects verified.",
    lastDecision: "Rebuild rather than port. The old stack was not worth carrying forward.",
    completedAt: daysAgo(58, 15),
    lastUpdatedAt: daysAgo(58, 15),
    boardOrder: 1,
    favorite: false,
    visibility: "private",
  },
  {
    id: "kitchen-shelves",
    type: "project",
    spaceId: "home",
    status: "active",
    title: "מדפים במטבח",
    description:
      "לתלות מדפים מעל השיש במקום הארון העליון. המטרה: שהמטבח ירגיש פתוח בלי לאבד מקום אחסון.",
    outcome: "שני מדפי עץ יציבים, בגובה שנוח להגיע אליו בלי שרפרף.",
    doneSoFar: "מדדנו את הקיר, הורדנו את הארון הישן וסתמנו את החורים.",
    currentState: "הקיר מוכן. חסר לקנות מדפים ולוודא שהם נכנסים בין החלון לפינה.",
    stoppedAt: "באמצע ההשוואה בין מדף אלון 120 ס״מ למדף אורן 140 ס״מ.",
    nextAction: "למדוד שוב את המרחק מהחלון ולהחליט על אורך המדף.",
    afterThat: "לקדוח ולתלות — עדיף בשבת בבוקר, כשאין שכנים ישנים.",
    lastDecision: "עץ מלא ולא מלמין. יעלה יותר, אבל לא יתקלף מהאדים.",
    lastUpdatedAt: daysAgo(3, 18),
    boardOrder: 4,
    favorite: false,
    visibility: "private",
    // A wide picture — the shape most photographs of a wall arrive in.
    visionImageUrl:
      "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=1600&q=70",
    // One note of its own, so this page does not read through the legacy
    // adapter: `notes` being present is what switches the adapter off.
    notes: [
      {
        id: "note-shelves-measurements",
        title: "מידות",
        content:
          "מהחלון לפינה: 148 ס״מ. גובה מהשיש: 52 ס״מ.\nעומק מקסימלי לפני שזה מפריע לארונית: 24 ס״מ.",
        order: 0,
      },
    ],
  },
  {
    id: "oil-portrait",
    type: "project",
    spaceId: "personal",
    status: "active",
    title: "Oil portrait — grandmother",
    currentState: "Underpainting done, the face blocked in. Hands not started.",
    stoppedAt: "Mixing the shadow tone for the left cheek — it keeps going green.",
    nextAction: "Mix a warmer shadow with burnt sienna instead of viridian.",
    lastUpdatedAt: daysAgo(6, 16),
    boardOrder: 5,
    favorite: false,
    visibility: "private",
    /*
     * A tall picture, deliberately. A portrait reference is portrait-shaped,
     * and it is the case that breaks a preview box built for landscapes.
     */
    visionImageUrl:
      "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?auto=format&fit=crop&w=900&h=1400&q=70",
    notes: [
      {
        id: "note-portrait-palette",
        title: "Palette",
        content:
          "Titanium white, yellow ochre, burnt sienna, ultramarine, ivory black.\nNo viridian in skin — that is what went wrong last time.",
        order: 0,
      },
    ],
    progressImages: [
      {
        id: "progress-portrait-1",
        imageUrl:
          "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=70",
        note: "Underpainting, raw umber only.",
        capturedAt: daysAgo(20, 11).slice(0, 10),
        order: 0,
      },
      {
        id: "progress-portrait-2",
        // A deliberately broken address: the card must say the picture did not
        // load, and must never quietly substitute a drawing for it.
        imageUrl: "https://images.invalid.test/portrait-week-three.jpg",
        note: "Face blocked in. This address is wrong — fix it.",
        capturedAt: daysAgo(6, 16).slice(0, 10),
        order: 1,
      },
    ],
  },
  {
    id: "weekend-shed",
    type: "project",
    spaceId: "home",
    status: "active",
    title: "Fix the shed door",
    // No description, no outcome, no notes, no pictures — on purpose. This is
    // the project that proves a page with nothing to say renders nothing.
    nextAction: "Buy two hinges, 75mm.",
    lastUpdatedAt: daysAgo(9, 14),
    boardOrder: 6,
    favorite: false,
    visibility: "private",
    notes: [],
  },
  {
    id: "before-a-flight",
    type: "checklist",
    spaceId: "trips",
    status: "active",
    title: "Before a Flight",
    description: "Everything that has to happen the day before and the morning of a flight.",
    currentState: "Documents and packing done, home checks left.",
    nextAction: "Check in online and set an alarm.",
    lastUpdatedAt: daysAgo(1, 22),
    favorite: true,
    visibility: "private",
    dueAt: daysAhead(6, 7),
  },
  {
    id: "trip-north",
    type: "checklist",
    spaceId: "trips",
    status: "active",
    title: "Trip North",
    lastUpdatedAt: daysAgo(4, 19),
    favorite: true,
    visibility: "private",
    dueAt: daysAhead(11, 8),
    /*
     * Notes instead of project rubrics. "Why does this page exist" has no
     * useful answer for a packing list, and the old screen asked anyway.
     */
    notes: [
      {
        id: "note-north-info",
        title: "מידע חשוב",
        content:
          "השער לחניון נסגר ב־20:00. אחרי זה חונים בכניסה ועושים 300 מטר ברגל.\nאין קליטה בשטח הקמפינג עצמו — רק בכביש הגישה.",
        order: 0,
      },
      {
        id: "note-north-who-brings",
        title: "מי מביא מה",
        content: "אנחנו: אוהל, שק שינה, גריל.\nיואב ונועה: צידנית, קרח, פחמים.\nדנה: קפה ובורקס לבוקר.",
        order: 1,
      },
      {
        id: "note-north-weather",
        title: "מזג אוויר צפוי",
        content: "18–24 ביום, יורד ל־11 בלילה. לקחת שכבה חמה גם אם לא מרגישים צורך בצהריים.",
        order: 2,
      },
    ],
  },
  {
    id: "pizza-recipes",
    type: "collection",
    spaceId: "cooking",
    status: "active",
    title: "Pizza Recipes",
    description: "Doughs, hydration notes and bake times that actually worked.",
    currentState: "62% hydration is the current default. Two doughs still untested.",
    nextAction: "Try the cold-ferment dough over a weekend.",
    lastDecision: "62% hydration, 48h cold ferment. Everything else was worse.",
    lastUpdatedAt: daysAgo(7, 21),
    favorite: true,
    visibility: "private",
  },
  {
    id: "holiday-recipes",
    type: "collection",
    spaceId: "cooking",
    status: "active",
    title: "Holiday Recipes",
    description: "The dishes that actually get made for a holiday meal, with the notes that matter.",
    currentState: "Four keepers. The rest were tried once and not repeated.",
    nextAction: "Write down the roast timing before next time.",
    lastUpdatedAt: daysAgo(11, 20),
    favorite: false,
    visibility: "private",
  },
  {
    id: "home-inspiration",
    type: "collection",
    spaceId: "home",
    status: "active",
    title: "Home Inspiration",
    description: "Saved rooms, materials and colour combinations worth stealing from.",
    currentState: "Mostly living room material at the moment.",
    nextAction: "Group the saved images by room.",
    lastUpdatedAt: daysAgo(6, 20),
    favorite: false,
    visibility: "private",
  },
  {
    id: "north-places",
    type: "collection",
    spaceId: "trips",
    status: "active",
    title: "Places Up North",
    description: "Springs, viewpoints and food stops worth the detour.",
    currentState: "Four places saved, two already visited.",
    nextAction: "Add the spring from last summer before it is forgotten.",
    lastUpdatedAt: daysAgo(12, 18),
    favorite: false,
    visibility: "private",
  },
  /*
   * Two learning pages. They use the ordinary project mechanisms — notes, a
   * checklist, saved resources, "where I stopped" — plus four facts of their
   * own. There is no lesson model and no score, which is the whole point.
   */
  {
    id: "learning-hebrew-calligraphy",
    type: "learning",
    spaceId: "personal",
    status: "active",
    title: "כתב יד וקליגרפיה",
    description: "ללמוד לכתוב יפה בעברית, בעיקר לכרטיסי ברכה.",
    currentState: "עברתי על שלושת התרגילים הראשונים בחוברת.",
    stoppedAt: "באמצע תרגיל האותיות העגולות — ס, ם, ט.",
    nextAction: "לחזור על דף האותיות העגולות פעמיים ברצף.",
    learning: {
      level: "beginner",
      goal: "לכתוב ברכה שלמה בכתב יד בלי להתבייש",
      method: "חוברת תרגול + סרטונים ביוטיוב",
      lastStudiedAt: daysAgo(9, 22),
    },
    lastUpdatedAt: daysAgo(9, 22),
    favorite: false,
    visibility: "private",
  },
  {
    id: "learning-typescript-depth",
    type: "learning",
    spaceId: "work-tech",
    status: "active",
    title: "TypeScript in depth",
    description: "Generics, conditional types and the bits I keep guessing at.",
    currentState: "Comfortable with generics; conditional types still by trial and error.",
    stoppedAt: "Chapter on mapped types — got as far as `as` clauses and stopped.",
    nextAction: "Rewrite one real type in the app using a mapped type instead of a union.",
    learning: {
      level: "intermediate",
      goal: "Stop reaching for `any` when a type gets awkward",
      method: "A book, plus rewriting real types in this repo",
      lastStudiedAt: daysAgo(48, 23),
    },
    lastUpdatedAt: daysAgo(48, 23),
    favorite: false,
    visibility: "private",
  },
  {
    id: "selected-work",
    type: "showcase",
    spaceId: "work-tech",
    status: "paused",
    title: "Selected Work",
    description: "The public view: a short, clean list of projects worth showing.",
    currentState: "Two projects picked, copy not written yet.",
    stoppedAt: "Drafting the Sorcol paragraph — three attempts, none of them good.",
    nextAction: "Write one paragraph per project.",
    pausedReason: "Waiting until Sorcol has something worth showing.",
    lastUpdatedAt: daysAgo(30, 15),
    boardOrder: 2,
    favorite: false,
    visibility: "public",
  },
];
