# Data model — audit, consolidation and the shape MongoDB will take

This document is the answer to one question: **what is stored, who owns it, and
how does a screen ask for exactly the part that belongs to it?**

It exists because of a concrete failure. `Trip North` — a camping packing list —
appeared on the household **Shopping & Menus** screen, next to the weekly
supermarket run. Nothing was broken in the rendering. The query was wrong: the
screen asked for "every page whose `type` is `checklist`", and a packing list
and a shopping list are both that. A checklist knew what it *was* and had no way
to say what it was *for*.

`CLAUDE.md` stays the operating manual. `ARCHITECTURE.md` describes the layers.
This file describes the **data**: the audit as it stands, the decisions taken,
and the migration path to a server that does not exist yet.

---

## 1. Current model audit

Twenty-four storage keys, all under `focus.`, each behind one repository. No
screen touches storage; `lib/storage/localStore.ts` is the only module that
names `window.localStorage`.

| Type | Storage key | Repository | Read by | Owned by / keyed on |
|---|---|---|---|---|
| `PageSummary` (seed) | — (`mocks/pages.ts`) | — | everything | id |
| `PageOverride` | `focus.pages.overrides` | `pageOverridesRepository` | page detail, board, overview | page id → diff |
| `PageSummary` (own) | `focus.pages.own` | `ownPagesRepository` | same | id |
| `Routine` | `focus.routines` | `routinesRepository` | routine page, training, overview | id |
| `FocusEvent` | `focus.events` | `eventsRepository` | events, overview | id |
| `SavedItem` (own) | `focus.savedItems` | `savedItemsRepository` | every "materials" surface | `contextIds[]` — many contexts |
| `CollectionEntry` | `focus.recipes` | `entriesRepository` | cooking board, recipe detail | id |
| `Checklist` | `focus.checklists` | `checklistsRepository` | trips, projects, events, shopping | **owner key** (`page:x`, `trip:y`) |
| `ChecklistTemplate` | `focus.checklistTemplates` | `checklistTemplatesRepository` | every template picker | id |
| `Trip` | `focus.trips` | `tripsRepository` | trips | id; owns destinations, days, food, outfits |
| `VisionBoard` | `focus.visionBoards` | `visionBoardsRepository` | vision | id |
| `VisionDailyPreference` | `focus.visionDaily` | `visionDailyRepository` | vision | singleton |
| `ProjectCategory` | `focus.projectCategories` | `projectCategoriesRepository` | projects board | id |
| `ProjectCategory` | `focus.learningTopics` | `learningTopicsRepository` | learning | id — *same model, deliberately not the same list* |
| `ScheduledItem` | `focus.scheduled` | `scheduledRepository` | manage, family, overview, reminders | id + `EntityReference` |
| `Commitment` | `focus.commitments` | `commitmentsRepository` | manage → money | id |
| `MoneyEntry` | `focus.money` | `moneyRepository` | manage → money | id |
| `Medication` | `focus.medications` | `medicationsRepository` | manage → health, family | id + `EntityReference` |
| `FamilyProfile` | `focus.family` | `familyRepository` | family | id |
| `QuickLogEntry` | `focus.quickLog` | `quickLogRepository` | family | id + `EntityReference` |
| `Menu` | `focus.menus` | `menusRepository` | manage → shopping | id; `listPageId` → a checklist page |
| `LeisureItem` | `focus.leisure` | `leisureRepository` | leisure | id |
| `TrainingPlan` | `focus.trainingPlans` | `trainingPlansRepository` | training | id; owns groups + exercises + notes |
| `SuggestionPreference` | `focus.leisure.suggestion` | `suggestionPreferenceRepository` | leisure | singleton |
| recent template ids | `focus.templates.recent` | `recentTemplatesRepository` | every template picker | — |

### What the audit found

**Association is already good, in one direction.** `EntityReference`
(`{kind, id}`) is a real, weak, single-shape pointer, and `checklistOwnerFor`
turns one into the checklist's owner key. Scheduled items, medications and quick
log entries all use it. There is no second pointer shape anywhere, and nothing
infers a parent from an id prefix at read time.

**Notes and resources are already one model each, and stay that way.**
`ProjectNote` is the note on every page type; `SavedItem` is the link, the
document, the picture and the video, discriminated by `kind`. There is no
`ProjectLink`, no `LearningVideo`, no `FamilyDocument`. `LearningResource` is not
a fifth resource type — it is the *edge* between a page and a saved item,
carrying the level and the position, and it lives on the page because the same
video is beginner material on one page and the only advanced thing on another.

