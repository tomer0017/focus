# Project State

Living document. **Update this at the end of every development task.**

**Last updated:** 2026-08-22
**Task completed:** Task 19 — the family task list restored, and household
shopping rebuilt around list kinds, rounds and a validated menu target.

---

## Task 19 — the family checklist regression, and household shopping

### The regression, and its exact cause

Task 18 rebuilt the family profile around three tabs and dropped the opt-in
section list that used to render the profile's checklist. The data was never
touched — it has always been at `family:<profileId>` — but for one release
there was **no surface** for it. Nothing migrated it, nothing deleted it; the
component that displayed it simply stopped being rendered.

Restored as `<ProfileTasks>` at the foot of the schedule tab: progress, the
three outstanding items tickable where they stand, and the full shared
`<ChecklistSection>` behind "open the list". Empty, it is one small "add a task"
link rather than a bordered panel. Deliberately last and quiet — a profile is
mostly about what is coming.

No `FamilyTask`, no `FamilyChecklist`, no new repository, no new storage key,
and nothing copied into `FamilyProfile`.

### Trip North: already fixed, and now guarded twice

The brief describes Trip North appearing in household shopping. That was fixed
in Task 13 by `checklistContextOf` and `selectHouseholdShoppingLists`, and this
task **confirmed it by test** rather than re-fixing it: the seeded Trip North
page is `packing`/`trip`, is absent from the shopping screen, and is still fully
intact as a page for Trips.

What this task added is the **second** door. A menu could be pointed at any
checklist page and would merge groceries into it — the same bug through a
different route. `canReceiveShopping` now validates the target through the same
judge before a single item is written.

### Household shopping

- `ChecklistContext` gained `listType` (`weekly · monthly · holiday · reusable ·
  oneTime`), `occasion` (free text, never a calendar key) and `cycleStartedAt`.
  No `RecurrenceRule`: a shopping list has no next occurrence and nothing fires
  from it.
- The shopping screen is two tabs — lists and menus — with type/occasion
  filters, search across the whole collection, 20-row paging, all in the URL.
  It was two panels stacked on one page with six rows and a "show more" each.
- **"Start the next round"** unticks every item in place, keeps them all, and
  runs only from a confirmed action. A weekly list stays one page for ever.
- Creating a list asks for a name, a kind and — only for a holiday — an
  occasion. A "cleaning supplies" template was added as the clearest reusable
  case.
- The menu's generate flow now picks its target from household lists only,
  and the confirmation states three numbers: new, already on the list, and
  repeats the menu itself folded together.

### Migration

Unchanged in shape and still idempotent. The one rule worth restating: a stored
checklist page with no context becomes `shopping`/`household` because that is
the only path that ever created one — and gains **no** `listType` and **no**
`occasion`, because those are unknowable and "Weekly shopping" in a title is not
evidence. Tested with the brief's full fixture set.

### Verification

TypeScript (client + server) clean · ESLint clean · **552/552** Vitest tests
passing, up from 522 · production build clean · `check:links` clean ·
translation parity clean · source hygiene clean · `legacy/` unchanged · **no new
repository, storage key, dependency or direct `localStorage` access**.

**30 new tests**: 25 in `lib/householdShopping.test.ts` — Trip North off the
screen and intact as a page, every other owner excluded, an unclassified list
failing safely and never read from its title, type filters that cannot leak,
`startNextCycle` keeping every item and the same page, `canReceiveShopping`
refusing a packing list and an unclassified page, the three-count preview,
checked items surviving a regeneration, a shrinking menu deleting nothing,
idempotent generation, and 100 items in one list — plus 5 migration fixtures
covering a bare household list, a packing list, a project, an entity-owned
family list and a menu's remembered target.

**Not verified: no browser check.** The sandbox refuses to bind a port and there
is no browser in this environment. The responsive sweep (1440 / 1024 / 768 /
375 / 320), RTL and LTR, console and network, and every interaction listed in
the brief are **unverified**. Manual checklist in the task report.

### Deliberate deviations

- **No `RecurrenceRule` on a shopping list.** `listType` is a label; a rule
  would imply a scheduler that must not exist. Documented in `DATA_MODEL.md`.
- **No per-holiday templates** (Rosh Hashanah, Passover, Shabbat). The generic
  holiday template plus a user-typed occasion covers them without baking a
  calendar into the app. "Cleaning supplies" was added.
- **No archived/completed filter.** The page model has no archived state for
  checklist pages, and inventing one was outside this task.

### Technical debt

- `ChecklistPageView` still renders saved inspiration, which is right for a trip
  packing list and slightly odd on a supermarket list. It renders nothing when
  there is none, so it is invisible in practice.
- `FamilyProfile.savedItemIds` and `activeSections` remain vestigial from
  Task 18.

### The recommended next action — one

```text
Browser verification pass across all rebuilt screens
```

---

## Task 18 — family

### What already existed and was reused

Most of the model was already right and was **not** rebuilt: `FamilyProfile`
(with `notes: ProjectNote[]` and a birthday preference), `ScheduledItem` with
`relatedEntity`, `Medication`, `QuickLogEntry`, `birthdayEventFor` /
`withBirthdays` / `isDerivedBirthday`, `familyReference` / `belongsTo`,
`nextAttentionFor`, `nextDateFor`, `ScheduledFormModal` and
`MedicationFormModal` (both already accepting `defaultRelated`),
`ProfileFormModal`, `QuickLogModal`, and the delete dialog's cascade opt-in.

**No new repository and no new storage key** were added. Nothing about family
needed one.

### What was actually wrong

- **Materials did not work.** The profile page read `profile.savedItemIds`,
  which is `[]` everywhere and written by nothing. Family materials were a
  field that never filled.
- **Ten opt-in sections, four derived topics.** A vaccination, an appointment
  and a check-up are the same record with a different category, so a
  grandmother's page had four panels holding one row each — and switching
  sections on was a configuration task before the page was useful.
- **The index was a card grid** with cards of different heights, each printing
  whatever it had, with no search, no filter and no paging.

### What changed

- `/family` is one compact row per profile — avatar, name, relationship, and
  **the single nearest thing that wants doing** — with search, a type filter and
  20 to a page, all in the URL.
- `/family/:id` is who they are, what is nearest, then **schedule · notes ·
  materials** with `?tab=` in the URL.
- **Schedule** is one list: every `ScheduledItem` owned by the profile whatever
  its category, then medicines shown as themselves, then the five most recent
  quick logs with history behind a toggle, then what is done. Creating a
  reminder or a medicine is scoped to the profile by `defaultRelated`.
- **Materials** now use `contextIds`, so they work. Four seeded examples were
  added, including a document attached to Dad that a training plan could also
  claim without being copied.
- **Notes** gained a family-scoped template set.

Four components became dead and were deleted: `ProfileCard`, `SectionManager`,
`FeedingSection`, `TastingSection`.

### The two materials components became one

`ResourcePanels` (add form, no paging) and `ProjectMaterials` (filter, search,
real paging, no add form) were the same component twice. They are now
`features/resources/MaterialsPanel.tsx`, used by **projects, leisure, training
and family**. View state is URL-driven when the caller passes it and internal
otherwise. Leisure and training gained search and paging; projects gained the
add form.

### Migration

**None was needed and none was written.** No field changed shape. Three
existing behaviours were verified by test rather than altered: an unassigned
scheduled item is never guessed at, a derived birthday is never stored, and
`notes` keeps the `undefined` / `[]` distinction. `savedItemIds` is left in
place — a migration never removes a field — and is documented as vestigial.

### Verification

TypeScript (client + server) clean · ESLint clean · **522/522** Vitest tests
passing, up from 492 · production build clean · `check:links` clean ·
translation parity clean · source hygiene clean · `legacy/` unchanged · no new
repository, storage key or dependency.

**30 new tests** in `lib/familyScheduling.test.ts`: reference-based ownership
and two-profile isolation, `dad` vs `dad-in-law`, unassigned items appearing on
nobody's page, every-three-days and every-fortnight recurrence, completion
advancing from the anchor and keeping the item open, a one-off treatment
closing, derived birthdays producing one event however many times they are read,
a corrected birth date following, a stored birthday not counting as derived, 29
February clamping to 28 February in a common year, medicine and log isolation,
material isolation with one item shared between a profile and a plan, filtering
and paging 150 materials, the delete footprint counting owned records separately
from linked ones, and 100 profiles paging at 20.

Two API guesses were wrong and the tests caught them (`nextOccurrence`,
`completeScheduled` — the real names are `nextOccurrenceAfter` and
`completeOccurrence`), and `tsc -b` caught three `as Medication` casts that
Vitest had happily run.

**Not verified: no browser check.** Sandbox refuses to bind a port; no browser
here. The responsive sweep (1440 / 1024 / 768 / 375 / 320), RTL and LTR, console
and network, and all 29 interaction scenarios are **unverified**. The four
riskiest to check by hand are named in the task report.

### Technical debt

- `FamilyProfile.savedItemIds` and `activeSections` are both now vestigial:
  nothing writes or reads them. Left in place deliberately; a later pass should
  retire them together.
- The profile's checklist (`family:<id>`) has no surface on the new page. It had
  one under the old section list. Nothing was deleted — the data is intact — but
  it is currently unreachable from the profile.
- `family.json` still carries `sections` and `topics` keys for the removed
  section system.

### The recommended next action — one

```text
Manage household shopping and recurring menus
```

---

## Task 17 — project detail

### What it was

A header, a full-width vision picture, a four-panel brief, the notes, and a
progress gallery — all stacked down one page **before** the tabs began. Then
four tabs: tasks, materials, inspiration, history. Opening a project meant
scrolling past most of it to reach anything actionable.

### What it is now

Three layers:

1. **Compact header** — thumbnail, title, category, status, blocked badge,
   paused reason and completion date when they exist, last touched.
2. **Focus band** — the next action, with the blocker *in the same block*. They
   are one thought: a blocker is the reason the next action has not happened,
   and splitting them into a "stage" panel and an "action" panel is what made
   the old brief read as a form with headings. Plus a button to the open tasks.
   Renders **nothing** when there is no action, no blocker and no tasks.
3. **Three tabs — overview · tasks · materials** — with `?tab=` in the URL.

### Two tabs removed, and why

- **Inspiration** was divided from materials by a hard-coded list of saved-item
  kinds. That division was the screen's idea, not the user's: a photograph of
  the existing garden is reference *and* inspiration depending on the day. One
  shelf now, filtered by what a thing **is** — links · documents · pictures ·
  videos — which is a fact about the item rather than a judgement about it.
- **History** held three facts: last updated, completed on, paused reason. They
  are chips in the header, where they are actually read.

`ResumeBrief.tsx` became dead and was deleted, along with six orphaned
translation keys in both languages.

### The four structured fields kept their jobs

`nextAction` → the focus band. `blocker` → the badge and the band's warning
line. `currentState` and `stoppedAt` → two short lines at the top of the
overview. None is duplicated as a note and none became prose: the overview
screen and the board read all four, and `isBlocked()` is defined in terms of
`blocker`.

### Materials

New pure module `lib/projectMaterials.ts`. All nine `SavedItemKind`s map onto
four shelves, so no item can become invisible. Search runs over the whole shelf,
not the current page. Paging is real — previous / "page 2 of 4" / next — at 20
rows or 12 tiles, sized so both produce a screen of about the same length. The
shelf, the search and the page all live in the URL, and changing the shelf or
the search resets the page.

Page numbers are **clamped, not trusted**: `?page=9` on a two-page shelf shows
the last page rather than an empty screen.

### Editing

The field dialog gained **status**, which previously could only be changed from
the board. It goes through `moveProject` — the same call the board makes — and
only when the value actually changed, because that call stamps and clears
`completedAt`.

Two deviations from the brief, both deliberate:

- **`description` was not added to the dialog.** It is a legacy field the
  adapter reads as the "why this exists" note. Adding it as a field as well
  would put the same text in a field *and* a note, which the brief itself
  forbids.
