# Future roadmap

Ideas that are **not built**, recorded so they stop being re-invented in every
planning conversation.

Nothing here appears anywhere in the running app. No entry point, no disabled
button, no "coming soon". A feature that is not built should not take up space
on a screen.

Each section says what the thing is, what it would reuse, and what it must not
turn into. They are written against the 80/20 rule in `CLAUDE.md`: if an idea
cannot be expressed with the mechanisms Focus already has — checklists, boards,
saved items, tags, notes, images, documents, timelines, completion calendars,
references — it probably does not belong here at all.

---

## Built — moved out of this document

Sections 1–12 of this roadmap described running life day to day: ongoing
management, insurance, subscriptions, income and expenses, medical appointments
and follow-ups, medicines, recurring shopping lists, fixed menus, the relevance
overview, learning, leisure, and "what suits right now?".

**All of it now exists.** The design constraints those sections argued for are
not lost — they were promoted into `CLAUDE.md` (the rules) and
`docs/ARCHITECTURE.md` (how they are enforced), which is where a rule that
governs shipped code belongs. Keeping a description of built behaviour in a
document titled "not built" is how a roadmap starts lying.

Where to look now:

| Was roadmap § | Now documented in |
|---|---|
| Shared building blocks, quick create | CLAUDE.md → Entities · ARCHITECTURE.md → Shared life primitives |
| Insurance, subscriptions, income and expenses | CLAUDE.md → "Money is three numbers and a list" |
| Appointments, follow-ups, medicines | CLAUDE.md → "Focus records; it never interprets" |
| Recurring shopping lists, fixed menus | ARCHITECTURE.md → Template cloning · Menu → shopping list |
| The overview, once there is more to show | ARCHITECTURE.md → Dashboard relevance |
| Learning | CLAUDE.md → "Learning is a page type, not a course platform" |
| Leisure, "what suits right now?" | CLAUDE.md → "arithmetic, not AI" |

---

## Still not built

Everything below is genuinely absent from the running app: no entry point, no
disabled button, no "coming soon".

### Server, database, accounts

The whole of it. No API call is made anywhere; the repository layer is the seam
where it will land, and swapping it is meant to change one layer rather than
every screen. Until that exists there are no users, no authentication, no shared
family accounts and no permissions between family members — a "shared" profile
today would be a lie about where the data lives.

### Real file storage

Documents, images and videos are **addresses**, never bytes. There is no upload,
no cloud storage, no Base64 and no blob in `localStorage`. Where the interface
offers "a document", it says it means a link to one. Real upload waits for a
server; until then, pretending a file was saved when only a URL was is the one
thing this area must not do.

**What it would take, in order.** Object storage with per-user prefixes; upload
through the server, never straight from the browser to the bucket, so size,
type and ownership are checked somewhere the client cannot skip; a malware scan
before a file is ever served back; signed, expiring URLs rather than public
ones; and a download path that is an authorisation decision, not a link.

**What it would reuse.** All of it. An uploaded file becomes a `SavedItem` of
kind `document` or `image` whose `url` points at the stored object, and every
screen that renders material today renders it unchanged — the learning page's
four panels, the trip's saved items, a recipe's attachments. That is the whole
reason the model stores an address: the seam is already in the right place.

**What it must not turn into.** A file manager. There are no folders, no
versions and no quotas in the interface; a document is a thing you saved, filed
where you saved it.

### Notifications that arrive when the app is closed

Browser notifications and a service worker are the eventual answer, and both are
future work. Today a reminder is shown when Focus is opened, and every surface
that renders one says so. Nothing may imply otherwise before the mechanism
exists.

### External calendar sync

Two-way sync with a real calendar, and the conflict resolution it drags in.
Deliberately deferred: the recurrence model here covers eighty percent of life
precisely because it does not have to round-trip through iCalendar.

### Financial and medical integrations

Bank connections, health-fund (קופת חולים) integration and online appointment
booking. All three would turn a local notebook into a system with credentials in
it, and none of them can be done honestly without a server. Related and equally
out of scope: automated bookkeeping, invoices, tax calculation, and any
forecasting.