**The one real defect is classification, not association.** A `Checklist` records
what it belongs to and never records what it is for. Every screen that wanted
"lists" therefore had to filter on `PageSummary.type`, which is the *storage
shape* and not the *purpose*. One query in the app does exactly that:

```
features/manage/ShoppingPanel.tsx:38
  pages.filter((page) => page.type === "checklist")
```

That is the whole Trip North bug. The three other places that name
`type === "checklist"` are correct — routing to the right screen
(`PageDetailPage`), resolving a menu's own list by id (`MenuDetailPage`) and a
due-date rule (`relevance.ts`) — because none of them is asking "which lists
belong on this screen".

**Nothing merges by name.** Pages are `[...ownPages, ...MOCK_PAGES]` overlaid
with a diff keyed by id. A user-created "English" and the seeded "English" are
two pages with two ids and are not, and must never be, reconciled by title.

---

## 2. Consolidation decisions

### 2.1 A checklist declares its purpose and its scope

Two new closed vocabularies:

```ts
type ChecklistPurpose = "tasks" | "shopping" | "packing" | "event" | "training" | "general";
type ChecklistScope   = "household" | "trip" | "project" | "event" | "person" | "page";
```

`purpose` is what the list is for; `scope` is whose life it belongs to. They are
two axes because they genuinely vary independently: a trip has a *packing* list
and can also have a *shopping* list, and the household shopping screen wants
exactly one of those.

**Deviation from the brief, and the reason for it.** The brief puts both fields
on a `Checklist` record. In this codebase the entity a user names, dates, opens
and deletes is the **page** — `Checklist` is only the groups and items hanging
off an owner key, and a page can exist before its checklist record does. Putting
the classification on the record would mean a list has no purpose until somebody
adds a first item, and the shopping screen would flicker with it. So:

- **Page-owned lists** carry `PageSummary.checklist?: ChecklistContext` — a
  small typed extension block, present only on pages of type `checklist`.
- **Entity-owned lists** (`trip:…`, `event:…`, `project:…`, `family:…`) need no
  stored field: the owner key *is* an `EntityReference`, so the scope is already
  explicit, structured data. Reading it back is not inference from a route or a
  name — it is reading the parent the writer wrote.

`checklistContextOf(ownerId, page?)` in `lib/checklist.ts` is the single judge,
the same way `urgencyOf`, `matchesLevel` and `isBlocked` are single judges. Every
screen that lists checklists goes through it.

### 2.2 The household shopping screen asks a real question

`selectHouseholdShoppingLists(pages)` returns pages whose context is
`purpose: "shopping"` **and** `scope: "household"`. A packing list scoped to a
trip cannot satisfy it, whatever it is called and whichever space it sits in.
Trip lists stay inside the trip; event lists stay inside the event. Moving an
item between them is an explicit user action, never a query side effect.

### 2.1a Household shopping: a label, not a scheduler

`ChecklistContext` gained three optional fields, all on household lists only:

| Field | Values | Why |
|---|---|---|
| `listType` | `weekly · monthly · holiday · reusable · oneTime` | How the user describes the list. Drives grouping and filtering, nothing else. |
| `occasion` | free text | "Passover" in the user's words. **Never** a calendar key. |
| `cycleStartedAt` | ISO 8601 | When the current round started. One writer: the confirmed "start the next round". |

**No `RecurrenceRule` here, deliberately.** A shopping list has no next
occurrence to compute and nothing fires from it; `listType` is a description, so
adding a rule would imply a scheduler that must not exist. The brief allowed an
"optional recurrence" — this is that, at the smallest size that does the job.

**No occurrence documents and no generated pages.** A weekly list is one page
for ever. `startNextCycle` unticks its items in place; a missed week produces
nothing at all, because nothing runs unless a person presses a button.

**No holiday calendar.** Focus does not know when Passover is and must not
guess. A holiday list carries a name the user typed and, if it has a date, uses
`PageSummary.dueAt` like every other dated page. Server-side calendar
integration is documented in `FUTURE_ROADMAP.md`, not built.

**The boundary is checked twice**, at the screen and at the menu's write target
(`canReceiveShopping`). Both go through `checklistContextOf`; neither reads a
title. An unclassified list appears nowhere and receives nothing.