- **Pictures are still edited in place** in the overview tab rather than in the
  dialog. In-place editing already supports picking an existing saved item and
  several progress pictures with notes and dates; moving it into a dialog would
  have lost capability.

### Migration and backward compatibility

**No migration was written, because none is needed.** `notesForPage` is a pure,
idempotent adapter that runs on each render: `notes` present wins (including
`[]`, which means the user deleted every note); absent falls back to the legacy
fields that hold something, with stable derived ids. Nothing is written to
storage, so a refresh cannot duplicate a note, and no legacy field is destroyed.
New tests assert exactly that.

### Verification

TypeScript (client + server) clean · ESLint clean · **492/492** Vitest tests
passing, up from 469 · production build clean · `check:links` clean ·
translation parity clean · source hygiene clean · `legacy/` unchanged · no new
`localStorage` access · no new dependency.

**23 new tests**: 18 in `lib/projectMaterials.test.ts` — every saved kind has a
shelf; one project's materials never leak into a project whose id merely starts
the same way; an item titled after a project does not join it; filter and search
combine rather than compete; paging clamps out-of-range pages; a heavy project
(70 links, 40 documents, 60 pictures, 50 videos) pages at 20 and 12 — plus 5 in
`lib/projectNotes.test.ts` covering adapter idempotency across repeated reads,
stable derived ids, and every seeded project opening with or without notes and
pictures.

**A class collision was caught during the work.** `.focus-band` already belonged
to the quiet section wrapper Manage and Trips use; the new strip is
`.focus-project-band`. That is the "check a class name before reusing it" rule
doing its job.

**Not verified: no browser check.** The sandbox refuses to bind a port and there
is no browser here. The responsive sweep (1440 / 1024 / 768 / 375 / 320), RTL and
LTR, console and network, and all 23 interaction checks in the brief are
**unverified**. Manual checklist in the task report.

### Technical debt

- Materials paging renders the whole filtered array before slicing. Correct and
  fast at this size; a server-side cursor is the eventual answer.
- The focus band's blocker colour is a literal `#8a5a00` rather than a token.
- Pinned links (Figma, repo, Drive above the tabs) are **not** built. It needs a
  "pinned" flag on `SavedItem` — a model change, not a layout one. Recorded in
  `FUTURE_ROADMAP.md`.

### The recommended next action — one

```text
Family scheduling and materials
```

---

## Task 16 — training

### The defect

One line of the old screen:

```ts
const [activePlan, ...previousPlans] = plans;
```

"The active plan" was whichever `SavedItem` document filed against the training
area happened to be newest. Two consequences, both fatal to the area: running
Plan A and Plan B in the same week could not be represented, and there was
nowhere to write down what was *in* a plan at all.

### The model

New `TrainingPlan` in `types/training.ts`, stored under `focus.trainingPlans`.
It owns its `TrainingGroup[]`, each group owns its `TrainingExercise[]`, and the
plan carries its own `ProjectNote[]` — the shared note model, not a new one.
Status is `active | paused | completed` and **any number of plans may be
active**; there is no primary slot and no single-plan assumption left anywhere.

`environment` (`gym | home | outdoor | custom`) earns a field because it is what
you filter on when the gym is shut. `label` is free text — "A", "B", "Push",
"בית" — never a fixed A/B/C, because that is one household's convention.

Sets, reps and weight are **strings**: people write "3–4", "8-12 each side" and
"20kg, maybe 22 next time". Parsing those would be the first step towards
calculating with them.

Groups and exercises are embedded rather than kept in their own slices,
deviating from the brief's sketch for the reason `Trip` owns its destinations: a
group is never read without its plan, so one write per edit beats three that can
disagree. Justified in `DATA_MODEL.md` §2.2b along with delete behaviour and
array bounds.

### The screens

- `/training` is now a `CollectionPage` with three areas — **plans · tracking ·
  materials** — chosen by `?area=`.
  - **Plans**: status filter, place filter, search across titles *and exercise
    names*, 20 rows a page, all in the URL. Create, edit, duplicate, change
    status and delete, with the secondary actions in an always-visible overflow
    menu.
  - **Tracking**: kept exactly as it was — next and last session, sessions this
    month, the month calendar, treatments read from the manage slice. It earns
    its tab because every figure on it comes from real completion records the
    user has been ticking. Nothing was invented for it.
  - **Materials**: the training area's saved items.
- `/training/plans/:id` is new: the plan's facts, then **the plan · notes ·
  materials**, opening in view mode with edit one explicit step away.

**Reordering is buttons, not dragging** — groups and exercises both. A drag
target is unusable on a phone and unreachable from a keyboard, and this is now a
hard rule in `CLAUDE.md`.

### One shared component extracted

`LeisureMaterials` became `features/resources/ResourcePanels.tsx`, used by both
the leisure detail screen and training. Its copy moved to a new shared
`resources` namespace. Extracted at the second real caller, not before.

### Migration — which deliberately does nothing

`trainingPlansRepository` fills in `groups`, `order` and the per-group and
per-exercise order, and is idempotent. It **creates no plans**. Training
documents already in storage stay `SavedItem`s under the material tab: reading
"gym plan.pdf" and producing groups and exercises would be inventing content,
which is the one thing a migration may never do. A test asserts exactly that.

### Scope held

No trainee or coach profiles, no sharing, no permissions, no chat, no AI, no
calorie or nutrition tracking, no device integration, no RPE, rest timer,
one-rep-max, muscle analytics or superset engine, no upload, no metadata fetch,
no API or database. The previously-floated "add a trainee and share a training
page" is now marked **cancelled** in `FUTURE_ROADMAP.md` rather than left as a
live future task.

### Verification

TypeScript (client + server) clean · ESLint clean · **469/469** Vitest tests
passing, up from 443 · production build clean · `check:links` clean ·
translation parity clean · source hygiene clean · `legacy/` unchanged · no new
`localStorage` access · no new dependency.

**26 new tests**: 22 in `lib/training.test.ts` — three plans active at once,
free-text labels, adding and reordering groups and exercises with buttons,
refusing to move past either end, removal renumbering, duplication with fresh
ids that cannot be edited back into the original and that parks rather than
starts a second live plan, search reaching exercise names, and a 20×5 plan
staying one small document — plus 4 migration tests including the one proving no
plan is invented from a saved document.

**Not verified: no browser check.** The sandbox refuses to bind a port and there
is no browser here. The responsive sweep (1440 / 1024 / 768 / 375 / 320), RTL and
LTR, console and network, and every interaction — creating a plan, two active at
once, duplicating, changing status, adding a group and an exercise, reordering,
saving a weight, adding a note, attaching a link and a video, refresh,
Back/Forward — are **unverified**. Manual checklist in the task report.

### Technical debt

- **A session still does not know its plan.** `ScheduledItem` and `Routine`
  carry no reference to a `TrainingPlan`. Deliberate — both models are already
  correct and neither copies the other — but "gym, Sunday" cannot yet say which
  plan it means. Recorded in `FUTURE_ROADMAP.md`.
- Deleting a plan leaves its id in the `contextIds` of any saved item attached
  to it. The reference is weak by design and the screens cope, but nothing prunes
  it.
- The training tab's materials panel is always in editing mode, because the area
  as a whole has no view/edit toggle of its own. Harmless, but inconsistent with
  every other materials panel.

### The recommended next action — one

```text
Project Detail consolidation
```

---

## Task 15 — the overview

### The problem

Eight sections at once: what needs you (five buckets), a strip of upcoming
things, blocked projects, where you stopped, sessions this month, quick access
as a card grid, and a gallery of recently saved pictures — plus a three-tab
group switcher on a phone to make the length bearable. Everything on it was
true. Almost none of it changed what anybody would do next, and the picture
gallery was the tallest thing on the page.

### The shape now

Four areas, in the order they stack on a phone, which is also priority order:

| Area | Cap | What it is |
|---|---|---|
| Needs you now | **5** | Late, due today, or a reminder that has come round |
| Next 14 days | **6** | Dated things that have entered a preparation window |
| Projects on the go | **3** | Active projects, blocked first |
| Learning now | **3** | Active learning, most recently studied first |

Then one quiet line of links. Beyond a cap, a count and a link to the screen
that lists them all.

### Sections removed from the overview

Recently saved gallery · inspiration cards · quick access as a card grid ·
the monthly training-session figure · the blocked-projects section (folded into
"projects on the go", where a blocker is a chip on the row) · "pick up where you
left off" as its own section · the mobile group switcher and its two
translation keys. Three components became dead and were deleted:
`ActivityInsight`, `AttentionList`, `NowCentre`.

Nothing was deleted from any other screen. Everything removed here still lives
where it belongs — saved items on the space views and in search, sessions on
`/training`, the full relevance list on `/reminders`.

### The relevance rules

New pure module `lib/dashboard.ts`, on top of the existing `collectRelevance`:

- **`severityOf`** bands rows — overdue (0), today (1), soon (2) — and adds the
  day count at a hundredth of a band, so a date breaks ties *inside* a band and
  can never promote a distant item above a late one.
- **`dedupeBySource`** de-duplicates on `referenceKey(item.reference)`, never on
  the title. Two appointments called "בדיקה" are two appointments.
- **`selectNeedsYouNow`** takes buckets `today` + `waiting`. A thing that
  happens on Thursday is not asking on Monday.
- **`selectNextDays`** takes dated rows inside 14 days, excluding by source
  identity everything the first area showed. Undated rows — an idle learning
  page — are excluded entirely: they belong on their own screen, not in a list
  of dates.
- **`focusLineFor`** shows `nextAction`, else `stoppedAt`, else a note titled
  "where I stopped" — matched on the template *key*, not the rendered title, so
  it works in both languages. Read through `notesForPage`; nothing is copied.

Two changes to shared logic, both to remove a drift risk rather than add a
second rule:

- **`DEFAULT_PREP_DAYS` in `lib/eventTiming.ts`** — a preparation window per
  event kind, used by `urgencyOf` only when the user gave none. Wedding and
  bar/bat mitzvah 30, party 10, anniversary 7, birthday 14, holiday and hosting
  5, family 3; `custom` has none, so a distant custom event stays as quiet as
  before. Values at or below 7 are inert — anything inside a week is already
  `soon`, which is louder — and the code says so rather than implying otherwise.
- **Trips as a relevance source**, entering 10 days before departure. That is
  the point where a trip stops being a plan and becomes a list of things to do.

### Nothing is stored

No dashboard repository, no storage key, no migration, because there is nothing
to store. Every row is projected on each read and carries the `EntityReference`
it came from.

### Verification

TypeScript (client + server) clean · ESLint clean · **443/443** Vitest tests
passing, up from 410 · production build clean · `check:links` clean ·
translation parity clean · source hygiene clean · `legacy/` unchanged · no new
`localStorage` access · no new dependency.

**33 new tests** in `lib/dashboard.test.ts`, most of them checking that
something is *absent*: a haircut every three weeks stays off the screen until it
is close, a trip 40 days out is not there, a completed reminder is not there, a
distant date cannot outrank a late one, the same source cannot appear twice or
in both time areas, a parked or finished project is not "on the go", and the
caps hold at 100 reminders / 70 projects / 40 learning pages.

One test found a real thing during the work: the 5-day holiday window is inert
because the under-a-week rule already fires. The table entry stayed, the comment
now says so, and the test asserts the outcome the brief wanted rather than the
mechanism.

**Not verified: no browser check of any kind.** The sandbox refuses to bind a
port and there is no browser in this environment. So the responsive sweep
(1440 / 1024 / 768 / 375 / 320), RTL and LTR, the console and network check, and
every interaction — following a row to its source, marking something done and
refreshing, "and N more", the empty states, Back/Forward, switching language —
are **unverified**. See the manual checklist in the task report.

### Technical debt

