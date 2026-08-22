# CLAUDE.md — Focus

Read this file before every development task in this repository.
It is a short, stable operating manual. Changing state and history belong in
[`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md), not here.

---

## Product vision

Focus is a personal operating system. One place to keep projects, hobbies,
routines, events, checklists, recipes, trips, links and notes.

The point is **returning**. A user should be able to disappear from a topic for
months — because of a wedding, a job, a trip — come back, open its page, and
understand within minutes:

- why the page exists
- what the current state is
- what is already done
- where they stopped, and what is blocking them
- what the next action is
- which decisions were already made
- which links, videos and notes were saved

This is **not** an enterprise task manager, and not a Notion or Monday clone.

## Pareto principles

- The critical 20% comes before all secondary information — on every screen.
- Current state, blocker and next action are the three facts that matter most.
- If a section does not help someone returning after six months, it does not
  belong on the dashboard.
- No vanity metrics, no KPI theatre, no dashboard analytics for their own sake.
- Fast to read, fast to edit, calm to look at.

## The 80/20 rule

**A small number of shared mechanisms, covering most of a life, without the app
becoming complicated.**

Focus is not Notion plus Pinterest plus a calendar plus a trip planner. When a
new need appears, express it with a mechanism that already exists:

`Checklist` · `Status board` · `Saved items` · `Tags` · `Notes` · `Images` ·
`Documents` · `Timeline` · `Completion calendar` · **references between
entities**.

Two consequences, both binding:

- **Never build `TripChecklist`, `EventChecklist` and `ProjectChecklist`.** One
  `Checklist` model, one component, one provider. The same goes for boards,
  cards and galleries.
- **Never add a capability that no described flow needs.** A feature nobody
  asked for still has to be kept working in two languages, both directions and
  five widths, forever.

The counterweight: do not force a shared component where the behaviour is
genuinely different. A cooking column and a project column share `BoardColumn`
because a column behaves identically; the cards do not, and are separate.

## Entities

Focus is built from **five general models**, not one system per feature. If a
new need can be expressed with an existing model, it must be.

| Entity | Lives in | What it is |
|---|---|---|
| `PageSummary` | `types/page.ts` | Projects, collections, checklists, showcases |
| `Routine` | `types/routine.ts` | Anything recurring: gym, laser, car service |
| `FocusEvent` | `types/event.ts` | Anything with a date: birthday, holiday, wedding |
| `SavedItem` | `types/savedItem.ts` | One saved thing: link, image, video, recipe, product, document, note |
| `VisionBoard` | `types/visionBoard.ts` | A collage of tiles pointing at pictures and goals |
| `Checklist` | `types/checklist.ts` | Grouped, tickable lists — shared by trips, projects and events |
| `CollectionEntry` | `types/savedItem.ts` | Contents of a collection: recipes **and** places, one model |
| `Trip` | `types/trip.ts` | A trip with destinations, day plans, food, bookings and outfits |
| `ProjectNote` | `types/page.ts` | One free-form block on a page: a title the user chose, and text |
| `ScheduledItem` | `types/scheduled.ts` | One dated obligation: an appointment, a renewal, a call to make |
| `QuickLogEntry` | `types/quickLog.ts` | One line the user jotted down, with a time on it |
| `FamilyProfile` | `types/family.ts` | A person or an animal worth remembering things about |
| `Commitment` | `types/finance.ts` | An insurance policy or a subscription — one model, two kinds |
| `MoneyEntry` | `types/finance.ts` | One line in or out |
| `Medication` | `types/health.ts` | A medicine or vitamin, exactly as the user was told it |
| `LeisureItem` | `types/leisure.ts` | Something to do: a film, a book, a place, an idea |
| `Menu` | `types/menu.ts` | A meal that comes round again, and what to buy for it |
| `LearningResource` | `types/page.ts` | How one learning page files one saved item: its level, a note, a position |
| `EntityReference` | `types/reference.ts` | A weak pointer from one thing to another |
| `RecurrenceRule` | `types/recurrence.ts` | How often something repeats — six kinds, no RRULE |

**Page types.** `project` · `collection` · `checklist` · `routine` · `event` ·
`showcase` · `learning`. The union lives in `types/page.ts` and infrastructure
must know all seven, even where behaviour is not built.

**Project status is three values**: `active` · `paused` · `completed`.
**Blocked is not a status.** A project can be active *and* blocked, so being
stuck is a separate attribute (`blocker`, read through `isBlocked(page)`).
Never add a fourth column or a fourth status for it.

**Routines separate plan from history.** A `RoutineScheduleRule` produces
*planned* days (`everyNDays` · `weekdays` · `monthly` · `none` ·
`reminderOnly`); `completions` records what actually happened, as calendar days
(`YYYY-MM-DD`), never timestamps. A missed day is never rendered as a failure.

**Events are sections, not fields.** A template seeds a starting set of
sections; the user may rename, reorder, add and remove any of them. A section
stores its `kind` and only stores a title once renamed — that is what keeps a
template from writing one language into stored data.

**A project page is notes, not rubrics.** The page used to render nine fixed
headings — why this exists, what success looks like, what is already done, and
after that, the last decision. That suited a long build and suited nothing else:
"replace the sofa" needs a picture, some measurements and three product links,
and being asked "what does success look like?" only produces filler. The body of
a page is now `ProjectNote[]`, and a project with nothing to say carries none.

**Four facts stay structured fields**, and only four: `currentState`,
`stoppedAt`, `blocker` and `nextAction`. They earned it by being read somewhere
other than the page — the overview's "needs attention" list is `blocker`, its
"pick up where you left off" list is `stoppedAt`, every board card prints
`nextAction`, and `isBlocked()` is defined in terms of `blocker`. Turning those
into prose would empty half the overview. Everything else is a note.

**Notes distinguish "never edited" from "empty".** `notes === undefined` means
the page has never been edited, and `notesForPage` reads the legacy fields
instead — that is the migration, and it is an *adapter*, so nothing is destroyed
and old data still opens intact. `notes === []` means the user deleted every note
and must stay empty. Never collapse the two, and never default `notes` to `[]` in
a migration: that would silently wipe every project written before the change.

**Note templates fill in a title and a hint, and nothing else.** A template
seeded note stores a `titleKey`, which is dropped the moment the user renames it
— the same rule as event sections and checklist groups, so a template writes no
language into stored data.

**A project has two kinds of picture**: `visionImageUrl` (where it is going) and
`progressImages` (where it is). Both are addresses only, both may instead point
at a `SavedItem`, and both may be a page link with no picture behind it — a
Pinterest board is kept as `linkUrl` and shown as a link. No thumbnail is ever
invented for it.

**One saved item, many contexts.** `SavedItem.contextIds` lists every page,
event or routine that references it. Never copy a saved item between contexts:
a recipe linked to a holiday is the same entity as the recipe in the collection.

**Recipe status is two fields, not three values.** `status` is
`want_to_try | tried`; `recommended` is a separate boolean. A recipe you liked
is a recipe you have tried, so recommending must never be able to un-try
something. The cooking board's three columns are a *view* over that pair — see
`lib/recipes.ts`, `statusForGroup`.

**Tags are the user's own words.** Free text on a `CollectionEntry`, never
translated, never prefixed with `#`, and never called hashtags — there is no
global namespace here. They are searchable: typing a holiday name finds the
recipes filed under it.

**A checklist page is not a small project.** Pages of type `checklist` render
`ChecklistPageView`, not the project screen: notes, then the inspiration the
user saved, then the list — one continuous page, nothing behind a tab. The two
things somebody opens a packing list to do are look at the gear they saved and
tick things off, and a tab hides one of them behind the other. It is **not** a
second trip planner; a real trip is a `Trip` at `/trips/:id`.

**An event's urgency is not its days remaining.** A flight in two months needs
nothing yet; a 60th birthday in two months needs a hall booked this week. Only
the user can tell those apart, so they say how long preparation takes
(`prepDaysBefore`) and how much it matters (`importance`). `urgencyOf` in
`lib/eventTiming.ts` is the single judge, and returns one of five states:
`neutral` · `preparing` · `soon` · `critical` · `done`. An event that declares no
preparation window stays quiet until the week before.

**Reminders are local, and say so.** There is no server and no push
infrastructure, so a reminder is something the app shows you the next time you
open it. Every surface that renders one also renders that limitation. Never
imply a notification will arrive while the tab is closed.

**Checklists are keyed by owner** (`project:sorcol`, `trip:japan-2027`), so no
entity carries a checklist id. Built-in template groups and items store a
translation *key*; the moment the user edits one it becomes their own text and
the key is dropped. Same rule as event sections.

**Trips own their destinations, day plans, food and outfits.** They are never
read without the trip, so keeping them together means one write per edit instead
of four that could disagree. Editing forms build the new array and call
`updateTrip` once, rather than adding a narrow mutator per collection.

**Ongoing management is one area, not six.** Insurance, subscriptions, income
and expenses, appointments, medicines, shopping and menus all live at `/manage`
behind a filter (`?view=money`). Six top-level menu entries for six kinds of
paperwork is the sprawl this app exists to avoid: they are one question — what
does the running of my life need from me — asked five ways.

**A scheduled item is the primitive underneath most of it.** A vet visit, a call
to a grandparent, an annual renewal, a follow-up blood test and an unpaid bill
are the same shape: a title, a date, a repetition, a status. Building an
`Appointment`, a `ContactReminder`, a `Renewal` and a `Bill` would have been four
models with the same five fields and four ideas of what "snoozed" means. What a
category genuinely needs beyond that sits in an optional named block
(`appointment`, `money`), so a reminder stays four fields long and the type never
becomes a god object.

Where an existing model already fits, it wins: recurring *activity with a
history* is a `Routine`, and a dated *occasion with sections* is a `FocusEvent`.
A `ScheduledItem` is the thing neither was — a single obligation with a due date
and no ceremony.

**`snoozed` is not "done later".** A snoozed item is still owed; it has been told
to stop asking until a date. `cancelled` is the user saying it will never happen,
which is different from having done it. Collapsing either into `completed` puts
things in "done" that were never done.

**Recurrence covers the eighty percent and stops.** Once · daily · weekly ·
monthly · yearly, each with an interval, plus `custom` — "I will tell you the
next date myself". There is no RRULE parser and there must not be one: an
irregular check-up is not an incomplete recurrence rule, it is a different kind
of thing. Completing a recurring item **advances it and keeps it active**;
completing a `custom` one completes it, because inventing the next date is the
opposite of what the user asked for.

Arithmetic lives in `lib/recurrence.ts` and counts from the **anchor**, never
from today: a monthly charge on the 4th stays on the 4th however late it is
ticked off, and a 31st clamps into February rather than overflowing into March.

**Birthdays are derived, never stored.** A birth date is a fact; the birthday is
arithmetic on it. `birthdayEventFor` computes the *next* occurrence on every
read, so there is nothing to duplicate on a refresh or a migration and no sweep
to create next year's. An event the user actually built — with a venue, a gift
list and a budget — claims the `birthday:<profileId>` id and the computed row
stands down, because theirs holds work and the computed one holds a date theirs
already has. A stored event in that slot is **not** derived: `event.derived`
tells them apart, never the id, or the real one would lose its title and its
screen.

**A family profile is not a family tree.** Four types — adult, child, baby, pet —
and one model, because a dog needing vaccinations, a vet and some documents is
the same *shape* as a grandmother needing appointments, medicines and a shopping
list. There are no relationships between profiles and no genealogy:
`relationship` is a word the user typed, because "Mum" is all anybody needs
stored. Sections are opt-in and a new profile starts with three or four; ten
empty headings is the noise this app removes.

**Deleting a profile does not cascade by default.** Appointments, medicines and
log entries point at it by weak reference. Removing "Luna" must not quietly empty
next Tuesday. The confirmation counts the affected records and offers the cascade
as an explicit choice.

**Focus records; it never interprets.** This is the hard boundary around
everything medical, financial and infant-related:

- No dose is suggested, calculated or validated. `dosage` is free text on
  purpose — parsing it would be the first step towardscalculating with it.
- No reaction is assessed. A tasting note says what the parent observed, and the
  app repeats it back. There is no reaction taxonomy and must not be one.
- No vaccination schedule is generated from an age. The user enters what a
  professional told them.
- Nothing connects to a bank. Income and expenses are what somebody typed.
- Full card numbers and passwords are never stored. `paymentMethod` is a memory
  jog ("the joint card"), not a payment credential.

The disclaimer appears **once**, where the claim is made — the health panel, the
medication form, the baby sections — never on every row. A caution printed twelve
times is furniture.

**Money is three numbers and a list.** What came in, what went out, what is still
unpaid, plus the charges about to land. `paid` is separate from the date because
"the invoice is dated the 1st" and "I have actually paid it" are different facts.
A yearly commitment counts as a twelfth of itself per month; a one-off counts as
zero, or the monthly figure would jump every time a single payment is recorded.

**A shopping list is a checklist page.** Not a new entity: `type: "checklist"`
plus a checklist keyed to it, which is what a packing list already was. Ticking,
groups, templates, progress and the detail screen all come free.

**A menu never touches a list on its own.** Generating shopping is an explicit
action with a count in front of it, and the merge is idempotent: an item already
on the list — ticked or not — is left exactly as it is, two dishes needing eggs
produce one line, and the menu remembers *which* list it wrote into so
regenerating merges rather than creating a second copy. The failure this prevents
is concrete: standing in a supermarket reading a list with everything on it
twice.

**A template is a starting point and nothing else.** Using one produces fresh
ids; editing the result never reaches the template, and editing the template
never reaches a list somebody is already shopping from. The picker is shared
across every domain — recommended, recently used, then all — and nothing appears
in two groups at once.

**Learning is a page type, not a course platform.** `type: "learning"` carries
four facts — level, goal, method and `lastStudiedAt`. That last one earns its
place by being the thing a page cannot derive: `lastUpdatedAt` moves when you
tidy the notes, and tidying is not studying. No lessons, no grades, no tests, no
completion percentage: a percentage of "learning calligraphy" would be a
made-up number.

**A learning page is a lens, and the level sets it.** `beginner` ·
`intermediate` · `advanced`, and one control at the top of the page decides what
everything below it shows — the notes, the practice list and all four kinds of
material. Six separate filters would drift out of step; one does not. The filter
lives in the URL (`?level=beginner`), which is what will make "share how I did
beginner" possible later without redesigning the screen.

**Material with no level is general, and general shows at every level.** Absent
means "applies throughout", not "not filed yet". The alternative — hiding
unlevelled material unless "all levels" is selected — makes the dictionary link
and the "where I stopped" note vanish exactly when somebody narrows down to look
for them. The UI writes "general" beside such an item so the two are never
confused. `matchesLevel` in `lib/learning.ts` is the single judge.

**Learning material is `SavedItem`, filed by the page.** Links, documents,
pictures and videos are one storage model, not four; which panel an item lands
in comes from its `kind`. The *level* is not on the item — it is a
`LearningResource` record on the page (`learning.resources`), because the same
video can be beginner material on one page and the only advanced thing on
another. Removing something from a learning page writes a tombstone
(`detachedResourceIds`) and never deletes the `SavedItem`: "take this off my
English page" and "delete this video" are different requests.

**Nothing is uploaded, ever.** A document is a link to a document and the screen
says so, once, on the documents panel. A picture is an address with a preview,
and a broken one shows the neutral "the picture did not load" placeholder rather
than local artwork. A video is a link with a platform label — no thumbnail is
fetched or invented.

**A learning subject is a `ProjectCategory` in its own list.** Same model as the
projects board, a separate slice (`focus.learningTopics`, seeded with languages ·
career · leisure), stored in the same `PageSummary.categoryId`. That is safe
because the board only ever looks at pages of type `project`. One model, two
lists; not one model, one list.

**Templates are scoped to their domain, and a learning page offers none at
creation.** This is a rule with a scar behind it: the learning page used to show
the app-wide checklist picker, so "start a study plan" could produce a weekly
supermarket shop — fruit, dairy, bakery — on a page about learning English. The
answer was not a better picker. Creating a learning page creates a learning page
and nothing else; the practice list is empty until the user writes it; and note
starting points are offered *when a note is being written*, from a learning-only
set (`LEARNING_NOTE_TEMPLATES`), because a template that fills in a title costs
nothing and a template that fills in content is somebody else's content.

A shopping list already sitting on a learning page is **not** deleted by a
migration. `isForeignChecklist` recognises it, the page names it for what it is,
and removing it is the user's decision behind a confirmation.

**"What suits right now?" is arithmetic, not AI.** Hard constraints filter (a
two-hour film does not "partially fit" ninety minutes), what is left is ranked,
and **exactly one** thing is offered with at most two reasons. Returning nothing
is a real answer and the screen renders it as one — an app that always has a
suggestion is an app whose suggestions mean nothing. Being offered, accepted or
dismissed all leave a mark on the item, so the same idea cannot come back every
evening for a week. Telling it you are swamped silences it. It never pops up.

**The overview answers "what needs me now?" by leaving things out.** Focus can
see insurance, subscriptions, medicines, appointments, birthdays, pet treatments,
shopping lists, learning pages and evening ideas; showing all of that would be a
worse inbox than the one the user already ignores. A row appears only once it has
*become* relevant — its reminder window has opened, its date is close, or it is
already late. An insurance renewal eight months out is not on that screen. Five
groups (today · this week · waiting on you · coming up · comes round again), three
rows each before "show more", and a group with nothing in it renders nothing.

The bell counts only what is due today or already owed. A badge that always shows
a number is furniture.

**Search shows a health record's title and category, and nothing else.** It still
*matches* on the note, the location and the recorded result — you can find the
thing — but a results list is a surface somebody can read over your shoulder, and
a blood-test result does not belong in one.

**An outfit is a reference, not a wardrobe.** `TripOutfit` points at a picture
(an address, a saved item, or a page link with no picture at all), lists the
days it is assigned to, and carries a short list of garment names. Chosen looks
feed **packing suggestions**, merged by normalised name with quantities taken as
the maximum, not the sum — three looks needing walking shoes need one pair.
Nothing reaches the packing checklist without being asked for, and once an item
is on the list it is an ordinary item: changing a look later never deletes it.

---

## Repository structure

```
focus/
├── CLAUDE.md              ← this file
├── package.json           ← convenience scripts only (no workspaces)
├── scripts/check-links.mjs ← fails on placeholder destinations
├── docs/
│   ├── PROJECT_STATE.md   ← living state: update at the end of every task
│   └── ARCHITECTURE.md    ← system shape, boundaries, future auth
├── client/                ← React + TypeScript + Vite + Bootstrap
│   └── src/
│       ├── types/         ← shared domain types (see "Type placement")
│       ├── i18n/          ← i18next setup, useLocale, locales/{en,he}/*.json
│       ├── mocks/         ← seed data, deleted when the API lands
│       ├── lib/           ← pure logic: selectors, Intl formatting, schedules,
│       │   └── storage/     board rules, event templates + the localStorage shim
│       ├── repositories/  ← the persistence seam (see "Storage layer")
│       ├── state/         ← one provider per domain slice
│       ├── assets/thumbs/ ← local SVG artwork for saved items and vision tiles
│       ├── components/    ← UI: ui/ primitives, layout/ shell
│       ├── features/      ← sections/ (shared) + dashboard/, space/, page/,
│       │                    projects/, routines/, training/, events/, vision/,
│       │                    cooking/, trips/ (incl. outfits), checklist/,
│       │                    edit/, save/, search/
│       └── legacy/        ← archived pre-Focus "artfolio" code, NOT maintained
└── server/                ← Node + Express + TypeScript
    └── src/
        ├── lib/           ← logger, AppError
        ├── middleware/    ← requestId, 404 + error handlers
        ├── routes/        ← health.route.ts
        └── legacy/        ← archived pre-Focus code, NOT maintained
```

`legacy/` on both sides is excluded from `tsconfig` and from ESLint. Do not
import from it, do not fix it, and do not delete it without being asked.

## Responsibilities

**Frontend** — all rendering, routing, client-side filtering and search, and
presentation logic. It owns no persistence.

**Backend** — HTTP surface, validation, authorisation, and the only path to the
database. It derives identity from a verified token, never from request input.

**Database (later)** — MongoDB Atlas via Mongoose. Not connected yet.

## Data flow

```
React component
  → (later) TanStack Query
    → HTTP /api/*
      → Express route → validation → controller → service
        → Mongoose model → MongoDB Atlas
```

Today the chain stops at the repository layer: providers read
`client/src/repositories/`, which read `localStorage`, seeded from
`client/src/mocks/`. There is **no** API call and no database.

## View mode and edit mode

**A screen opens in view mode.** Events and recipes default to reading, not
editing. Before this rule, opening a birthday showed a delete button, two
reorder arrows and an open textarea beside every line — which reads as a
content management system, not as a plan for a dinner.

- **View mode** shows content, and the controls that are not structural:
  checkboxes stay tickable, and one-tap facts ("made it today", "mark today's
  session") stay available. Ticking something off is not editing.
- **Edit mode** is entered by one explicit action next to the title, and only
  then are rename, reorder, delete, add and open inputs shown.
- Edits save through the repository as they are made, so the exit is
  **"Done editing"**, not a Save button that pretends to do something. A small
  note says where the data goes. A modal that collects a draft — the trip
  editor — is the exception: there, Cancel genuinely discards.

## View mode in the newer areas

The rule is unchanged and worth restating for the areas that now depend on it:
**recording something that just happened is not editing.** In view mode a
profile, a manage screen or a menu keeps its one-tap facts live — mark a
reminder done, tick a dose, log a feed, snooze something, mark a bill paid — and
shows no rename fields, no reorder arrows and no delete buttons. Those appear
behind the one explicit edit action beside the title, and the exit is "Done
editing" because the edits saved as they were made.

The exception stays the same: a dialog that collects a draft — the scheduled
item, the commitment, the medication, the profile — genuinely discards on Cancel.

## Testing

`npm test` runs a real Vitest suite. It is **not** a placeholder any more, and
nothing may report it as passing without running it.

What is covered is the logic in `client/src/lib` plus the migrations: recurrence
arithmetic, event urgency and preparation windows, scheduled due/snooze/complete
transitions, birthday derivation and de-duplication, the relevance engine,
template cloning and independence, menu→list merging, packing normalisation, the
project-note adapter, family selectors, medication schedules, money arithmetic,
storage migrations, translation parity and source hygiene.

What is deliberately **not** covered is rendering. There is no jsdom and no
component test. Everything that can hide information, create a duplicate or fire
a reminder on the wrong day lives in those pure functions; a suite that rendered
every card would be slower, more brittle, and would still not catch any of it.

Tests live beside what they test (`lib/recurrence.test.ts`) and compile under
`tsconfig.test.json`, the only project with Node's types — which is what stops
`fs` becoming reachable from a component.

## Modal layout

**A modal's body scrolls; its header and footer never leave.**

Every dialog wraps its header, body and footer in one `<form>`, so a single
submit handler covers the whole thing and Enter works from any field. That form
sits between `.modal-content` and the three parts, and it is what broke
Bootstrap's `scrollable`: the body was no longer a flex item of the content box,
so it grew to fit its content and the footer — with the save button in it — was
clipped below the viewport with no way to scroll to it. Saving worked; *reaching*
Save did not.

The fix is in `index.css` and applies to **every** modal, not only the ones
marked `scrollable`:

- `.modal-content` is a flex column, capped with `dvh` — `vh` keeps reporting the
  full screen when a phone keyboard opens, and puts the footer back underneath it.
- `.modal-content > form` is layout-transparent: it passes the height constraint
  through instead of absorbing it.
- `.modal-body` gets `flex: 1 1 auto; min-block-size: 0; overflow-y: auto`.
  `min-block-size: 0` is the part that lets it shrink below its content.
- `.modal-header` and `.modal-footer` are `flex: 0 0 auto`.

A short modal is unaffected: the body only scrolls once it has to. Background
scroll stays locked, focus stays trapped, and Tab must reach the submit button.

**A preview never decides how tall a dialog is.** `.focus-url-preview img` is
capped at 240px and uses `object-fit: contain` — the picture is being *checked*,
not displayed, and cropping the middle out of a tall image is the wrong answer to
"is this the right address?". A broken address shows a compact placeholder and
must not grow the dialog.

## Adaptive section layout

Sections lay out in `.focus-sections`, a two-column grid on a wide screen.

- A section holding one or two cards takes `span="auto"` and **shares a row**
  with the next short one. Anything larger takes the row.
- The width is a layout decision, so `SPACE_SECTIONS` may state it per section
  (`{ kind, span }`). That is how Work & Tech reads as "stuck / active" then
  "parked / recently saved", and how Home pairs inspiration with saved
  products instead of leaving one of them alone.
- Card grids inside a section use `auto-fit` with a per-item cap: a row fills,
  and a single card never stretches across the screen.
- Cards are as tall as their contents (`align-items: start`). Stretching a
  two-line card to match a neighbour full of checklist items leaves a column
  of empty white, which is what made the Trips overview look broken.

## Compact by default

**A card is for grouping; a row is for a fact.** A subscription is a name, a
price and a date. Wrapping three facts in a bordered box with 24px of padding
produced screens where six items filled a laptop display and most of it was
white, which is what `<CompactRow>` exists to undo.

- **Nothing has a `min-height`.** A two-line row is two lines tall, and no card
  is ever stretched to match a neighbour.
- **A detail line is clamped to one line** in any list view. A list is for
  finding the thing; the detail screen is one tap away.
- **Secondary actions are quiet, not hidden.** They fade in on hover *and* on
  focus, and stay in the tab order and the accessibility tree at all times.
  Below `md`, and on any device without hover, they are simply always visible —
  a control reachable only by hovering is unreachable on a phone.
- **Long lists disclose progressively.** `<ShowMore>` reveals the rest and says
  how many there are. There is no pagination anywhere: a personal data set never
  gets big enough to need one, and pages hide things behind arithmetic.
- **A filter strip is chips above `sm` and a `<select>` below it.** Exactly one
  is in the accessibility tree at a time. A horizontal chip strip at 320px either
  overflows the viewport or becomes a scroll surface with no scrollbar.
- **Empty sections still render nothing**, and that rule now covers panels: a
  profile section the user switched on but has not filled shows nothing in view
  mode.

**Class names are checked for collisions before they are reused.** `.focus-row`
already belonged to the overview's attention rows — a grid of bordered cards —
so the dense row is `.focus-dense-row`. Reusing the name put two rule sets in
conflict and every row hugged its own content instead of filling the list, which
looked like a spacing bug and was a naming one.

## Page headers

Every screen's heading comes from `<PageHeader>`, and the primary action sits
**next to the title**, not at the far edge of the container. Pushing it across
1200px with `space-between` is technically the same row and visually two
unrelated things. The pair wraps rather than stretching, and on a phone the
action takes its own full-width line.

## Links

**Never render a link the app cannot honestly open.**

A card pointing at `example.com/cooler` looks like a working link and is not
one: it takes the user out of the app and lands them on a parking page.

- `lib/links.ts` is the only judge of what may be opened. `isExternalUrl`
  rejects empty values, `#`, relative paths, non-`http(s)` schemes and
  placeholder hosts.
- A saved item with no real destination has **no** `url` at all. Its card opens
  an internal preview and shows a small "no link" badge.
- Every external destination goes through `<ExternalLink>`: new tab,
  `rel="noopener noreferrer"`, an icon, and a screen-reader note.
- `npm run check:links` fails the build if a placeholder host or a `url: "#"`
  is written into `client/src` again. Run it with the other checks.

## Images

Only the **address** of a remote picture is stored — never the bytes, never a
data URI. A board with thirty pictures stays a few kilobytes and a picture the
user removes is genuinely gone.

**A failed picture never becomes a drawing.** `<BoardImage>` shows a neutral
placeholder that says the picture did not load, with the address still editable.
Substituting local artwork for the photograph somebody chose would look like
their photograph and hide the fact that the link is broken. Artwork is only ever
used for items that were *seeded* with it and have no URL of their own.

`<UrlImageField>` is the one field for entering such an address: it previews as
you type, refuses anything that is not `http(s)`, and says so inline. Loading
the image is the only honest test that an address points at one — nothing is
fetched for metadata, from any service. A page link that has no picture (a
Pinterest board, say) is kept as a link and shown as one; it is not given a
stand-in image.

## Storage layer

`localStorage` is a **development stand-in for the API**, not the architecture.

- `lib/storage/localStore.ts` is the only module that touches
  `window.localStorage`. Every call is wrapped — storage throws in private mode.
- Every payload is written inside `{ v, data }`. Bump `STORAGE_VERSION` when a
  stored shape changes; mismatched payloads are discarded, never guessed at.
- `lib/storage/keys.ts` holds every key, all under the `focus.` namespace.
- `repositories/` exposes one `Repository<T>` per slice (`load` / `save`). When
  the API lands, these five become queries and mutations and **no screen
  changes**.
- Components never read or write storage. They use a provider, which uses a
  repository. Pure rules (schedules, board order, templates) live in `lib/` and
  take data as arguments.
- Only the *diff* against seed data is stored for pages (`PageOverride`), so the
  demo data can change between versions without freezing on a user's machine.

**Migrations.** `createRepository(key, seed, migrate)` runs `migrate` on every
load, over stored *and* seeded data. That is deliberate: it is the one place
older data is brought up to shape, and running it over the seed too means the
migration is exercised on a first visit rather than months later on somebody
else's machine. A migration must fill in defaults and must **never** drop a
field, change an id, or clear a `focus.*` key.

## Type placement

Domain types live in `client/src/types/` for now. There is no npm workspace in
this repository, and adding one to share four interfaces was judged more risk
than value. When the API is built, move `types/` to a `shared/` package and
import it from both sides. This is the single most likely refactor.

---

## Internationalization

Focus ships in **Hebrew (default) and English**, from one codebase and one
layout. Setup lives in `client/src/i18n/`.

**File structure** — one folder per language, one file per namespace:

```
client/src/i18n/
  index.ts                 ← i18next init, stored preference, applyDocumentLanguage
  useLocale.ts             ← the hook every component uses for language/dir/locale
  locales/en/common.json   ← chrome: nav, actions, fields, time, errors
  locales/en/dashboard.json← section titles, empty-screen copy
  locales/en/pages.json    ← detail page: tabs, edit form
  locales/he/…             ← same three files, same keys
```

Namespaces must stay parallel: a key added to `en/` is added to `he/` in the
same commit. `common` is the default namespace; reference the others explicitly
(`t("dashboard:sections.attention")`).

### No hardcoded UI strings

Every user-visible interface string goes through `t()`. After any change there
must be no literal UI text in JSX, and none in `placeholder`, `aria-label`,
`title` or `alt` attributes. The only permitted literals are:

- the brand name (`Focus`),
- mock/user content in `client/src/mocks/`,
- technical values that are not language (ids, URLs, class names).

**UI strings vs user content.** Translate the interface, never the user's own
words. `Next action` becomes `הפעולה הבאה`; a note the user typed stays exactly
as typed. Never store two language versions of user content.

### RTL and LTR

There is **one layout**. Direction comes from a single attribute:

```ts
document.documentElement.lang = language;
document.documentElement.dir  = i18n.dir(language); // "rtl" for he
```

`applyDocumentLanguage()` does this; `useLocale().setLanguage()` calls it and
persists the choice to `localStorage` under `focus.language`. The preference is
read before the first render in `main.tsx`, so the app never starts in the wrong
direction and flips.

Rules for keeping one layout direction-agnostic:

- Use **CSS logical properties** in `index.css` — `margin-inline-start`,
  `padding-inline-end`, `inset-inline-start`, `border-inline-start`,
  `text-align: start`. Do not use `left`/`right` variants.
- Do **not** use Bootstrap's physical utilities: `ms-*`, `me-*`, `ps-*`, `pe-*`,
  `text-start`, `text-end`, `float-*`. The project uses the LTR Bootstrap build
  in both directions, and those classes would not flip. Flexbox and grid are
  direction-aware on their own, so `gap-*` and the `focus-*` classes are safe.
- Mirror **directional** icons only (arrows), via `<Icon flipForRtl />`. Never
  mirror symbols like a clock.
- Anything positioned by direction (the offcanvas drawer) takes its placement
  from `useLocale().isRtl`.

### `dir="auto"` on user content

The chrome follows the interface language. **User content does not** — a Hebrew
interface routinely holds English project titles, and an English interface holds
Hebrew ones.

Every element that renders user content carries `dir="auto"`: titles,
descriptions, current state, stopped-at, blockers, next actions, notes,
captions, list entries, and every `<input>`/`<textarea>` the user types into.
The browser then picks the direction from the first strong character, so an
English title inside a Hebrew page reads left-to-right with its punctuation,
numbers and units in the right places.

A URL field is the one exception: it is `dir="ltr"`, because a URL is never
Hebrew.

**A label and the words it introduces are separate blocks.** Write

```
Next action
Book the courtyard table for eight
```

not `Next action: Book the courtyard table for eight`. One line puts a Hebrew
label and an English sentence in the same bidirectional run, and the browser
then has to guess which side the colon and the full stop belong to. Use
`<LabelledText>`; it puts `dir="auto"` on the value only.

### Dates, numbers and percentages

All formatting lives in `client/src/lib/format.ts` and is driven by the active
locale from `useLocale()`. Never format a date inline in a component, and never
hand-build a relative-time string: `Intl.RelativeTimeFormat` already produces
correct Hebrew and English wording, so "in 3 days" / "בעוד 3 ימים" needs no
translation keys.

---

## Screen structure

**Overview (`/`)** answers four questions in order and then stops: what is near,
what is stuck, where do I resume, where is what I saved. It must **not** list
every project, and must not carry a chart.

It must not carry a full calendar, a board, a vision board, or a list of every
project. One activity number is allowed (sessions this month); a row of counters
is not.

**Space views (`/spaces/:spaceId`)** are all rendered by one component,
`features/space/SpaceView.tsx`. Which sections a space shows comes from
`SPACE_SECTIONS` in `lib/spaceLayout.ts` — never from a copied per-space
dashboard. Add a space by adding a config entry, not a component.

**Project detail (`/pages/:id`)** opens in **view mode** and leads with the
picture the project is aiming at, if it has one. Then the brief — where it
stands, where you stopped, the blocker, and the next action as the largest
element — followed by the user's own notes, then pictures of the work as it
went. Below that sit four content tabs: **tasks · materials · inspiration ·
history**. There is **no Overview tab** — the overview is above them, and
repeating it would be the same information twice. Materials is one tab, not
three: documents, links and useful notes are the same question. There is no
Future tab either: it held one optional sentence and was usually empty, and that
sentence is an ordinary note now.

Edit mode is one explicit action next to the title. Only then do note toolbars,
reorder arrows, delete buttons and the picture controls appear; a project opened
to be read shows text, not a content management system.

**Checklist pages (`/pages/:id` where `type` is `checklist`)** render
`ChecklistPageView`: title, date and overall progress; then notes; then the
saved inspiration, visible on arrival; then the list. No tabs, and none of the
project rubrics — a packing list has no useful answer to "why does this exist?".

**Cooking (`/spaces/cooking`)** is a three-group board — want to try · tried ·
recommended — over the two recipe fields, with a tag filter and a search that
matches tags. A **grid** view sits beside the board for the same cards under the
same filters: three columns are the right shape for deciding what to cook, and
the wrong shape for finding one recipe among eighty.

A recipe card carries a picture, the name, two clamped lines, the total time, a
recommended badge and up to three tags with `+N`. It has **no minimum height**
and is never stretched to match a neighbour — a column of white beside a
two-line card is what this rule exists to prevent. Below 576px the picture moves
beside the text rather than above it.

**Recipe detail (`/recipes/:id`)** carries the method on one side and the
personal half on the other: rating, the note that matters, what to change next
time, tags, and **attached links as a dense list** — thumbnail, name, source, and
a one-line note only when there is one. Capped, with "show N more". Seven
attachments as full-width cards pushed the method off the screen.

**Trips (`/trips/:id`)** are not projects and do not use the project screen.
Six sections — overview · itinerary · **outfits** · checklist · saved · notes —
built from the shared pieces. Destinations are chosen inside the itinerary
rather than each getting a tab. "Worth knowing" is the loudest block on a
destination. Trip facts, destinations and days are all editable; the trip
editor is a modal where Cancel discards. No map, no calendar integration.

**Outfits** live inside the trip: a board split into chosen and ideas with
filters by destination, day and occasion; a day-by-day timeline whose job is to
show the days with *no* look; and packing suggestions merged from the chosen
looks, added to the trip checklist only on request.

**Projects (`/projects`)** is a three-column board: active · parked · done.
Drag and drop is the fast path, never the only path — every card carries a
status `<select>` and order buttons with real accessible names. Below `lg` the
columns become tabs rather than three unreadable slivers.

**Training (`/training`)** belongs to Personal but is pinned in the sidebar.
It shows the next and last session, the active training plan, previous plans by
date, and a month of history per training routine. Plans are ordinary
`SavedItem`s of kind `document` — general model, specific screen.

**Routine (`/routines/:id`)** shows cadence, last done, next planned, the month
calendar, attached documents and notes. No weekly grid, no time slots, no
calendar integration.

**Events (`/events`, `/events/:id`)** list and detail. The countdown is the
loudest thing on both — an event is a thing that happens at a time, and "in 9
days" is what makes it feel like one; the date stays underneath, because "in 9
days" is no use for writing in a diary. The detail screen then shows reminders,
the next action, and the user's own sections.

Urgency is an **accent**, never a wash: a coloured left border and a small chip.
The state is always written out in words beside an icon, so colour is never
carrying it alone. Reminders that have come due surface on the overview and on
the events screen — a reminder you have to go looking for has already failed —
and every one of those surfaces states that reminders are local to an open tab.

**Vision board (`/vision`)** is a collage of three tile sizes with an order.
It is not a canvas: no free positioning, no layers, no rotation. The once-a-day
modal is off by default, appears at most once per calendar day (tracked by
date, not by tab), and never appears for an empty board.

**Ongoing management (`/manage`)** is one navigation entry with five views —
all · money · health · shopping · dates — chosen by `?view=`, so a refresh, a
back button and a link from the overview all land on the same screen. It carries
insurance and subscriptions with three totals (roughly monthly, roughly yearly,
how many are running), one month of income and expenses with four numbers, the
health panel, and shopping lists and menus. No charts.

**Menus (`/manage/menus/:id`)** hold dishes grouped by course, and one button
that turns them into shopping — with a count in front of it, merging into the
list the menu already wrote to.

**Family (`/family`, `/family/:id`)** is a grid of compact profile cards, then
one profile per screen showing only the sections the user switched on. A baby
gets feeds and new foods as quick logs; a pet gets vaccinations and treatments;
a grandparent gets contact reminders, medicines and a shopping list. Same
mechanisms, different sections.

**Learning (`/learning`)** asks two questions and then stops: *am I on this now*
(tabs: learning now · on hold · finished · all) and *what is it about* (subject
chips). One compact row per page — subject, level, where you stopped, how much
material is saved — paged fifteen at a time, with the secondary actions in an
`OverflowMenu` that is always visible. Both filters are in the URL. No search, no
sort menu, no counters across the top.

**A learning page (`/pages/:id` where `type` is `learning`)** opens with what it
is, what it is for, where you stopped and what to do next; then the level rail;
then the notes, the practice list and the material, all of which obey the rail.
Material is four panels — links · documents · pictures · videos — one open at a
time. "I studied today" stays live in view mode; adding, filing and deleting are
behind the one edit action.

**Leisure (`/leisure`)** puts "what suits right now?" at the top — because that
is the question people arrive with — and the full tagged list beneath it.

**Reminders (`/reminders`)** is the one screen that lists what has been snoozed.
Everything else the overview shows, plus that — because an app where "later"
means "gone" teaches people not to press it. It is reached from the header bell,
not from the sidebar: it is something you glance at when it has a number on it.

**Layout.** One `.focus-container` (max 1200px, centred) wraps every screen, and
every screen's heading and primary action come from `<PageHeader>` — the action
sits **on the title row**, never at the far edge of the viewport.

Sections lay out in `.focus-sections`, a responsive grid: a section holding one
or two cards shares a row with the next short one (`spanFor`), and anything
larger takes the row. Card grids use `auto-fit` with a per-item cap, so a row
fills without a single card stretching across a wide screen. No screen may
scroll horizontally at 320px.

Two rules govern every screen:

1. **An empty section renders nothing.** No heading, no placeholder panel. The
   shared `<Section hasContent={…}>` enforces it. A full-screen `EmptyState`
   appears only when an entire screen has no content.
2. **Nothing appears twice on one screen.** Section order in `SPACE_SECTIONS` is
   also priority order: each section drops pages an earlier one already showed.
   The overview applies the same rule in `DashboardPage`.

---

## Naming conventions

| Thing | Convention | Example |
|---|---|---|
| React components | `PascalCase.tsx` | `ProjectCard.tsx` |
| Hooks | `useThing.ts` | `usePages` |
| Pure logic / types / mocks | `camelCase.ts` | `pageSelectors.ts` |
| Repositories | `camelCase.ts`, exported from `repositories/index.ts` | `routinesRepository` |
| Server routes | `name.route.ts` | `health.route.ts` |
| Server middleware | `camelCase.ts` | `errorHandler.ts` |
| Types & interfaces | `PascalCase` | `PageSummary` |
| Constants | `UPPER_SNAKE_CASE` | `MOCK_PAGES` |
| CSS classes we add | `focus-` prefix | `.focus-card` |
| URLs | lowercase, plural | `/pages/:id`, `/spaces/:spaceId` |
| Translation keys | `namespace:dotted.path` | `common:fields.nextAction` |
| Translation files | `locales/<lang>/<ns>.json` | `locales/he/dashboard.json` |

## Security principles

- `ownerId` is **always** derived from the authenticated user on the server.
  Never accept it from the client, in any field, ever.
- Every query that reads or writes user data must be scoped by `ownerId`.
- Never log secrets, tokens, or full request bodies.
- Never commit `.env`. `.env.example` documents variable names only.
- Public showcase output must be built from an explicit allow-list of fields,
  never by removing fields from a private object.
- Validate all input at the server boundary before it reaches a controller.

## Error handling rules

**Server**

- Every response failure uses one envelope:

  ```json
  {
    "success": false,
    "error": { "code": "INTERNAL_ERROR", "message": "Something went wrong", "requestId": "…" }
  }
  ```

- Every request carries a `requestId`, echoed in the `x-request-id` header.
- Throw `AppError` for anything the client may see. Anything else becomes a
  generic `INTERNAL_ERROR`.
- Stack traces are logged server-side and are never sent to the client, and are
  not logged at all when `NODE_ENV=production`.

**Client**

- `AppErrorBoundary` wraps the whole app.
- Use the shared `ErrorState`, `EmptyState` and `LoadingState` components.
- **Never** use `alert()` for errors.
- An empty result is an `EmptyState`, not an error.

---

## Commands

Run from the repository root:

```bash
npm run install:all     # install client + server dependencies
npm run dev:client      # Vite dev server  → http://localhost:5173
npm run dev:server      # Express (ts-node-dev) → http://localhost:5001
npm run typecheck       # TypeScript, both sides
npm run lint            # ESLint (client)
npm run check:links     # fails on placeholder destinations in client/src
npm run build           # production build, both sides
npm test                # Vitest (client) + the server's notice
npm run test:client     # Vitest only
```

Health check: `curl http://localhost:5001/health`

The port comes from `server/.env` (`PORT=5001`). `server/src/index.ts` falls back
to 3000 only when that variable is unset, which is not how this repository runs —
earlier revisions of this file quoted the fallback and were wrong. The Vite dev
proxy targets 5001 to match.

Vitest covers `client/src/lib`, the repositories' migrations, translation parity
and source hygiene — see **Testing** above. The **server** still has no tests and
its script is still a notice; do not report that half as passing.

---

## Hard rules

1. **No new technology or library without a clear, stated need.** Bootstrap,
   React Router and Express are already here — use them. Prefer zero new
   dependencies. If one is genuinely needed, justify it in `PROJECT_STATE.md`.
2. **No architecture change without documenting the decision** in
   `docs/PROJECT_STATE.md` under "Architecture decisions", with the reason.
3. **Update `docs/PROJECT_STATE.md` at the end of every task.** What changed,
   what is still mock, what the next action is, and the date.
4. Do not abstract before there are at least two real usages.
5. No `any` unless there is no reasonable alternative — and document it.
6. **No hardcoded UI strings.** Every user-visible interface string goes through
   `t()`, in both `en` and `he`, in the same commit. No literal text in JSX and
   none in `placeholder` / `aria-label` / `title` / `alt`. No date or number
   formatting outside `lib/format.ts`; no physical CSS or Bootstrap direction
   utilities. All user content carries `dir="auto"`.
7. **Never write to `localStorage` outside `lib/storage/localStore.ts`**, and
   never read storage from a component. Go through a repository and a provider.
8. **Responsive is a requirement, not a finish.** Every screen must work at
   1440 / 1024 / 768 / 375 / 320 px in both languages, with no horizontal
   overflow at 320px.
9. Status must never be signalled by colour alone.
10. Leave no TypeScript errors, lint errors, or expected console errors.
11. Do not overwrite unrelated user work.
12. **Every modal keeps its actions reachable.** Body scrolls, header and footer
    stay. Never let a form's wrapper break the flex chain — see "Modal layout".
13. **A page shows nothing it has nothing to say about.** No empty rubric, no
    placeholder note, no reserved band for a picture that was never added.
14. **A migration never destroys.** It fills in defaults. It must not drop a
    field, change an id, clear a `focus.*` key, or collapse "absent" into
    "empty" where the two mean different things.
15. **Never promise a notification the app cannot deliver.** Reminders are
    local and every surface that shows one says so.
16. **Focus records; it never interprets.** No dose, no diagnosis, no reaction
    assessment, no vaccination schedule, no financial advice, no bank
    connection, no full card numbers. Every medical and money value is the
    user's own text, repeated back unchanged.
17. **Relevance is a filter, not a projection.** Nothing appears on the overview
    until it has become relevant. Three rows per group before "show more".
18. **A template is a starting point.** Using one clones with fresh ids; nothing
    the user does to the result may reach the template, or vice versa.
19. **Nothing derived is ever stored.** Birthdays, month summaries, relevance
    and packing suggestions are computed on every read — which is what makes
    them impossible to duplicate.
20. **Check a class name before reusing it.** `.focus-row` and
    `.focus-dense-row` are two different things for a reason.
21. **A template belongs to one domain.** Never offer a picker that can hand a
    screen another area's content. Where the right templates do not exist, an
    empty thing the user fills is the honest answer.
22. **A level is a lens, not a folder.** One control filters a whole screen, and
    unlevelled content is general — visible at every setting, labelled as such.

---

## Autonomous Development Policy

Within this repository, work end to end without pausing for approval on
ordinary, reversible development actions.

### Allowed without asking

- Read, search, create, edit, move and rename files and folders inside the repo.
- Use `Read`, `Glob`, `Grep`, `Edit` and `Write` freely.
- Run routine Bash commands needed to complete the task.
- Run development commands: install dependencies, start the dev server, build,
  typecheck, lint, run tests, format, and `git status` / `git diff` / `git log`.
- Refactor across multiple files when the task requires it.
- Diagnose and fix a failing routine command independently before reporting a
  blocker. Report a blocker only after a genuine attempt to resolve it.
- Preserve unrelated existing changes; never overwrite the user's work.

### Requires explicit approval

- Broad or irreversible deletion.
- `rm -rf` on directories.
- `git reset --hard`, `git clean -fd`, `git clean -fdx`, `git push --force`.
- Rewriting or deleting git history.
- Deleting a database or user data.
- Deploying to production.
- Changing or reading secrets and credentials (including `.env`).
- Anything outside the project directory.
- Anything that costs money.
- Sending data or acting externally on the user's behalf.

`--dangerously-skip-permissions` is never used. Project permissions are declared
in [`.claude/settings.json`](.claude/settings.json).