**Migration fills only what the origin proves.** A stored checklist page with no
context becomes `shopping`/`household`, because the shopping screen is the only
code path that ever created one. It gains **no** `listType` and **no**
`occasion` — those are unknowable from stored data, and "Weekly shopping" in the
title is not evidence. Tested.

### 2.1b Family: a profile owns nothing it can share

A `FamilyProfile` is a context. Nothing about a dentist appointment, a
medicine, a feed or a document is a "family" model — they are the app's own
records pointed at a profile.

**Recurrence without an occurrence explosion.** A workout every three days is
**one** `ScheduledItem` with a `RecurrenceRule`. Completing it advances
`dueAt` from the anchor and leaves it open; nothing writes a document per
future repetition, and nothing pre-generates a year of sessions. The server-side
equivalent stores `nextOccurrence` as the single index key, computed by the same
rule, so "what is due" stays a range scan.

**Birthdays are derived, never stored** — see `ARCHITECTURE.md`. The rule that
matters for the data model: there is no birthday document, so there is nothing
to migrate, duplicate or clean up, and no `familyProfiles` record grows a
history of past birthdays.

**No unbounded array inside a profile.** Notes are bounded by what a person
writes; scheduled items, medicines, logs and materials are all referenced.
`FamilyProfile.savedItemIds` predates `contextIds`, is written by nothing and
read by nothing — it is left in place because a migration never removes a field,
and is documented here as vestigial so it is not mistaken for a second
association mechanism.

**Delete cascade.** Records the profile solely owns (scheduled items,
medications, quick logs) may be deleted on explicit confirmation with a count
shown first. Saved items are never deleted — only the profile's id is removed
from `contextIds`. The reference is weak by design, so a record pointing at a
deleted profile degrades rather than breaks.

**Unassigned records are left alone.** A `ScheduledItem` with no
`relatedEntity` is not guessed at: it belongs to no profile, appears on no
profile page, and stays where it already is in Manage.

### 2.2a The project page: four fields, many notes, one shelf

A project's content sits in four places, and which place a thing belongs in is
decided by **who reads it**:

| Thing | Where it lives | Why |
|---|---|---|
| `currentState`, `stoppedAt`, `blocker`, `nextAction` | fields on the page | The overview screen and the board read all four |
| Everything else the user writes | `notes: ProjectNote[]`, embedded | Read by this page and nothing else |
| Tasks | `Checklist` keyed `page:<id>` | Shared mechanism; ticked item by item |
| Links, documents, pictures, videos | `SavedItem` by `contextIds` | One item belongs to many contexts |

**Notes are embedded, materials are referenced.** Notes are the page's own words,
reordered as a unit and never read without it — one write per edit. A saved item
belongs to several projects at once and must not be copied into any of them.

**No unbounded array is embedded in a project.** Notes are bounded by what a
person writes; tasks live in their own record with items referenced separately;
materials are referenced. The project document does not grow with use.

**Nothing is inferred from a name.** The association is always an explicit id:
`contextIds` for materials, the `page:<id>` owner key for the checklist,
`categoryId` for the category. `sorcol` and `sorcol-garden` are different
projects, and an item titled "Sorcol quote" belongs to whichever project its
`contextIds` names — both are tested.

**The legacy adapter never writes.** Five old narrative rubrics are read as
notes by a pure function on each render, with stable derived ids, rather than by
a migration that rewrites stored pages. That is why a refresh cannot duplicate a
note, and why no old field has been destroyed.

### 2.2b Training: a plan, a session and a file are three things

`TrainingPlan` is new, and it is new because nothing existing could hold it.
"The active plan" was `plans[0]` — whichever `SavedItem` document filed against
the training area happened to be newest — so two plans running at once was
unrepresentable, and the contents of a plan had nowhere to live at all.

**Embedding decision.** A plan embeds its groups, its groups embed their
exercises, and the plan embeds its notes. The brief sketched three collections
keyed by `planId`/`groupId`; this deviates for the reason `Trip` does. A group
is never read, listed or queried without its plan, so three collections would
mean three writes per edit and three chances to disagree, in exchange for a
join. The bound is real and small: twenty groups of a hundred exercises is a few
kilobytes, and it is a plan document rather than a user document — nothing here
grows without limit inside one record.