- `lib/pageSelectors.ts` still exports `selectNeedsAttention`, `selectContinue`,
  `ATTENTION_LIMIT` and `CONTINUE_LIMIT`, which now have no caller. They are
  tested and harmless, but they are dead weight and should go in a later sweep.
- The two-column band splits at `lg`. Between `md` and `lg` the overview is a
  single column, which is correct but makes a tablet taller than it needs to be.
- `RelevanceItem` now carries a `trip` source, so the reminders screen lists
  departures too. That is intended, but it was not part of this task's brief and
  is worth a look on `/reminders`.

### The recommended next action — one

```text
Training multi-plan and materials
```

---

## Task 14 — leisure and lists

### The defect

`LeisureItem` had one lifecycle field, `status`, with three values —
`idea · planned · done` — and it was doing two jobs. **A book you own but have
not read had nowhere to live.** You could file it as an idea or as done, and
both were false. The same field was also all that separated a place you had
visited from one you wanted to visit, and a camera you had researched from one
you had bought.

The screen made it worse rather than hiding it: films, books, places, evening
ideas and a wishlist shared one grid of cards, behind a five-question form
asking what would suit right now. It read as a pile of ideas rather than
somewhere to come back to after a year.

### What changed in the model

Five kinds — `book · movie · destination · future_purchase · idea` — and four
status vocabularies, each belonging to exactly one axis:

| Field | Values | Applies to |
|---|---|---|
| `ownershipStatus` | `wishlist · owned · borrowed · not_applicable` | books |
| `consumptionStatus` | `not_started · in_progress · completed · abandoned` | books, films |
| `destinationStatus` | `want_to_visit · visited · revisit` | places |
| `purchaseStatus` | `researching · want_to_buy · waiting · purchased · abandoned` | future purchases |

Also added: `legacyKind`, `region`, `estimatedBudget`, `currency`, and
`notes: ProjectNote[]`.

`AXIS_BY_KIND` in `lib/leisureCollections.ts` is the single judge of which field
carries a kind's status. That is what makes it structurally impossible for one
collection's filter to match another's items — `visited` cannot match a book
however the URL is edited.

Nothing new was invented for notes or material. An item's blocks are
`ProjectNote[]` rendered by the same `<ProjectNotes>` the project and learning
pages use; its links, documents, pictures and videos are `SavedItem`s attached
through `contextIds`. The only leisure-specific piece is which note *templates*
are offered, scoped per kind.

### The migration, and the one place it does nothing

`migrateLeisureItem` renames the old seven kinds to the five, keeping the
original in `legacyKind` wherever the rename loses a distinction (`series` into
`movie`, `activity` and `evening` into `idea`). It derives the per-kind status
from the old one where that is knowable — `done` becomes
`completed` / `visited` / `purchased`.

It deliberately never produces:

- **`in_progress` or `abandoned`.** Nothing in the old data distinguished
  "planned to read" from "reading", and nothing recorded giving up at all.
- **Any ownership.** The old `status` never meant "I own it" and never meant "I
  want it" — it meant neither, and the honest migration of an unknown is to
  leave it unrecorded. `ownershipStatus` is absent on every migrated item.

Every other field survives untouched, including `status` itself and the
suggester's cooldown stamps. It is idempotent: new kinds map to themselves and
each status is filled only when absent.

### What changed on screen

- `/leisure` is now `CollectionPage`: five tabs, a status filter offering only
  the states that collection actually uses and only those with something in
  them, a search over the whole category, and `PagedList` at 20 rows. Category,
  status and search all live in the URL, so refresh and Back/Forward restore the
  view.
- One compact row per item — small thumbnail, kind, title, one clamped line,
  status chip, up to two tags, when it changed, and an always-visible overflow
  menu. The old card grid is gone, and `LeisureCard.tsx` with it.
- **A book's row shows two facts of different weight**: progress as the chip,
  ownership as a quiet word in the meta column and only when recorded. Two equal
  badges would be two things to read on every line.
- New detail screen at `/leisure/:id` — the brief, then **overview · notes ·
  materials**, opening in view mode with edit one explicit step away.
- Materials are four panels (links · documents · pictures · videos) over
  `SavedItem`, with a per-panel add form. Nothing is uploaded and nothing is
  fetched.
- A destination offers "plan a trip from here" as an explicit action. No trip is
  created automatically and nothing is matched by title.
- The suggester is unchanged and still one press behind its own button. It now
  also stops offering anything settled on its per-kind axis, so a book you
  finished is not suggested on a quiet evening.

### Seed data

`MOCK_LEISURE` rewritten in the current vocabulary, 16 items across all five
tabs — including the three states that were impossible before: owned and unread,
wanted and unread, owned and finished. The migration is exercised by tests
against real old payloads rather than by the seed, because a seed can only
demonstrate one shape and the shape worth testing is the one already in
somebody's browser.

### Verification

TypeScript (client + server) clean · ESLint clean · **410/410** Vitest tests
passing, up from 375 · production build clean · `check:links` clean ·
translation parity and Hebrew plurals clean (37 tests) · source hygiene clean
(11 tests: no Bootstrap physical utilities, no physical CSS, `localStorage`
touched in exactly one module, no `alert()`, no inline date formatting,
`legacy/` excluded) · `legacy/` unchanged · no `fetch`, `XMLHttpRequest` or
`localhost` reference added anywhere in the new code.

**35 new tests**: 32 in `lib/leisureCollections.test.ts` covering the impossible
states, axis independence in both directions, per-kind vocabularies, filters
that cannot cross collections, search across a whole category, migration from
real old payloads including idempotency and the two things it must never invent,
and note templates being scoped per kind; 3 in `repositories/migrations.test.ts`
driving the same migration through actual storage.

**Not verified**: no browser check was run. The sandbox refuses to bind a port,
so the dev server would not start, and there is no browser in this environment.
The responsive sweep (1440 / 1024 / 768 / 375 / 320), the RTL and LTR passes, the
console and network check and the live-site walkthrough are therefore
**unverified**, and so is the GitHub Pages deployment.

### Still mock or local-only

Files (a document is an address), pictures and videos (addresses with a
user-chosen platform label), metadata (never fetched), price (a number somebody
typed — no tracker, no comparison, no alerts), sharing, the database,
authentication and export. All unchanged by this task.

### Technical debt

- `LeisureItem` still carries the old `status` field alongside the new axes. It
  is deliberate — the suggester reads it and it is the user's data — but two
  lifecycle notions now coexist on one type, and a later pass should decide
  whether `status` becomes suggester-only state under a clearer name.
- `filterLeisure` in `lib/leisureRules.ts` is still used only by its own tests
  now that `filterCollection` backs the screen.
- The ownership filter exists in `filterCollection` and is covered by tests, but
  the books tab does not yet expose it as a second chip strip — progress is the
  filter on screen.

### The recommended next action — one

```text
Dashboard decision screen
```

---

## Task 13 — consolidation pass, stages 1–5 of 15

This task was briefed as a full consolidation of the app: a shared data core, a
rebuilt dashboard, a reworked Projects, Learning, Training, Leisure and Family,
a responsive and heavy-fixture sweep, and a deploy. **Five of the fifteen
stages are done.** The rest is listed under "Not done" and is untouched — no
half-migrated model and no half-rewritten screen was left behind.

### Stage 1 — baseline and audit

Baseline before any change: TypeScript clean both sides, ESLint clean,
**359/359** Vitest tests passing, production build clean, `check:links` clean.

The audit's main finding is that **most of the brief had already landed**, and
the parts that had are deliberately not being rebuilt:

- `/projects` is already the single canonical index — category tabs, status
  filter, one compact row per project, search across the whole category, paged,
  with both filters in the URL. There is no card board and no infinite scroll.
- The space views already group their sections into topics and link through to
  `/projects?category=…` rather than reproducing the board, so the "two
  overviews of the same projects" duplication is already mostly gone. What is
  left of it is noted below.
- `EntityReference` is already one weak pointer shape used everywhere, and
  `checklistOwnerFor` already turns one into a checklist's owner key. Nothing
  in the app infers a parent from an id prefix, a title or a route at read time.
- Notes and resources are already one model each — `ProjectNote` and
  `SavedItem` — with no `ProjectLink`, `LearningVideo` or `FamilyDocument`
  anywhere. `LearningResource` is the *edge* between a page and a saved item,
  not a fifth resource type.
- Nothing merges by name. Pages are `[...ownPages, ...MOCK_PAGES]` overlaid
  with a diff keyed by id, so a seeded "English" and a user-created "English"
  are two pages with two ids and are never reconciled by title.

### Stage 2 — `docs/DATA_MODEL.md`

New. Holds the audit table (24 storage keys, their repositories, their readers
and what each is keyed on), the consolidation decisions and **what deliberately
stays specialised and why**, the future MongoDB collection map with every
deviation from the brief justified, the embed-or-reference decisions, an
index table where each index is named by the screen that needs it, the
file-storage security flow for a day when files exist, the migration path from
`localStorage`, and the explicit non-goals.

### Stages 3–5 — the checklist purpose/scope contract

**The defect.** `Trip North` — a camping packing list — appeared on the
household **Shopping & Menus** screen next to the weekly supermarket run.
Nothing was wrong with the rendering. One query was wrong:

```
features/manage/ShoppingPanel.tsx:38
  pages.filter((page) => page.type === "checklist")
```

That asks for the *storage shape* and not the *purpose*, and a packing list is
that shape. A checklist recorded what it belonged to and had no way to say what
it was for.

**The contract.** Two closed vocabularies — `ChecklistPurpose`
(`tasks · shopping · packing · event · training · general`) and `ChecklistScope`
(`household · trip · project · event · person · page`). Two axes rather than one
enum because they vary independently: a trip has a packing list *and* can have a
shopping list, and the household screen wants exactly one of those.

**Where it is stored, and the deviation from the brief.** The brief puts both
fields on the `Checklist` record. Here they sit on `PageSummary.checklist` for
page-owned lists, because in this codebase the thing a user names, dates, opens
and deletes is the **page** — `Checklist` is only the groups hanging off an
owner key, and a page exists before its checklist record does. A list would
otherwise have no purpose until somebody added a first item.

For a list owned by an entity (`trip:…`, `event:…`, `project:…`, `family:…`)
nothing is stored at all: the owner key *is* an `EntityReference`, so reading it
back is reading the parent the writer wrote.

**One judge.** `checklistContextOf(ownerId, page?)` in `lib/checklist.ts`, in
the same spirit as `urgencyOf`, `matchesLevel` and `isBlocked`. It answers in
three steps: what the page declared; failing that, what the page's *type*
implies (a project page's list is that project's tasks, by definition of what a
project page is); failing that, **unclassified** — which appears on no screen
that filters. Unclassified is the safe failure, and it is deliberately the
answer for an undeclared page of type `checklist`, because a shopping list and a
packing list are the same shape and only the user knows which one they made.

**The migration.** A stored checklist page with no context is filled as
`shopping`/`household`. That is a statement of fact rather than a guess:
`NewListModal` is the only code path that has ever created a user-owned
checklist page, and the only screen that opens it is household shopping. It
fills the field only when it is absent, so it is idempotent, and it touches no
other field and no id.

**Seed data.** `before-a-flight` and `trip-north` now declare
`packing`/`trip`, and two household lists — `weekly-shop` and `holiday-shop` —
were added with their checklists, because a screen that now answers a real
question honestly would otherwise answer it with nothing.

**Tests.** `lib/checklistContext.test.ts` (16 tests) proves the isolation
rather than the function: Trip North and Before a Flight are absent from the
household list, the household lists are present, an undeclared list is dropped
rather than assumed, the space a page sits in never decides its purpose, every
seeded checklist — page-owned and entity-owned — classifies to something
findable, and the trip and household sets are disjoint. Four more tests in
`repositories/migrations.test.ts` cover the migration, including idempotency and
that an existing context is never overwritten.

