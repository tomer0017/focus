# Project State

Living document. **Update this at the end of every development task.**

**Last updated:** 2026-08-22
**Task completed:** Task 12 — the learning area rebuilt around a level and the
material collected at each one: a new list screen, a new page, learning-only
note templates, four material panels over the existing `SavedItem` model, a
learning-subject slice, and the removal of the template picker that let a
supermarket list be created as a study plan.

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