**Materials are not embedded.** A `SavedItem` belongs to many contexts at once
and is referenced by `contextIds`, so a video attached to a plan is the same
entity everywhere else it appears. Notes are embedded because they are the
plan's own words and are reordered as a unit.

**Delete behaviour.** Deleting a plan removes the plan and its groups,
exercises and notes, because those *are* the plan. It does **not** delete the
saved items attached to it — a video is attached to a plan, not owned by one,
and "delete this plan" and "delete this video" are different requests. Those
items keep the plan's dead id in `contextIds`; the reference is weak by design,
exactly like every other `EntityReference` in the app, and the screens cope with
a target that no longer exists. A future server-side sweep may prune dead
context ids; nothing depends on it.

**Array boundaries.** Groups per plan and exercises per group are both bounded
by what a person will actually write; neither is paginated and neither needs to
be. `plans` itself is the unbounded list, and the screen pages it at 20.

**Nothing was migrated into it.** Training documents already in storage stay
`SavedItem`s under the material tab. Reading "gym plan.pdf" and producing groups
and exercises would be inventing content, which is the one thing a migration may
never do.

### 2.3 Leisure: ownership and progress are two facts

`LeisureItem` carried one lifecycle field, `status`, with three values —
`idea · planned · done` — and it was doing two jobs at once. A book you own but
have not read had nowhere to live: you could file it as an idea, or as done, and
both were false. The same field was also the only thing distinguishing a place
you had visited from one you wanted to.

Four vocabularies now, each belonging to one axis:

| Field | Values | Applies to |
|---|---|---|
| `ownershipStatus` | `wishlist · owned · borrowed · not_applicable` | books |
| `consumptionStatus` | `not_started · in_progress · completed · abandoned` | books, films |
| `destinationStatus` | `want_to_visit · visited · revisit` | places |
| `purchaseStatus` | `researching · want_to_buy · waiting · purchased · abandoned` | future purchases |

Two axes rather than more values on one, because they vary independently: owned
and unread, wanted and unread, borrowed and half-finished are all real and all
common. `AXIS_BY_KIND` in `lib/leisureCollections.ts` is the single judge of
which field carries a kind's primary status, which is what makes it impossible
for a filter to mix two collections — `visited` cannot match a book however the
URL is edited.

Three vocabulary decisions worth their place:

- **`abandoned` is not `completed`.** Giving up forty pages in is an outcome.
  Collapsing it would put things on the finished shelf that were never finished
  — the same reasoning that keeps `cancelled` apart from `completed` on a
  `ScheduledItem`.
- **`waiting` is not `researching`.** "Decided, but not this year" is where most
  considered purchases actually sit, and without it the honest options were to
  claim you were still looking or to delete the item.
- **`not_applicable` is not absent.** "Ownership does not apply here" is an
  answer; "nobody recorded it" is not, and the migration only ever produces the
  second.

The seven old kinds collapse to five (`book · movie · destination ·
future_purchase · idea`). Where a rename loses a distinction — `series` into
`movie`, `activity` and `evening` into `idea` — the original is kept in
`legacyKind`, so the mapping is reversible and nothing has actually been thrown
away.

**Notes and resources are the shared models, unchanged.** An item's blocks are
`ProjectNote[]`, rendered by the same `<ProjectNotes>` the project and learning
pages use; its links, documents, pictures and videos are `SavedItem`s attached
by `contextIds`. No `LeisureLink`, no `LeisureDocument`, no second note model.
The only leisure-specific piece is which note *templates* are offered, scoped
per kind for the reason learning pages have their own set.

### 2.3 What stays specialised, and why

Consolidation is not the goal; **one mechanism per behaviour** is. These stay
separate on purpose:

| Kept separate | Why it is not folded into the core |
|---|---|
| `Trip` owning destinations, days, food, outfits | Never read without the trip. One write per edit instead of four that can disagree. |
| `Routine` vs `ScheduledItem` | A routine is recurring activity *with a history of completions*; a scheduled item is one obligation with a due date. Merging would make a missed gym day look like an overdue bill. |
| `FocusEvent` vs `ScheduledItem` | An event has sections, a countdown and a preparation window. A reminder has four fields and must stay four fields long. |
| `CollectionEntry` (recipes/places) | Carries ingredients, method and a personal verdict. A note plus resources cannot hold a bake time. |
| `ProjectCategory` in two slices | Same model, emphatically not the same list. "Languages" is not a column on the projects board. |
| `LearningResource` | The edge, not a resource. Level belongs to the pairing, not to the video. |