One of these tests found a real gap during the work: project pages own task
lists keyed `page:<projectId>`, which the first version of the judge left
unclassified. That is what the page-type step exists for.

### Results after stages 1–5

TypeScript clean both sides · ESLint clean · **375/375** Vitest tests passing
(up from 359) · production build clean · `check:links` clean.

### Not done — the remaining ten stages

Untouched, and honestly so. None of these was started:

- **Dashboard** (§6). Not reshaped into the "now / next fortnight / upcoming
  commitments / in focus" order, and the removals in §6.5 were not made.
- **Projects** (§7). The index and detail already meet the brief. What remains
  is the last of the Work & Tech duplication: its "work" topic still renders
  blocked, active and paused project sections inline as well as linking out.
- **Learning** (§8). The completion pass — contextual add inside the active
  material tab, "new note", the repeated per-tab footer, per-level and per-kind
  empty states.
- **Training** (§9). Still one active plan (`const [activePlan, ...previous]`).
  No multiple active/alternative/frozen/completed plans, no A/B/C grouping, no
  per-plan or per-exercise resources.
- **Leisure** (§10). No `ownership` axis for books, so "I own it" and "I have
  read it" cannot be recorded separately — acceptance test 24 does not pass. No
  purchase-research fields. Its filters are component state, not URL state, so
  Back/Forward does not restore them (acceptance test 33 fails here).
- **Family** (§11). Still opt-in sections behind a `SegmentedNav`, not the three
  areas the brief asks for.
- **Regression sweep** of Trips/Events/Cooking/Vision (§13), the responsive and
  accessibility sweep (§15.30–34), the heavy fixtures (§16), the live browser
  and console sweep, and the GitHub Pages deploy and live verification (§20).

**Nothing was committed or pushed**, because §20 makes the deploy the last step
of a completed pass and a partial deploy would be a claim this task cannot
honestly make.

### The recommended next action — one

**Leisure (§10).** It is the only area with a defect at the *model* level rather
than the layout level: a book's ownership and its reading progress are the same
field, so "I own it, unread" cannot be written down at all. Every other
outstanding item is a screen that works and could be better; this one loses
information the user tried to record.

---

## What changed in task 12 — learning

### The defect that started it

Creating a learning page for English offered "start from a template", the
template list was the app-wide checklist list, and the result was a **weekly
supermarket shop** — produce, dairy, bakery — sitting on a page about learning
English. Every part of that worked exactly as written. It was still wrong, and
the fix is not a better picker: a learning page now offers **no template at
creation at all**, and its practice list starts empty.

Two rules came out of it, both now in `CLAUDE.md`:

- A template belongs to one domain. Never offer a picker that can hand a screen
  another area's content.
- Where the right templates do not exist, an empty thing the user fills is the
  honest answer.

`ChecklistSection` gained `allowTemplates`, and the learning page passes
`false`. Lists the old picker already created are **not deleted**:
`isForeignChecklist` recognises one, the page names it for what it is, and
removing it is the user's decision behind a confirmation.

### The level is the spine

`LearningLevel` already existed as a fact on the page and was used for one chip
and one filter on the list screen. It is now the control the whole detail page
answers to: one rail under the brief, and the notes, the practice list and all
four material panels obey it. Six filters would drift out of step; one does not.

The decision that makes it usable: **absent means general, and general shows at
every level.** Hiding unlevelled material when somebody narrows to "beginner"
would hide the dictionary link and the "where I stopped" note at precisely the
moment they went looking. `matchesLevel` is the single judge, and the UI writes
"general" beside such an item so the two are never confused.

The filter lives in the URL (`?level=`), as does the material panel
(`?material=`) and both list filters (`?group=`, `?topic=`). A refresh, the back
button and a link all land in the same place.

### Material: four panels, one model

Links, documents, pictures and videos are `SavedItem`s attached the ordinary way
— `contextIds` — and which panel they land in is derived from `kind`. What was
missing was the level, and it is **not** on the item: the same video can be
beginner material on one page and the only advanced thing on another. It is a
`LearningResource` record on the page (`learning.resources`).

Removing a resource writes a tombstone (`detachedResourceIds`) and never deletes
the `SavedItem` — verified in the browser with one clip attached to two learning
pages: removing it from English left it on Carpentry and left storage untouched.

Nothing is uploaded. A document is a link and the documents panel says so once.
A picture is an address with a live preview; a broken one shows "the picture did
not load", not artwork. A video is a link plus the platform label the user
chose; no thumbnail is fetched or invented.

### Subjects, without a second categories system

A learning subject is a `ProjectCategory` in its own slice
(`focus.learningTopics`, seeded languages · career · leisure), stored in the
same `PageSummary.categoryId`. That is safe because the projects board scopes
itself to `type === "project"`. The four list edits are now pure functions in
`lib/projectCategories.ts` and are called by both slices rather than written
twice.

### Notes

`ProjectNotes` gained two props — the template set, and an optional level
picker. The learning page passes `LEARNING_NOTE_TEMPLATES` (where I stopped ·
study plan · next steps · worth remembering), so "Budget" and "Measurements" no
longer appear on a page about French. A template fills in a title and a hint and
nothing else; no note is created until the user asks for one.

### Screens

**`/learning`** asks two questions and stops: *am I on this now* (tabs) and
*what is it about* (subject chips). One compact row per page, fifteen at a time
through `PagedList`, secondary actions in an always-visible `OverflowMenu`.
Verified with 56 active and 70 finished pages: 15 rows rendered, "show more"
present, no horizontal overflow at 320px.

**The learning page** leads with the picture, the goal, where you stopped, the
next action and the method, then the rail, then everything that answers to it.
View mode carries no inputs at all (measured: 0 visible form controls);
"I studied today" stays live, because recording something that happened is not
editing.

### What was deliberately not done

- **No `LearningStatus` type.** "On hold" and "paused" are the same fact with
  two names. The tabs are `PageStatus` plus an `all` view.
- **No custom levels.** Three, and the model does not block a fourth later.
- **No template at learning creation**, for the reason above.
- **No sharing UI.** The URL shape is groundwork; there is no server, no user
  and no permission model, so there is no share button. See `FUTURE_ROADMAP.md`.
- **No upload, no metadata fetch, no AI, no new dependency, no new state
  library.**

## What changed in task 11 — Git and GitHub Pages

This task added no product behaviour. Four things changed in the source, each
one required by static hosting and nothing else.

### `HashRouter`, not `BrowserRouter`

GitHub Pages serves static files and has no rewrite rule, so a request for
`/focus/trips/japan-2027` is a 404 before any JavaScript runs — a deep link and
a refresh on a detail screen would both fail. Routing through the fragment
(`/focus/#/trips/japan-2027`) keeps every path the browser actually asks for
pointing at `index.html`.

Nothing else moved: every internal link in the app already goes through
`<Link>` (`CompactRow` renders one; there is not a single raw `<a href="/…">`
in `src/`), so `useSearchParams`, back/forward, direction and language are all
unaffected.

The alternative — a `404.html` that redirects into the SPA — was rejected: it
turns every deep link into a redirect, briefly shows a real 404, and mangles the
query string on the way through. A fragment is honest about where the routing
happens.

### A production `base` of `/focus/`

`vite.config.ts` sets `base` to `/focus/` for a production build, `/` for dev,
overridable with `VITE_BASE_PATH`. `vite preview` inherits the build's base, so
the local preview reproduces the deployed sub-path. Every asset the app uses is
either imported (the SVG thumbs, which Vite inlines as data URIs) or referenced
from `index.html`, so both follow `base` without a code change.

### `AppErrorBoundary` resets to `BASE_URL`, not `/`

The boundary's retry called `window.location.assign("/")`, which under a
sub-path would have left the app entirely and landed on the GitHub Pages root.
It now uses `import.meta.env.BASE_URL`, which is `/` in development.

### A stray nested repository at `client/.git`

`client/` held its own Git repository — one commit, no remote, hundreds of
uncommitted changes. Left in place it would have been committed as a gitlink
and **no client source would have reached GitHub**. It was **renamed**, not
deleted, to `client/.git.disabled-nested-repo`, and that path is gitignored.
Nothing was lost; the directory can be renamed back.

### What was deliberately not done

No `gh-pages` package and no new dependency: the official GitHub Pages actions
do the whole job (hard rule 1). No server deployment — Pages is static, the
Express scaffold is not deployed, and the client makes no HTTP request at all,
so nothing fails when no server is running.

---

## What changed in task 10

Task 9 built the language. This pass fixed the screens where the *structure*
was right and the reading still was not, and finished the four areas task 9
left alone.

### Trips — the route is the thing

A trip said "Japan 2027, 12 days" and then made you open three cards to learn
that it meant Tokyo, then Kyoto, then Osaka. A trip's shape is a sequence of
places with nights in each, so `RouteStrip` draws it as one: nodes on a line,
the connector between two stops standing for the leg of travel, dates and nights
under each name.

Order flows with the writing direction, so in Hebrew the first stop is on the
right and the arrow points left — reading order and travel order agree, which is
what stops an RTL route reading backwards. Below `md` it becomes a vertical
timeline. One stop is a *fact*, not a route: no node, no connector, and no
bordered card, because a single outlined box in an empty row reads as a route
with a piece missing.

**The `overview` tab is gone.** Identity, route, next action, first flight, what
is missing and how the packing is going now sit above the tabs, in
`TripHero` → `RouteStrip` → `TripBrief`. A tab repeating them was the same
screen twice. `TripHero` correspondingly stopped printing the next action and
the readiness meter; `TripBrief` owns them.

Which area a trip *opens* on now depends on the trip: a camping trip and a
finished trip open on their notes, everything else on the itinerary.

### Projects — the category is editable where the project is

`EditPageModal` gained a category picker, including "new category…", writing
through the same `setProjectCategory` the collection screen uses. The detail
header shows the category, a small thumbnail when there is one, and the task
count.

### The overview, on a phone

Capping each section at three was not enough: five sections still stacked to
5,381px with heavy data. The relevance engine's five buckets *are* this screen's
grouping, so each dashboard group now asks `NowCentre` for its own instead of
all five landing under "today" and the same rows being grouped twice. Below `md`
one group shows at a time; above it every group renders and the switch is not
in the DOM at all — the split is CSS, so `display: none` also keeps the hidden
groups out of the accessibility tree.

**Heavy-data overview on a phone: 5,381px → 1,261px.**

### The three areas task 9 skipped

- **Recipe Detail** — the four side panels (notes, tags, source, attached links)
  became one switch. They ran a long way past the method beside them, which is
  the one thing the screen exists to show.
- **Training** — three tabs: sessions, treatments and follow-ups, history.
  Treatments read the *same* `ScheduledItem` slice manage owns; nothing is
  copied and no medical logic was added.
- **Vision Board** — five icon buttons per tile, over the picture and across the
  caption, became one always-visible overflow trigger. The dark surface and the
  picture emphasis are untouched.

### A measurement bug worth recording

`document.documentElement.scrollWidth` **lies in RTL**: an inner horizontal
scroller that overflows leftwards inflates it even when the page cannot be
scrolled at all. Two "overflows" chased in this pass were this artefact. The
harness now presses on the page and checks whether it actually moves.

---

## What changed in task 9 — one language everywhere

Task 8 fixed trips. This applied the same thinking to the rest of the app, and
in doing so turned the trips-specific pieces into shared ones.

### The shared language

Five new primitives in `components/ui/`, plus one moved there:

- **`SegmentedNav`** moved out of `features/trips/`. It is now the app's primary
  tab strip: project categories, manage areas, event groups, learning groups,
  space topics, family profile topics, trip areas, day topics. One control,
  eight uses.
- **`CollectionPage`** — title and one action, at most two layers of narrowing,
  then one list. Two layers is a cap, not a starting point.
- **`PagedList`** — 20 at a time with a real count. `ShowMore` reveals
  *everything* behind one press, which is right for six saved links and wrong
  for seventy finished projects.