### AI

No AI medical advice, no AI financial advice, no AI-generated learning paths, no
AI recommendations. "What suits right now?" is a scoring function and is meant to
stay one — see CLAUDE.md. If a rule engine genuinely cannot express a need, that
is an argument for a better rule, not for a model.

### Metadata and recognition

No metadata fetch for a pasted link (loading the image is the only honest test
that an address points at one), no OCR of documents, and no recognition of food,
medicine or clothing from a photograph.

### Sharing a learning path

Showing somebody how you learned something. **Nothing of this exists in the
interface and nothing should appear there before a server, a database, accounts
and permissions do.** It is recorded here because the screen was built in a
shape that leaves room for it, not because any of it is close.

**What would be shareable, and at what grain.** A whole learning page; or one
level of it; or one kind of material within that. The address the app already
uses says exactly this much:

```
/pages/learning-english?level=beginner&material=videos
   page ─────────────┘        level ┘        material ┘
```

A recipient invited to English · beginner · view-only would see the beginner
notes, the practice list, and the beginner links, documents, pictures and
videos — plus everything filed as **general**, on the same rule the local filter
uses. They would get no other level of that page and no other page, and nothing
would suggest either exists.

**Two permissions, and only two.** Viewer and editor. A third would need a
policy nobody has asked for.

**Privacy is a projection, not a filter.** The shared shape is built from an
explicit allow-list, exactly as `toPublicShowcase` is described in
ARCHITECTURE.md. Removing fields from a private object fails open; selecting
fields fails closed.

**What it must not turn into.** A course platform, a marketplace, or a place
other people can enrol. Sharing a learning page is showing somebody your
notebook, not publishing a curriculum. If it ever grows lessons, grades, a
completion percentage or an audience, the 80/20 rule has been abandoned.

**Google Sign-In** is the intended entry point, once accounts exist — see
"Server, database, accounts" above. Until it does, there is no user, so there is
nobody to share with and no `ownerId` to scope a share by.

### Sharing a trip

Only after a server, a database and users exist. All of it is out of scope
until then, and none of it should shape the local model in advance.

**Link kinds.** A read-only link that needs no account; an edit link for
someone travelling with you; and "make a copy", which is the one people
actually want most — take somebody's Japan itinerary and make it theirs.

**Views.** The planner as it is; a **route view** (destinations and dates, no
day detail); and a **presentation view** — one screen per day, large type, no
controls, meant to be read by somebody's parent on a tablet.

**Privacy is a projection, not a filter.** The public shape is built from an
explicit allow-list, exactly as `toPublicShowcase` is described in
ARCHITECTURE.md. Confirmation numbers, booking links, prices and personal notes
are never in it. Removing fields from a private object fails open; selecting
fields fails closed.

**PDF export** belongs to the presentation view, and only once that view
exists. It is a print stylesheet before it is anything cleverer.

**An interface an 85-year-old can use.** Large type, no icons without labels,
one column, no gestures, nothing that only appears on hover. Worth designing
for its own sake — most of it improves the main app too.

### Other views and export

Recorded together because they are one feature wearing four hats: **the app can
already render this content, and sometimes you want it rendered differently.**

- **A dynamic viewer** — the same entities, a chosen subset of sections.
- **Presentation mode** — one screen at a time, large type, no controls.
- **PDF export** — a print stylesheet over presentation mode, before it is
  anything cleverer.
- **A read-only viewer** — no edit affordances at all, for handing to somebody
  else.
- **Choosing which sections appear**, and **hiding private detail** — the same
  allow-list projection described in §13. Selecting fields fails closed;
  removing fields from a private object fails open.

None of this appears in the running app until it is built. No disabled buttons,
no "coming soon".

---

## Not planned

Written down so the answer is on record: real social features, comments,
likes, public profiles, gamification, streaks, an activity feed, AI-generated
content, and anything that treats a personal system as a network.