### 2.4 Ownership fields

`workspaceId` and `createdBy` are **not** being written into local data in this
pass. There is one workspace, there is no authenticated user, and stamping a
constant into every record now would be inventing a fact rather than recording
one. The place they belong is documented in §3: they are added at the API
boundary, from the verified token, on the way in — which is also the only way
`ownerId` may ever be set (`CLAUDE.md` → Security principles).

---

## 3. The shape MongoDB will take

Not connected. Not scheduled. Documented so the client stops drifting away from
a shape a server can serve.

### 3.1 Collections

```
users                 workspaces           workspace_members
pages                 notes                resources
checklists            checklist_items      scheduled_items
routines              events               trips
family_profiles       commitments          money_entries
medications           menus                leisure_items
recipes               vision_boards        training_plans
activity_logs
```

Deviations from the brief's suggested list, each deliberate:

- **`routines`, `events`, `trips`, `recipes` are their own collections**, not
  rows in `pages`. They carry structure a page does not (completion history,
  sections and reminders, destinations and days, ingredients and a verdict), and
  forcing them into one collection buys a shorter list and costs a discriminated
  union in every query.
- **`checklist_items` is separate from `checklists`.** A packing list is ticked
  item by item; embedding would rewrite the whole document per tick.
- **`leisure_items` is one collection, not five.** The five kinds share every
  field that matters and differ by which status vocabulary applies, which is a
  discriminated union and not five schemas. Every list the screen draws is a
  single indexed find on `{ workspaceId, kind, status }` sorted by `updatedAt` —
  no `$lookup`, no aggregation pipeline, and counts small enough to compute on
  the client until an account is large enough to need a counts endpoint.
- **No `permissions` collection.** Sharing does not exist. When it does, it is
  membership on `workspace_members` plus per-document grants — inventing the
  collection now would be inventing the model.

### 3.2 Embedded or referenced

| Data | Decision | Reason |
|---|---|---|
| Checklist groups | **Embedded** in `checklists` | Bounded (tens), always read whole, renamed rarely. |
| Checklist items | **Referenced** (`checklist_items`) | Ticked individually and often; unbounded in principle. |
| Notes | **Referenced** (`notes`) | Reordered, levelled and edited independently; shared shape across every parent. |
| Resources | **Referenced** (`resources`) | One resource belongs to *many* parents — already true of `SavedItem.contextIds`. |
| Trip destinations / days / food / outfits | **Embedded** in `trips` | Never read without the trip. Document stays well inside 16MB. |
| Event sections | **Embedded** in `events` | Same: the sections *are* the event screen. |
| Routine completions | **Embedded** (array of `YYYY-MM-DD`) | ~365 short strings a year. Bounded by time, not by use. |
| Family sections | **Embedded** in `family_profiles` | Opt-in headings, a handful per profile. |
| Scheduled items | **Referenced**, with `parent` | Queried across every parent, by date, for the overview. |

### 3.3 Indexes and the queries that justify them

Every business document carries `workspaceId` and it leads every index. No index
below exists speculatively — each is named by the screen that needs it.