- **`OverflowMenu`** — the secondary actions on a row, behind one trigger that
  is **always visible**. A menu findable only by hovering is not an answer.
- **`SearchField`** and **`Thumbnail`**. `Thumbnail` returns `null` when there
  is no picture, so a list of mostly-pictureless things has no column of empty
  squares down it.
- **`CompactRow`** gained a `progress` prop — a number *and* a short bar, drawn
  only when there is something to count.

And one CSS idea: **`.focus-band`** — a label, a hairline, and the content. Most
groups are not cards. `.focus-trip-block` gave every group a border, a white
background and 16px of padding, which turned "next flight" — one row of text —
into a 90px rectangle six times down a page.

### Projects — the structural change

Three columns of ~200px cards became one row per project, a category tab and a
status filter. `TripKind`'s pattern repeats here: **`categoryId` is optional on
`PageSummary`, stored when the user chooses and derived from the space when
absent**, never written back. Categories are a new tiny slice
(`projectCategories`) the user can rename, reorder, add to and delete from —
deletion refused while anything is filed under it, because the alternative is a
destructive move the app chose.

"Blocked" is a filter, never a fifth status.

### Measured effect

| Screen | Before | After |
|---|---|---|
| `/manage` | 2,742px | 900px |
| `/projects`, 11 projects | 1,782px | ~700px |
| `/projects`, 70 finished | (would be ~14,000px) | 1,518px, 20 rows |
| `/spaces/cooking` | 6,358px | 2,057px |
| Trip overview | six white panels | six bands |

---

## What changed in task 8 — trips

Scope was deliberately one domain. Nothing outside `features/trips/`,
`lib/tripShape.ts`, `types/trip.ts`, the trips locales and the trips block of
`index.css` was redesigned; the two shared touches are the `.focus-progress-block`
fix and one new route.

### The problem, stated plainly

A trip rendered six sections stacked down one page: destinations, then every day
of a leg as a card in a masonry grid, each with seven open textareas, then looks,
then the timeline, then packing, then lists, then saved links. An eleven-day
itinerary was a 3,300px page and seventy-seven form fields; a two-night hotel
stay got exactly the same structure. Nothing on it said what mattered now.

### The shape that replaced it: narrowing

**Trip → leg → day → topic**, one at a time at every level, with the level above
still visible so you always know where you are.

- `/trips` leads with the next trip and separates upcoming from finished. Trips
  are **rows**, not cards — twenty cards is four screens of mostly white.
- A trip screen is a compact identity band and then exactly one area. Which areas
  exist is `tripAreas()`, not a fixed list of six.
- An itinerary picks a leg, then a day on a **day rail**, then a topic within it.
- The rail is the one *drawn* element in the domain, and it earns it: a filled
  tick is a day with a plan, a hollow one is a day with nothing, and the gap is
  information no list of day cards can show.

### One model, four kinds of trip

`TripKind` (`abroad` · `hotel` · `weekend` · `outdoors`) is an optional field on
the existing `Trip`. There is no second data model and no fourth screen. It
decides what a trip *leads with*: a camping weekend opens on notes, saved
pictures and a checklist and carries no bookings tab and no outfit planner; a
trip abroad opens on what is booked and what is still missing.

`tripKindOf()` derives a kind for trips stored before the field existed and
**never writes it back** — a migration that guessed one would freeze the guess,
so adding a flight later could never change what the screen leads with.

### View mode reached the day

A day used to be seven permanently-open textareas. It now renders what is
written, as text, under a labelled timeline; one explicit action beside the date
turns the slots into fields and brings out reorder and delete.

### `.focus-progress-block` — the density bug, fixed at the root

The rule carried `flex: 1 1 220px`, written for the checklist panel's header, a
flex **row**, where 220px is a width. Every other caller puts it inside
`.focus-chip-card`, which is `flex-direction: column` — so the basis became a
*minimum height*, and every card with a progress bar carried ~180px of dead
white. The growth now lives on the one row-direction parent that wanted it
(`.focus-checklist-panel__head > .focus-progress-block`), and the block itself
sizes to its content. No replacement `min-height`, nothing hidden with overflow.

### What was reused rather than rebuilt

`Checklist`, `ProjectNotes`, `CompactRow`, `SavedItemCard`, `BoardImage`,
`ShowMore`, `Section`, `PageHeader`, `TripFoodList`, `OutfitBoard`,
`OutfitTimeline`, `PackingSuggestions`, `OutfitFormModal`, `DestinationFormModal`
and `TripEditModal` are all unchanged or lightly adjusted. A trip's notes are
`ProjectNote[]` — the same model a page uses — read through an adapter so the
legacy single `notes` string is never destroyed.

Five components are new, and one of them is not about trips at all:
`SegmentedNav` serves the trip's areas, a day's topics, the outfit planner's
three views, the checklist switcher and the upcoming/past split — one control,
five uses, rather than five strips that drift apart.

---

## What changed in task 7

Ten roadmap sections became working software. The through-line is that almost
none of it is a new system: the areas below are assembled from a handful of new
primitives plus the mechanisms Focus already had.

### One new area, not six

Insurance, subscriptions, income and expenses, appointments, medicines, shopping
and menus all live at `/manage` behind a view filter (`?view=money`). The
alternative — a top-level nav entry each — is the sprawl the 80/20 rule exists to
prevent. Family, Learning and Leisure are one entry each for the same reason,
and Reminders is a header bell rather than a nav item, because it is something
you glance at when it has a number on it.

### Five new models, and what they are not

`ScheduledItem` is the primitive most of ongoing management is made of: a vet
visit, a call to a grandparent, an annual renewal, a follow-up blood test. Those
are the same shape, so there is no `Appointment`, no `ContactReminder`, no
`Renewal` and no `Bill`. What a category genuinely needs beyond the common shape
sits in an optional named block, so a plain reminder is still four fields.

`FamilyProfile` covers adults, children, babies and pets with one model and
opt-in sections — a dog needing vaccinations and a vet is the same *shape* as a
grandmother needing appointments and a shopping list. `Commitment`, `MoneyEntry`,
`Medication`, `LeisureItem`, `Menu` and `QuickLogEntry` complete the set.
`EntityReference` and `RecurrenceRule` are values rather than models, with no
repository of their own.

Reused rather than rebuilt: a **shopping list is a `checklist` page**, a profile's
notes are **`ProjectNote[]`**, a learning page is a **`PageSummary`**, and a
derived birthday is a **`FocusEvent`** — so urgency, countdowns, colour rules and
the events screen all work on it unchanged.

### Birthdays are derived, and that is the whole design

The tempting implementation writes an event per year. It duplicates on every
migration, leaves last year's lying around, and needs a sweep to make next
year's. `birthdayEventFor` computes the next occurrence on every read instead —
nothing is stored, so nothing can duplicate. Verified by reloading `/events`
three times and counting: 3 derived cards each time.

A user's own event claims the `birthday:<profileId>` id and the computed row
stands down. The seeded "יום הולדת לאמא" — which has a restaurant booking, a gift
list and a budget — now uses that id, so the collision rule is exercised by the
demo data rather than only by a test.

**A flag, not the id.** `event.derived` distinguishes them. An earlier revision
sniffed the id prefix, which meant the *real* event was treated as derived: its
title was rewritten to "Mum's birthday" and its card pointed at the profile
instead of its own screen. Caught in the browser sweep, not by a test.

### "What needs you" is a filter, not a projection

Focus can now see nine kinds of thing that could demand attention. Showing all of
them would be a worse inbox than the one the user already ignores. `collectRelevance`
admits a row only once it has *become* relevant — its reminder window has opened,
its date is close, or it is late. An insurance renewal eight months out is not on
that screen, and there is a test that says so.

Five groups, three rows each before "show more", and the whole block renders
nothing on a day when nothing is asking. The bell counts only what is due today
or already owed.

### The compact row layer

A subscription is a name, a price and a date. Wrapping three facts in a bordered
card produced screens where six items filled a laptop display and most of it was
white. `<CompactRow>` has no minimum height, clamps its detail to one line, and
keeps secondary actions quiet-but-reachable — faded on hover-capable pointers,
always visible on touch, and never removed from the tab order.

`<FilterChips>` renders chips above `sm` and a native `<select>` below it, with
exactly one in the accessibility tree at a time: a horizontal chip strip at 320px
either overflows or becomes a scroll surface with no scrollbar.

### Learning, and leisure without AI

A learning page leads with where you stopped and what is next, plus level, goal,
method and `lastStudiedAt` — a separate fact from `lastUpdatedAt`, because tidying
the notes is not studying, and the overview's idle nudge reads the former.

"What suits right now?" is a scoring function: hard constraints filter, what is
left is ranked, and **one** thing is offered with at most two reasons. Nothing is
a real answer and the screen says so. Being offered stamps a cooldown, so the
same film cannot come back every evening for a week.

### Menus that do not double your shopping list

Generating shopping is explicit, states a count first, and merges: items already
on the list are untouched, two dishes needing eggs produce one line, and the menu
records **which** list it wrote to. That last part was a real bug — the list id
lived in component state, so every visit created a second list. Found by the flow
harness, fixed by moving it onto the `Menu`.

### A real test suite

`npm test` was a placeholder. It now runs **266 Vitest tests** over the pure
rules and the migrations. There is deliberately no jsdom and no component test:
everything that can hide information, create a duplicate or fire a reminder on
the wrong day lives in `lib/`, and a suite that rendered every card would be
slower, more brittle and would still not catch any of it.

Two of those files are guards rather than unit tests: translation parity across
all twelve namespaces (including Hebrew's one/two/many/other plural forms and
matching interpolation names), and a source-hygiene scan for physical CSS,
Bootstrap direction utilities, hardcoded UI strings in `placeholder`/`aria-label`/
`title`/`alt`, `window.localStorage` outside its one module, `alert()`, and
`Intl` formatters outside `lib/format.ts`.

## What works right now

Everything from tasks 1–6, plus:

- **Ongoing management** at `/manage`, five views, filter in the URL. Insurance
  and subscriptions with monthly/yearly totals; a month of income and expenses
  with in/out/balance/unpaid and month stepping; appointments, follow-ups and
  today's doses; shopping lists and menus.
- Creating, editing and deleting a commitment, a money entry, a medication, a
  scheduled item, a menu, a menu dish, a family profile, a leisure item, a
  shopping list and a learning page — all persisted, all surviving a reload.
- Marking done, snoozing (3h / 1d / 3d / 1w) and reopening a scheduled item; a
  recurring one advances to its next date instead of completing.
- Ticking a dose; the tick is recorded against the day-and-slot, never a
  timestamp.
- **Family**: profiles for adults, children, babies and pets, with opt-in
  sections that can be renamed, reordered and switched off. Feeds and new foods
  as one-tap quick logs. Deleting a profile keeps the records that point at it
  unless the user explicitly asks otherwise, and the dialog counts them.
- **Birthdays** computed from a birth date, appearing on the events screen, the
  overview strip and a profile, with no stored per-year event and no duplicate
  after any number of reloads.
- **"What needs you"** on the overview and at `/reminders`, the latter being the
  only place that lists what has been snoozed.
- **Learning** at `/learning`: tabs for learning now / on hold / finished / all,
  subject chips, one compact row per page, paged fifteen at a time, both filters
  in the URL. A learning page carries a level, a subject, a goal, a method, a
  picture, notes filed by level, an empty-until-you-write-it practice list, and
  four material panels — links, documents, pictures, videos — over the existing
  `SavedItem` model, every item optionally filed under a level. One rail at the
  top filters all of it; unlevelled material is general and stays visible.
  Removing material from a page never deletes the saved item. "I studied today"
  is one tap and stays available in view mode.
- **Leisure** with tag filters and a one-suggestion rules engine that can decline
  to suggest anything.
- Global search reaches profiles, scheduled items, commitments, menus and
  leisure items, grouped by kind, with health details withheld from the preview.