| Query | Screen | Index |
|---|---|---|
| Pages of a type and status, newest first | Projects index, Learning index | `{ workspaceId: 1, type: 1, status: 1, updatedAt: -1 }` |
| Notes/resources of one parent, in order | Every detail screen | `{ workspaceId: 1, "parent.entityType": 1, "parent.entityId": 1, order: 1 }` |
| What is due or overdue | Overview, Reminders, bell | `{ workspaceId: 1, nextOccurrenceAt: 1, status: 1 }` |
| Lists for a purpose and scope | Manage → Shopping | `{ workspaceId: 1, purpose: 1, scope: 1, status: 1 }` |
| Household lists of one kind | Shopping list tab | `{ ownerId: 1, type: 1, "checklist.purpose": 1, "checklist.scope": 1, "checklist.listType": 1 }` on `pages` |
| Menus by occasion | Menus tab | `{ ownerId: 1, kind: 1, updatedAt: -1 }` on `menus` |
| One list's items | List detail | `{ ownerId: 1, "owner.kind": 1, "owner.id": 1 }` on `checklists`; `{ checklistId: 1, order: 1 }` if items are split later |
| One person's obligations | Family profile | `{ workspaceId: 1, "parent.entityType": 1, "parent.entityId": 1, nextOccurrenceAt: 1 }` |
| Resources of one kind on one page | Learning material panels | `{ workspaceId: 1, "parent.entityId": 1, kind: 1, order: 1 }` |
| Plans by state, newest first | Training plans tab | `{ ownerId: 1, status: 1, updatedAt: -1 }` on `training_plans` |
| Projects by category and state | Projects index | `{ ownerId: 1, categoryId: 1, status: 1, updatedAt: -1 }` on `pages` |
| Profiles by type and name | Family index | `{ userId: 1, relationshipType: 1, name: 1 }` on `family_profiles` |
| One profile's schedule | Family schedule tab | `{ userId: 1, "ownerRef.type": 1, "ownerRef.id": 1, nextOccurrence: 1, status: 1 }` on `scheduled_items` |
| One profile's notes | Family notes tab | `{ userId: 1, "ownerRef.type": 1, "ownerRef.id": 1, order: 1 }` on `notes` |
| One profile's quick logs | Family schedule tab | `{ userId: 1, "ownerRef.type": 1, "ownerRef.id": 1, occurredAt: -1 }` on `quick_logs` |
| One profile's medicines | Family schedule tab | `{ userId: 1, "ownerRef.type": 1, "ownerRef.id": 1, active: 1 }` on `medications` |
| One project's notes, in order | Project overview | `{ ownerId: 1, projectId: 1, order: 1 }` on `notes` |
| One project's tasks | Project tasks tab | `{ ownerId: 1, "ownerRef.type": 1, "ownerRef.id": 1 }` on `checklists` |
| One project's materials, by kind | Project materials tab | `{ ownerId: 1, "entityRefs.type": 1, "entityRefs.id": 1, type: 1, createdAt: -1 }` on `saved_items` |
| Everything filed against one plan | Plan materials | `{ ownerId: 1, "parent.entityType": 1, "parent.entityId": 1, kind: 1 }` on `resources` |
| The overview's urgent rows | Overview area 1 | `{ ownerId: 1, status: 1, nextOccurrenceAt: 1 }` on `scheduled_items` |
| The overview's fortnight | Overview area 2 | `{ ownerId: 1, preparationStartsAt: 1, status: 1 }` on `events` |
| The three projects in flight | Overview area 3 | `{ ownerId: 1, type: 1, status: 1, updatedAt: -1 }` on `pages` |
| One leisure collection, newest first | Leisure tabs | `{ workspaceId: 1, kind: 1, updatedAt: -1 }` |
| One collection narrowed by state | Leisure status filter | `{ workspaceId: 1, kind: 1, consumptionStatus: 1 }`, and the same shape for `ownershipStatus` and `purchaseStatus` |

### The overview, as queries

The overview is the screen most likely to be built as one enormous aggregation,
and it must not be. It is **six independent, indexed, limited finds**, run in
parallel and merged in application code:

```
scheduled_items  {ownerId, status:'active', nextOccurrenceAt:{$lte: +21d}}  limit 40
events           {ownerId, status:'active', preparationStartsAt:{$lte: now}} limit 20
commitments      {ownerId, nextChargeAt:{$lte: +21d}}                       limit 20
money_entries    {ownerId, paid:false}                                      limit 20
pages            {ownerId, type:'project',  status:'active'} sort updatedAt limit 3
pages            {ownerId, type:'learning', status:'active'} sort updatedAt limit 3
```

No `$lookup`, no `$facet`, no pipeline. Each is a covered index range scan with
a small bound; severity ordering, de-duplication and the per-area caps happen
after the merge, over at most a couple of hundred small documents.

`nextOccurrenceAt` and `preparationStartsAt` are stored precisely so that "what
is asking now" is an index range rather than a computation over every recurrence
rule and every preparation window in the account. They are the only two
materialised values on this path, each with one writer.

**Dashboard rows are never persisted.** There is no `dashboard_items`
collection and there must not be one. A stored row would be a second copy of
data that already exists, with its own staleness, its own migration and its own
way of disagreeing with the record it describes. Every row carries an
`EntityReference` — `{entityType, entityId}` — and resolves through it, so the
projection is always exactly as current as its sources.