- Every modal scrolls its body and keeps its header and footer reachable, at
  every width from 320px up, with the background locked and focus trapped.
- Project pages carry as many notes as the project needs and none when it needs
  none; notes can be added from a template or blank, renamed, reordered and
  deleted, and survive a reload.
- Projects written before this change still open with their content intact,
  read through the legacy adapter.
- A project can carry a vision picture and dated progress pictures, from an
  address, a saved item or a page link.
- Checklist pages render as checklists: notes, inspiration and the list, no
  tabs and no project rubrics.
- Events show a prominent countdown and one of five states, in words as well as
  colour; reminders come due, surface on the overview, and can be handled or put
  off.
- The cooking board holds 60 cards without stretching any of them, and has a
  grid view for finding one recipe among many.
- Events and recipes read cleanly and edit deliberately.
- Trip facts, flights, stays, destinations and days are all editable and
  persist; Cancel in the trip modal discards.
- Outfits: create from an image address, a saved item or a Pinterest link;
  assign to one or several days; mark one chosen per day; add garments; reorder;
  delete.
- The outfit timeline covers every day of the trip and highlights the ones with
  no look; packing suggestions merge repeated garments and list the days each is
  needed for.
- A broken picture anywhere shows the same neutral placeholder, and can be
  fixed from the form it came from.

**Server** (`http://localhost:5001`, from `server/.env`) — untouched this task.
`server/src/index.ts` falls back to 3000 only when `PORT` is unset, which is not
how this repository runs; `CLAUDE.md` and the Vite proxy previously quoted the
fallback and have been corrected. Behaviour was not changed.

## What is still mock

Learning specifically: the nine seeded learning pages, the English page's eight
saved items (two links, one document link, two picture addresses, three video
links) and its notes are all demo data. The document is a **link**, not a file —
there is no upload anywhere in the app. The picture addresses point at Unsplash
and the video links at the platforms' own home pages; no metadata, title or
thumbnail is fetched from any of them, and the platform label is the user's own
answer. Sharing, accounts and server integration do not exist in any form.

- **Seed data** — `client/src/mocks/`: pages, routines with generated history,
  events, saved items, recipes and places, checklists, vision boards, and one
  fully planned trip (Japan 2027) including four outfits. Dates are generated
  relative to load time.
- **All user changes are `localStorage`**, under **23** `focus.*` keys plus the
  language preference (`lib/storage/keys.ts` holds 24 entries in all). The newest
  is `focus.learningTopics`; the count in earlier revisions of this document was
  one short, and is corrected here. Per-browser, per-profile, a stand-in for the API. Project
  notes and pictures are stored inside `focus.pages.overrides`; event
  preparation windows and reminders inside `focus.events`. The eleven new keys
  are `scheduled`, `commitments`, `money`, `medications`, `family`, `quickLog`,
  `menus`, `leisure`, `leisure.suggestion`, `templates.recent` and `pages.own`.
- **New seed data**, all invented: five family profiles (two parents, a
  grandmother, a baby and a dog), ten scheduled items, five commitments, six
  money entries, two medications, six quick-log entries, two menus, six leisure
  items and two learning pages. Nothing medical in it is real — no real medicine
  name, no real dose, no real vaccination schedule — because a demo that prints a
  plausible prescription is a demo somebody will eventually act on.
- **Reminders are local only.** They appear while Focus is open and nowhere
  else. There is no push infrastructure, no service worker and no server, and
  the UI says so wherever a reminder is shown.
- **The client makes no API call.**
- **Pictures**: 18 local SVG illustrations for seeded items; URL images are real
  addresses that are loaded but never downloaded. **No metadata is fetched** from
  TikTok, YouTube, Instagram or Pinterest — a Pinterest link is stored and shown
  as a link, with no thumbnail invented for it.
- **Documents** (training plans, materials) are `SavedItem`s of kind `document`
  with no file behind them.
- **Sharing does not exist** in any form. See `docs/FUTURE_ROADMAP.md`.
- **No bank, no health fund, no appointment booking, no AI.** Every financial and
  medical value in the app is text somebody typed, repeated back unchanged.
- **Documents are links.** Where the interface offers "a document" it says it
  means a link to one. Nothing is uploaded and no file is stored — no Base64, no
  blob in `localStorage`.
- **Picture addresses in the seed** point at real remote images (Unsplash), plus
  one deliberately unresolvable address on the painting project, kept as the
  standing test that a broken picture shows a placeholder rather than artwork.

## Not implemented yet

Backend API · MongoDB · Firebase · auth · users · shared family accounts ·
permissions between family members · server persistence · real file upload ·
cloud storage · real link previews · metadata fetch · OCR · image recognition ·
AI of any kind · push notifications · service worker · calendar sync · bank
connection · health-fund integration · online appointment booking · maps ·
sharing · PDF export · presentation mode.

All deliberately out of scope; the ideas that have been thought through are in
`docs/FUTURE_ROADMAP.md` and appear nowhere in the app — no entry point, no
disabled button, no "coming soon".

**Server tests do not exist.** `npm test` runs a real Vitest suite for the client
and the server's script is still `echo "No server tests yet"`. Do not report that
half as passing.

---

## Architecture decisions

Decisions 1–85 still stand. New in task 12:

**86. A level is a lens over one screen, not a folder.** One control filters the
notes, the practice list and all four material panels. The alternative — a
filter per section — is four controls that can disagree about what the user is
looking at.

**87. Unlevelled content is general and shows at every level.** Absent means
"applies throughout", not "not filed yet". This is what stops the filter hiding
the dictionary link exactly when somebody narrows down to find it. The UI labels
it, so the user is never guessing which meaning is in play.

**88. The level of a resource belongs to the pairing, not to the item.**
`LearningResource` lives on the page. Putting `level` on `SavedItem` would be
wrong the moment the same video is attached to two learning pages.

**89. Removing a resource is a tombstone.** `detachedResourceIds` takes an item
off one page and deletes nothing. "Take this off my English page" and "delete
this video" are different requests, and only the user makes the second. It is
also what makes removal work on seeded material, which cannot be edited.

**90. A template belongs to one domain.** `ChecklistSection.allowTemplates`
exists because the app-wide picker let a learning page create a supermarket
list. Where the right templates do not exist, an empty thing the user fills is
the honest answer — and a learning page therefore offers no template at
creation.

**91. A list from the wrong domain is named, not deleted.** No migration removes
the shopping lists the old picker created. `isForeignChecklist` recognises one,
the page says what it is, and removal is a confirmed user action. Destroying
somebody's data to tidy up after the app is not a migration.

**92. Learning subjects are the same model in a different list.**
`ProjectCategory` in `focus.learningTopics`, stored in the shared
`PageSummary.categoryId`, safe because the board scopes to `type === "project"`.
One model, two lists. The four list edits moved into `lib/projectCategories.ts`
so they are called twice rather than written twice.

**93. Every learning filter is in the URL.** `?group=`, `?topic=`, `?level=` and
`?material=`. It is what makes a refresh and the back button work today, and it
is the shape a shared "English · beginner · view only" link would need later.

New in task 11:

**82. The published demo routes through the fragment.** GitHub Pages has no SPA
rewrite, so `HashRouter` is what makes a deep link and a refresh work. A
`404.html` redirect trick was rejected: it flashes a real 404 and rewrites the
URL behind the user's back.

**83. The deployment builds the client only.** The server is a scaffold, is not
deployed, and is not needed — the client makes no HTTP request. A "deploy" that
quietly dropped half the repository would be worth saying out loud, so it is
said here and in the README.

**84. `base` is a build-time decision, not a runtime one.** `/focus/` for a
production build, `/` for dev, `VITE_BASE_PATH` to publish elsewhere. Nothing in
the source hardcodes the sub-path; anything that needs it reads
`import.meta.env.BASE_URL`.

**85. A nested repository is renamed, never deleted.** `client/.git` was
somebody's history. Renaming it out of the way is reversible; `rm -rf` is not.

New in task 10:

**61. A trip screen has no overview tab.** Everything an overview held sits above
the tabs. A tab is for content you choose to look at, not for a summary of the
screen you are already on.

**62. The route strip is the trip's one drawn element.** A sequence of places is
a route, and no list of cards can show a sequence. One stop gets no drawing at
all.

**63. Which area a screen opens on is a property of the thing, not the screen.**
A camping trip opens on notes; a trip abroad opens on its itinerary; a finished
trip opens on what to change next time.

**64. The overview's phone grouping is the relevance engine's own buckets.** Not
a second grouping over the same rows.

**65. Never trust `documentElement.scrollWidth` in RTL.** Ask whether the page
scrolls.

Decisions 1–60 from tasks 1–9:

**54. Two layers of narrowing, and no more.** A primary tab for *which kind* and
a secondary filter for *which state*. A third would mean a screen where the user
has to hold three choices in their head to know what they are looking at.

**55. A collection's archive is paged, not disclosed.** `PagedList` grows the
list in fixed steps and states the total. `ShowMore` still exists for short
lists where revealing everything is the point.

**56. Secondary row actions live in an always-visible overflow menu.** Five icon
buttons per row are five things competing with the row's content and five 30px
targets on a phone. The trigger never fades: `.focus-dense-row__actions
.focus-overflow__trigger` overrides the quiet-actions opacity rule on purpose.

**57. `categoryId` follows `TripKind`.** Optional, stored on choice, derived on
absence, never migrated in. The two together are now the app's standard way to
add a classification without freezing a guess.

**58. A category holding projects cannot be deleted.** Deleting it and moving its
projects somewhere the app picked is a destructive operation dressed up as
tidying. The count sits on the disabled control so the reason is on screen.

**59. A space is a filtered way in, not a dashboard.** Space sections are grouped
into topics and shown one at a time, and the work topic links through to that
space's category on the projects screen rather than reproducing the board.

**60. Renamed query values keep their old spellings working.** `?view=all` and
`?view=dates` still resolve. A stored bookmark must not land on a blank screen
because tabs were renamed.

Decisions 1–53 from tasks 1–8:

**48. A trip's areas are computed, not listed.** `tripAreas()` shows an area when
it holds something, or when the kind of trip says the user will want to fill it
in. Six fixed tabs meant a camping weekend carried an empty bookings tab and an
outfit planner nobody asked for. Once a trip is over the second clause drops:
"you will want to fill this in" is a claim about the future.

**49. `TripKind` is stored when chosen and derived when absent.** It is optional
on `Trip`, and `tripKindOf()` reads a sensible answer off the trip itself. A
migration that wrote a guess in would freeze it — the answer could never improve
as the trip filled in. Consistent with decision on derived birthdays: nothing
derived is stored.

**50. A trip's notes are `ProjectNote[]`, behind the same adapter a page uses.**
`noteBlocks === undefined` means never edited, and the legacy single `notes`
string is read as one block; `[]` means the user deleted every block. The two are
never collapsed, and the old string is never destroyed.

**51. Extra trip checklists hang off the original key.** The trip's own list keeps
`trip:<id>`, because packing suggestions write into it and a stored list must
never be orphaned by a key rename. Extra lists are `trip:<id>:<n>`, discovered by
prefix — no new model, no id stored on the trip.

**52. Bookings are edited one at a time.** Flights and stays moved out of the
trip's edit modal, where they were two repeating lists that grew a row per
booking, into `BookingFormModal` — one booking, six facts, Cancel discards.

**53. One segmented control, five uses.** `SegmentedNav` is the trip's areas, a
day's topics, the outfit views, the checklist switcher and the upcoming/past
split. `collapse` swaps the strip for a `<select>` below `sm`, with exactly one
of the two in the accessibility tree — the same rule `FilterChips` already
follows.

Decisions 1–47 from tasks 1–7:

**43. A screen opens in view mode.** Edit affordances appear only after an
explicit action next to the title. Showing a delete button and an open textarea
beside every line makes a plan for a dinner look like a content management
system.

**44. "Done editing", not a fake Save.** Edits persist through the repository as
they are made, so a Save button would be theatre. The trip modal is the
exception — it holds a draft, so Cancel genuinely discards.

**45. Event items keep their own storage and borrow the shared component.**
`lib/eventChecklist.ts` adapts a section's `EventTask[]` to a one-group
`Checklist` and back. Migrating the storage would mean rewriting stored events
and minting an owner id per section for no visible behaviour. Debt recorded
below.

**46. Section width is configuration, not a function of item count.**
`SPACE_SECTIONS` entries may carry a `span`, because "stuck beside active, then
parked beside saved" is a layout decision about meaning, which a card count
cannot express.

**47. Artwork is never a fallback for a failed remote picture.** A drawing where
a photograph should be looks like the photograph, and the user never learns the
link is broken. Seeded artwork is used only for items that have no URL at all.

**48. Reordering a day swaps dates.** Days display in date order; a separate
order field would let the itinerary and the calendar tell different stories.

**49. Trip collections are replaced whole through `updateTrip`.** The forms
already build the new array. Eight narrow mutators would be more code and more
ways for destinations, days, stays and outfits to disagree.

**50. Packing quantities are stored in the item's note, not its text.**
Appending "×2" to the words breaks the "already on the list" comparison and adds
a duplicate on the next run — found by the acceptance tour, fixed here.

**51. Packing derivation is one-way.** Suggestions are added on request only,
and nothing ever reaches back to delete a checklist item when a look changes.
Once an item is on the list it is the user's line.

**52. The modal fix is CSS on the shared surface, not nine rewrites.** The form
wrapper is what breaks the flex chain, so the form is made layout-transparent.
Restructuring nine dialogs to move `<form>` inside would have risked nine submit
handlers to fix one stylesheet problem. Applied to every modal, not only the
`scrollable` ones, so the class of bug cannot come back.

**53. Notes replace prose rubrics; four fields stay structured.** The dividing
line is whether anything other than the page reads the field. `currentState`,
`stoppedAt`, `blocker` and `nextAction` feed the overview and the board, so they
stay fields. The six narrative rubrics fed nothing, so they are notes. This is a
deviation from a literal reading of the brief, which listed "current state" and
"next action" among the rubrics to replace: converting those four would have
emptied the overview's attention and resume sections and broken `isBlocked()`,
both of which `CLAUDE.md` treats as load-bearing.

**54. The legacy conversion is an adapter, and lazy.** Nothing is rewritten on
load and no legacy field is dropped. `notesForPage` reads the old fields only
when a page has no notes of its own; the first edit persists the derived list.
An empty rubric never becomes an empty note.

**55. `notes: undefined` and `notes: []` are different.** Absent means "never
edited, read the legacy fields"; empty means "the user deleted them all". A
migration that defaulted `notes` to `[]` would silently wipe every project
written before this task.

**56. `STORAGE_VERSION` was deliberately NOT bumped.** `CLAUDE.md` says to bump
it when a stored shape changes, and a mismatched payload is discarded. Every
change this task made is an **additive optional field** handled by a migration,
and bumping the version would have deleted every user's existing data to avoid
guessing at data that needed no guessing. Bump it when a field changes meaning
or type, not when one is added.

**57. Event urgency is a function of stated preparation, not of the calendar.**
`prepDaysBefore` absent means "nothing to prepare" and keeps an event neutral
until the week before. A flight and a milestone birthday the same distance away
are not equally urgent, and only the user knows which is which.

**58. Reminders are honest about being local.** Every surface that renders one
also renders the limitation. The alternative — a reminder that looks like a
phone notification and never arrives — is worse than not having the feature.

**59. The cooking grid is a view, not a second board.** Same cards, same
filters, same data; only the arrangement differs, and the order arrows are
disabled in it because a grid has no column for order to mean anything in.

---

**60. Ongoing management is one nav entry with five views, not five entries.**
Insurance, subscriptions, money, health and shopping are one question asked five
ways. The view lives in `?view=`, so a refresh and a link both land on the same
screen. Same reasoning for Family, Learning and Leisure being one entry each.

**61. `ScheduledItem` is one model for ten categories.** A vet visit, a call to a
grandparent, a renewal and a follow-up are the same shape. Four models with the
same five fields would have been four ideas of what "snoozed" means. Category
extras live in optional named blocks (`appointment`, `money`) so the type does
not become a god object.

**62. `snoozed` and `cancelled` are separate states, not variants of
`completed`.** A snoozed item is still owed; a cancelled one will never happen.
Collapsing either would put things in "done" that were never done.

**63. Recurrence covers six kinds and stops.** No RRULE parser. `custom` is the
escape hatch, and completing a `custom` item completes it rather than inventing
the next date — the user said they would choose it.

**64. Recurrence counts from the anchor, not from today**, and clamps month-ends
rather than overflowing. A monthly charge on the 4th marked paid on the 9th moves
to the 4th; 31 January plus a month is 28 February, not 3 March.

**65. Birthdays are derived on every read, never stored.** A birth date is a
fact; the birthday is arithmetic. Nothing is stored, so nothing can duplicate
after a reload or a migration, and there is no sweep to create next year's.

**66. A stored event may claim the `birthday:<id>` slot and win**, and
`event.derived` — not the id — says which is which. The id is the slot; a real
event that occupies it keeps its title, its sections and its own screen.

**67. Relevance is a filter.** A row reaches the overview only once it has become
relevant. Five groups, three rows each, and nothing at all on a quiet day. The
bell counts only `today` and `waiting`.

**68. Focus records; it never interprets.** No dose calculated or suggested, no
reaction assessed, no vaccination schedule generated, no bank connection, no full
card numbers. `dosage` is free text precisely so nothing can compute with it. The
disclaimer appears once per claim, never per row.

**69. Deleting a family profile does not cascade by default.** Records point at
it by weak reference; removing "Luna" must not empty next Tuesday. The dialog
counts the affected records and offers the cascade explicitly.

**70. `FamilyProvider` nests inside `ManageProvider`.** The cascade reaches
scheduled items and medications through `useManage`, not by opening the same
repositories a second time — two providers over one repository would each be
authoritative and neither would see the other's writes.

**71. A shopping list is a `checklist` page.** Not a new entity. Ticking,
groups, templates, progress and the detail screen all already existed.

**72. A menu records which list it wrote into (`listPageId`).** Without it,
"create a shopping list" made a *new* list on every visit, so the merge's
no-duplicates guarantee applied to a list nobody was reading. Found by the flow
harness.

**73. Page creation needed its own slice (`focus.pages.own`).** An override
describes a change to a page that exists; a page stored only as a diff would
vanish if the override map were cleared.

**74. `learning` is a seventh page type, not a flag on `project`.** The screen it
opens is genuinely different — it leads with where you stopped — and it carries
four facts no other project has. There is no LMS, no grade and no percentage.

**75. `lastStudiedAt` is separate from `lastUpdatedAt`.** Tidying the notes moves
the latter, and tidying is not studying. The overview's idle nudge reads the
former, or it would never fire.

**76. "What suits right now?" is a scoring function, not a model.** Hard
constraints filter, the rest is ranked, one thing is offered, and returning
nothing is a real answer. Cooldown state lives on the item, so it cannot be
orphaned by a migration.

**77. The suggester is not memoised by context.** An earlier version cached the
last answer per set of inputs, which broke the one interaction the card exists
for: "suggest something else" returned the identical idea because the inputs had
not changed. Found in the browser, not by a test.

**78. `.focus-dense-row`, not `.focus-row`.** The latter already belonged to the
overview's attention rows — a grid of bordered cards — and reusing it put two
rule sets in conflict, so every dense row hugged its content instead of filling
the list. A spacing bug that was really a naming bug.

**79. Secondary row actions fade, never disappear.** `opacity`, not
`display: none`, so they stay in the tab order and the accessibility tree; and
they are always fully visible on any device without hover.

**80. Vitest covers `lib/` and the migrations, and no components.** Everything
that can hide information, create a duplicate or fire a reminder on the wrong day
is a pure function. Two suites are guards rather than unit tests: translation
parity and source hygiene.

**81. Tests compile under their own `tsconfig.test.json`.** It is the only
project with Node's types, which is what stops `fs` becoming reachable from a
React component. `@types/node` was added as a dev dependency for exactly this —
the one new package in this task.

## Current blocker

**None.**

The task-11 blocker is resolved: GitHub Pages was switched to "GitHub Actions"
as its source, the workflow now completes, and
<https://tomer0017.github.io/focus/> is live and was verified in a real browser
this task — see below.

Nothing in the product is blocked. Task 12 is complete and verified both
locally and against the published site.

## Recommended next action

**Audit the remaining template pickers for the same domain leak the learning
page had.**

One task, and it is the direct generalisation of the defect this task fixed.
`ChecklistSection` now has `allowTemplates`, but the *unfiltered* list is still
what trips, events and projects see: a trip's packing list is offered the weekly
supermarket shop, and a project is offered a camping list. `ChecklistTemplate`
already carries a `category` and `mocks/checklistTemplates.ts` already exports
`templatesFor` — nothing needs inventing, the filter simply is not wired up.

The work is to replace `allowTemplates: boolean` with the category the screen
actually wants, pass it from the four call sites, and add the test that a
shopping template can never be offered where a packing list belongs. Small,
testable, and it closes the class of bug rather than the one instance.

*(Previously recommended, still true and still worth doing after the above:
bring `EventSection` items onto the shared `Checklist` model and delete
`lib/eventChecklist.ts` — the last model that dodged the 80/20 rule.)*

### The earlier recommendation, unchanged

**Bring `EventSection` items onto the shared `Checklist` model.**

One task, and the last real duplication left in the domain. `lib/eventChecklist.ts`
adapts a section's `EventTask[]` into a one-group `Checklist` and back on every
render (decision 45). It works, but it means events are the only place in the app
where a tickable list is not a `Checklist` — so the checklist provider, its
templates and its progress helpers all stop at the event boundary, and every
future checklist feature has to be written twice or explicitly skipped for
events.

The work is a migration that mints an owner id per section (`event:<id>:<section>`),
moves the items across, and deletes the adapter. It is well-defined, testable with
the suite that now exists, and touches nothing else.

Explicitly **not** the API, and not for the reason it was declined last time. The
local core is stable and the tests are real now, so the case is stronger — but the
storage seam has not moved: every slice still sits behind one `Repository<T>`
interface, so the swap is no harder later. Cleaning up the one model that dodged
the 80/20 rule is worth more than starting a second tier while a known duplication
is still in the domain.

---

## Verification performed for this task (task 12)

**Toolchain, all clean** — `npm run typecheck` (client + server),
`npm run lint`, `npm run check:links`, `npm run build` (client + server), and
**Vitest: 359 passing / 19 files**, up from 324. New: `lib/learning.test.ts`
(35 tests — level matching, the general rule, group mapping, subject labelling,
note templates, panel routing, resource resolution, filing, tombstones, and the
foreign-checklist detector) and eight new migration tests covering the learning
subject slice and learning pages already in storage. The server still has no
tests and its script is still a notice; that half is **not** reported as
passing. `legacy/` untouched.

**Headless Chrome against the dev server, real interaction, 0 console errors and
0 failed requests.** Two languages × five widths (1440 · 1024 · 768 · 375 ·
320) × nine states (the three list tabs, the page at all levels and at each of
beginner and intermediate, and the videos, pictures and documents panels) — 90
page loads. Every one: **no horizontal overflow, no raw translation keys**,
`dir` correct (`rtl` for Hebrew, `ltr` for English).

Measured, not assumed:

- **The level filter narrows.** Notes 3 → 2 → 2 → 1 across all / beginner /
  intermediate / advanced; links 2 → 2 → 1 → 1. General material stayed visible
  at every level, which is the behaviour the rule exists for.
- **View mode carries no inputs**: 0 visible form controls on the page.
- **Notes**: added one from the "next steps" template, 4 notes, survived a
  reload.