**No screen loads through a multi-`$lookup` aggregation.** The overview is the
only screen that reads across collections, and it does so as a handful of
independent, indexed, limited finds — three rows per group — projected into
small rows that each carry a link back to the source. `nextOccurrenceAt` is
stored on `scheduled_items` precisely so that "what is due" is an index range
scan and not a computation over every recurrence rule in the account.

**Pagination is cursor-based** on `{ updatedAt, _id }`. Offset paging over a list
somebody is actively editing skips and repeats rows.

### 3.4 Derived values are still never stored

`nextOccurrenceAt` is the single exception, and it is not really one: it is a
*materialised* value with one writer (completing or rescheduling the item) and a
clear reason (it is the index key). Birthdays, month summaries, relevance,
packing suggestions and progress percentages stay computed on every read, which
is what makes them impossible to duplicate.

### 3.5 Files, when files exist

Nothing is uploaded today; a document is a link and the screen says so. When
that changes, **nothing goes in MongoDB**:

1. Upload to a temporary, private, non-executing bucket.
2. Check declared MIME against sniffed content, and enforce a size cap.
3. Scan for malware; reject on failure and on scanner timeout, never on a
   default-allow.
4. Refuse active types outright (`.html`, `.svg` served inline, scripts).
5. Move to private storage under a key that contains no user-supplied path.
6. Store **metadata only** in `resources`: key, size, sniffed type, checksum.
7. Serve through short-lived signed URLs, re-authorised per request.

`FocusResource.storageKey` is reserved for step 6 and is not written today.

---

## 4. Migration path

### 4.1 Local, now

Migrations run through `createRepository(key, seed, migrate)` on **every** load,
over stored and seeded data alike, so a migration is exercised on a first visit
rather than months later on somebody else's machine. Every one of them fills in
defaults and never drops a field, changes an id, clears a `focus.*` key, or
collapses "absent" into "empty" where those mean different things.

Added in this pass:

- **Checklist context on own pages.** A page of type `checklist` with no
  `checklist` block gains `{ purpose: "shopping", scope: "household" }`. This is
  a statement of fact, not a guess: `NewListModal` is the only code path that
  has ever created a user-owned checklist page, and it is reached only from the
  household shopping screen. Seeded checklist pages declare their own context
  and are not touched.
- Idempotent by construction: it fills a field only when the field is absent, so
  running it twice produces the same document as running it once.
- **Leisure kinds and statuses.** `migrateLeisureItem` renames the kind, keeps
  the original in `legacyKind` where the rename loses a distinction, and derives
  the per-kind status from the old `status` where that is knowable: `done`
  becomes `completed` / `visited` / `purchased`, and everything else becomes the
  earliest state. Two things it deliberately never produces:
  - **`in_progress` and `abandoned`**, because nothing in the old data
    distinguished "planned to read" from "reading", and nothing recorded giving
    up at all. Only a person sets those.
  - **Any ownership at all.** The old `status` never meant "I own it" and never
    meant "I want it" — it meant neither. The honest migration of an unknown is
    to leave it unrecorded, so `ownershipStatus` stays absent on every migrated
    item. This is the one place the migration does nothing on purpose.

  Every other field survives untouched, including `status` itself and the
  suggester's cooldown stamps, which are still read.

### 4.2 localStorage → server, later

One import, run once per account, behind a "your data is on this device" screen:

1. Read every `focus.*` key through its existing repository, so every migration
   above has already run and the payload is in current shape.
2. Assign one `workspaceId` server-side from the verified token. The client
   never sends it.
3. Post each slice to its collection, preserving local ids as `_id` where they
   are already unique strings, so `EntityReference`, `contextIds` and checklist
   owner keys keep resolving without a rewrite pass.
4. Verify by count and by spot-checking references, then mark the local payload
   *migrated* rather than deleting it. There is one copy of this data and it is
   on somebody's laptop.

The seam that makes this possible already exists: `Repository<T>` has `load` and
`save`, providers consume repositories, and screens consume providers. An
`ApiRepository` implementing the same interface changes no screen.

---

## 5. Explicit non-goals

Not built, and not to be built as a side effect of anything above: a MongoDB
connection, persistence endpoints, Google OAuth, live users or permissions, file
upload, share links, push notifications, PDF or presentation export, AI
recommendations, price tracking, trainer/trainee management, medical advice, a
client-side aggregation engine imitating MongoDB, an event bus, GraphQL, CQRS,
or a dependency-injection framework.

And the standing boundary, which no amount of data modelling relaxes: **Focus
records; it never interprets.**