- **Material**: added a link in edit mode; it was present after a reload.
- **Videos**: 3 tiles, **0 `<img>` elements** — no thumbnail invented for any
  platform.
- **Pictures**: both seeded addresses loaded; a deliberately broken address
  rendered the neutral placeholder reading "התמונה לא נטענה", with no artwork
  substituted, and the inline error appeared in the form before saving.
- **Removal is not deletion**: one clip attached to both the English and the
  Carpentry pages. Removed from English → gone from English, still on Carpentry,
  still in `focus.savedItems`, and the removal recorded as one tombstone.
- **The foreign list**: a `shop-weekly` checklist written straight into
  `focus.checklists` under `page:learning-english` was flagged as belonging to
  another part of Focus, was **not** rendered as a practice list, and was removed
  only after a confirmation.
- **Scale**: 50 extra active + 70 extra finished pages injected. 15 rows
  rendered, "show more" present, the honest total shown ("15 of 56"), and no
  horizontal overflow at 320px.
- **The create modal**: at 320×568 the footer is on screen and the body scrolls;
  Escape closes it and nothing is created.

**The published site, verified after the deploy.** The same 90-load sweep was
re-run with `BASE=https://tomer0017.github.io/focus` and returned the same
result: **0 problems, 0 console errors, 0 failed requests**, no horizontal
overflow at any width in either language. Additionally, on the live origin:

- `#/learning` entered **directly by URL**, then reloaded — both render.
- Opening English from a row, then Back and Forward — the level filter is
  restored from the URL and the "beginner" chip comes back active.
- Assets load from `https://tomer0017.github.io/focus/assets/…`. **Zero
  requests to `localhost:5001`** or anywhere else.
- "I studied today" persisted across a reload, in `focus.pages.overrides` on the
  live origin.

One behaviour worth recording rather than discovering later: the level, subject,
group and material filters are written with `replace: true`, so changing a
filter does **not** add a history entry. Back leaves the page rather than
stepping through filter states, which is the intended trade — a history full of
filter changes is a back button that stops working as a way out.

**Not verified, and not claimed.** No screen-reader pass. No touch-device
testing on real hardware. No axe/Lighthouse audit. Keyboard reachability was
designed for (`OverflowMenu` is always visible, actions stay in the tab order)
but was **not** measured with a tab-order walk this task. The live GitHub Pages
site is covered separately below.

## Verification performed for task 11

**Toolchain, all clean** — `npm run typecheck` (client + server),
`npm run lint`, `npm run build` (client + server), `npm run check:links`, and
**Vitest: 324 passing / 18 files**, which includes translation parity, the
hardcoded-string scan and the storage migrations. The server still has no tests
and its script is still a notice; that half is not reported as passing.
`legacy/` untouched.

**Deployment rehearsal, not a preview server.** `vite preview` refuses a request
carrying `Sec-Fetch-Dest: script` for the built bundle (a preview-middleware
quirk in Vite 7.0.4, reproducible with `curl -H`), which makes it useless as a
stand-in here. The build was instead copied to `<tmp>/site/focus/` and served by
`python3 -m http.server` — plain static, no SPA fallback, which is exactly what
GitHub Pages is. `/focus/trips/japan-2027` returns **404** on that server, and
that 404 is the whole reason for decision 82.

**Headless Chrome against that static server, 33 page loads, 0 problems:**

- Root, `#/trips`, `#/trips/japan-2027`, `#/pages/sorcol`, `#/projects` and
  `#/manage?view=money` all entered **directly by URL** — every one rendered
  (`h1` correct, root text 489–3,324 chars).
- Refresh on `#/trips/japan-2027`: same URL, still rendered.
- Back and forward both move the URL and restore it.
- Images: 3 loaded, 0 broken, 55 inline `<svg>`. The thumb SVGs are inlined as
  data URIs by the build, so they cannot 404 under a sub-path.
- Hebrew → `lang="he" dir="rtl"`, English → `lang="en" dir="ltr"`.
- `localStorage` survives a reload; `focus.*` keys intact.
- 375px and 320px × Hebrew and English × root / trip / project: **zero
  horizontal overflow.**
- **0 console errors, 0 failed requests, 0 requests to the API port.**

**Not verified in this task** — the live GitHub Pages URL, which cannot be
checked until the workflow has run. See "Current blocker".

---

## Verification performed for task 10

**Toolchain** — TypeScript, ESLint and the production build clean, both sides.
**Vitest: 324 passing** (up from 321; the trip-area tests were rewritten for the
removed `overview` area and gained four cases about which area a trip opens on).
`check:links`, translation parity and the hardcoded-string scan clean.
`legacy/` untouched, verified by mtime.

**Browser sweep** — 25 routes × 5 widths × 2 languages = **250 page loads: zero
horizontal overflow, zero console errors.**

**Trip scenario matrix** — 7 shapes × 3 widths = 21 loads, all clean: one stop,
three stops, ten stops, no cover picture, a broken cover address, no flights and
no hotel, and a 20-day leg. Stop and connector counts verified per case (ten
stops → nine connectors; one stop → none).

**Heavy data** — 30 active + 70 finished projects, 50 events, 30 reminders, 40
saved items:

| Route | Desktop | Phone |
|---|---|---|
| `/` (overview) | 2,418px | **1,261px** (was 5,381px) |
| `/projects` | 1,195px | 1,959px |
| `/projects?status=completed` (70) | 1,518px | 2,701px |
| `/manage` | 800px | 1,045px |

**Interaction checks, all passing** — the project header shows its category;
changing it from inside the project saves, survives a refresh and moves the
project on the collection screen; creating a category from the project applies
it; the route sits above the tabs with every stop; no overview tab remains;
pressing a stop moves the itinerary to it and exactly one stop is active; only
one dashboard group is visible on a phone. Plus task 9's thirteen checks, re-run
and passing.

**Cooking drag and drop — tested with a real pointer this time.** Press, eight
intermediate moves, release: the card lands in the target column and the move
survives a refresh.

**Not verified**

- Rendering is still not unit-tested — no jsdom, by the standing decision.
- The new design-sync previews were **written but not captured or graded**; no
  sync run was made.

## Known technical debt

1. **Still not a git repository.** `git init` is refused by the sandbox (`.git`
   is not writable under the current policy). Highest-priority item; needs to be
   run by hand.
2. ~~No test framework.~~ **Resolved this task.** 266 Vitest tests cover `lib/`,
   the migrations, translation parity and source hygiene. What remains uncovered
   is rendering, deliberately — see CLAUDE.md → Testing. The **server** still has
   no tests at all.
3. ~~`CLAUDE.md` says the server runs on port 3000.~~ **Resolved this task.**
   The docs and the Vite proxy now say 5001, which is what `server/.env` sets.
   The code's fallback to 3000 when `PORT` is unset was left alone: changing it
   is a behaviour change nobody asked for.
4. **Event items are still not in the checklist repository.** They render through
   the shared component via an adapter, so they cannot be templated, copied
   between events, or counted alongside other checklists. Decision 45, and now
   the recommended next action — it is the last model that dodged the 80/20 rule.
5. **Drag and drop was not re-verified with a real pointer this task.** The code
   is unchanged; the check is not fresh.
6. **`notesForPage` runs on every render of a project page.** A small reduce over
   six fields, not memoised inside the module; call sites wrap it in `useMemo`.
7. **The note editor has no undo**, and neither does deleting a quick-log entry
   or a menu dish. Deleting a *profile*, a commitment, a medication, a money
   entry, a scheduled item and a menu all confirm first. The line drawn is
   "cheap to retype" versus "takes other records with it", but it is an asymmetry
   a user could reasonably be surprised by.
8. **Progress pictures and profile photos cannot be uploaded**, by design: an
   address, a saved item, or a link.
9. **The headless browser wedges** after enough navigations, so verification and
   screenshots run in several passes, each recycling its page target.
10. **`legacy/` folders remain** (26 files), excluded from all tooling and
    verified unchanged this task.
11. **`showcase` renders as a normal page.** Designed, not built.
12. **Bundle ships all of Bootstrap's CSS** and is now 888 kB raw / 255 kB
    gzipped, past Vite's 500 kB advisory. Every new screen is in the main chunk;
    route-level `React.lazy` is the obvious answer when this starts to matter.
13. **`ScheduledItem` has ten categories and two optional blocks.** It is the
    right trade today, but it is the type most likely to accrete fields. If a
    third block appears, that is the signal to split rather than to add.
14. **The manage screen's `all` view renders every panel.** On a machine with
    hundreds of records that is more DOM than it needs; each panel caps its own
    list at five or six rows, so it is bounded, but it is not virtualised.
15. **`focus.quickLog` grows without bound.** Feeds accumulate a handful of rows
    a day and nothing prunes them. Fine for a year; worth a retention decision
    before it is not.

## Completed steps

- [x] Tasks 1–5 (foundation, i18n/RTL, entities and screens, stabilisation, the
      Outfit Planner).
- [x] Task 6 (the modal scroll fix, flexible project notes, project pictures,
      the checklist page view, event preparation windows and local reminders,
      cooking density, and the roadmap that this task then implemented).
- [x] Task 7 step 1: the shared core — `EntityReference`, `RecurrenceRule`,
      `ScheduledItem`, `QuickLogEntry`, and the rules in `lib/recurrence.ts` and
      `lib/scheduled.ts`.
- [x] Task 7 step 2: the compact layer — `CompactRow`, `FilterChips`,
      `ShowMore`, `InfoNote`, `Avatar`, `StatRow`, `TemplatePicker`,
      `ConfirmDialog`, `RecurrenceField`, `TokenListField`, `WeekdayField`.
- [x] Task 7 step 3: ongoing management — insurance, subscriptions, income and
      expenses, appointments, follow-ups, medicines, shopping lists, menus, and
      quick create.
- [x] Task 7 step 4: family profiles, opt-in sections, quick logs for feeds and
      new foods, and non-cascading deletion.
- [x] Task 7 step 5: derived birthdays, and the collision rule that lets a real
      event win.
- [x] Task 7 step 6: the relevance engine, the overview's "what needs you", and
      the reminder centre behind the header bell.
- [x] Task 7 step 7: learning pages and the 80/20 refresher list.
- [x] Task 12: learning rebuilt around the level — the list screen, the page,
      four material panels over `SavedItem`, learning-only note templates, the
      subject slice, and the removal of the cross-domain template picker.
- [x] Task 7 step 8: leisure, tag filters and the rules-based suggester with
      cooldown.
- [x] Task 7 step 9: search across the new slices, with health details withheld
      from previews.
- [x] Task 7 step 10: eleven repositories and their migrations; bilingual seed
      data for every new area.
- [x] Task 7 step 11: Vitest — 266 tests, including translation parity and
      source hygiene.
- [x] Task 7 step 12: verification (190 renders, 30 interactive flows, 92
      screenshots) and the five defects it caught.
- [x] Task 7 step 13: documentation — `CLAUDE.md`, `ARCHITECTURE.md`,
      `PROJECT_STATE.md`, and `FUTURE_ROADMAP.md` rewritten so it no longer
      describes things that now exist.

## Next steps

**The one recommended next action: scope every checklist template picker to the
domain it serves** — see "Recommended next action" above. After that, move
`EventSection` items onto the shared `Checklist` model and delete
`lib/eventChecklist.ts`.

It is the last model that dodged the 80/20 rule. Events are the only place where
a tickable list is not a `Checklist`, so the checklist provider, its templates
and its progress helpers all stop at the event boundary — and every future
checklist feature has to be written twice or skipped for events. The work is a
migration minting an owner id per section, and the test suite to check it now
exists.

Then, in order:

- [ ] Route-level code splitting, once the bundle starts to matter.
- [ ] Move shared types out of the client into `shared/`.
- [ ] `GET /api/pages` + TanStack Query.
- [ ] Then, and only then: MongoDB, followed by Firebase Authentication.
