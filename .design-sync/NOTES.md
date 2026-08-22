# design-sync notes — Focus

Repo-specific gotchas for future syncs. Read this before re-running anything.

## Shape: this is an app, not a component library

Focus has no published package, no `dist/`, and no Storybook. The library
surface was **constructed** for the sync and lives in `client/design-sync/`:

- `entry.tsx` — the barrel. Re-exports only; nothing is redefined, so a
  component behaves in a design exactly as it behaves in the app. **Adding a
  component to the design system means adding a line here.**
- `previewEnv.tsx` — `FocusPreviewProvider`, the same nine-provider chain
  `src/App.tsx` builds, in the same order, plus a `MemoryRouter`. It is
  `cfg.provider`, so every card and every rendered design gets it.
- `build-css.mjs` → `focus-styles.css` — Bootstrap 5 concatenated with
  `src/index.css`, in that order. This is `cfg.buildCmd` and **must be re-run
  before every sync** (the output is gitignored).

`client/package.json` gained one line: `"types": "design-sync/entry.tsx"`.
That is load-bearing — it is how ts-morph finds the component tree and
extracts every `<Name>Props`. Remove it and all 50 `.d.ts` files degrade to
stubs. It is inert for the app (nothing consumes `types` in a private package,
and `tsconfig.app.json` includes only `src`, so `client/design-sync/` is
outside the app's typecheck).

## Environment

- **Not a git repository.** The durable sync inputs cannot be committed; the
  `.gitignore` entries were still added for when it becomes one.
- The sandbox blocks npm's cache and blocks binding a local port, so
  `npm i` in `.ds-sync/` and every `package-validate` / `package-capture` run
  need to be run **outside the sandbox**.
- No playwright browser was downloaded. The render check drives the installed
  Google Chrome instead:
  `export DS_CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`
  Set it for `package-validate.mjs`, `package-capture.mjs` and `resync.mjs`.

## Writing previews (calibrated on CompactRow, StatusBadge, AttentionList)

- Import components from `"focus-client"` — that resolves to the shipped
  bundle. Types come from `"../../client/src/types"`.
- **Fixtures must be static, with hard-coded ISO dates.** Do NOT import from
  `client/src/mocks/` — those derive dates from `Date.now()` via
  `mocks/relativeDates.ts`, so the card would render differently every day,
  change its render hash, and throw away its grade on every sync.
- **The frame is Hebrew and RTL.** Any Latin text a preview writes itself needs
  `dir="auto"`, or its punctuation jumps to the wrong end of the line. This bit
  the first draft of `AttentionList.tsx`.
- Interface copy comes from the components themselves — they all call `t()`.
  Fixture text is *user content*: it is never translated, and it should look
  like what a real user typed (Hebrew for Hebrew-native content, English where
  the app's own mocks use English).
- Composition rules that are easy to get wrong:
  - `CompactRow` belongs inside `<CompactList><li>…</li></CompactList>`.
  - Anything built on `Section` (all of `features/sections`) needs wrapping in
    `<div className="focus-sections">` to get its real grid layout.
  - `Section` renders **nothing** when `hasContent` is false. A cell that
    demonstrates that should say so in a note beside it, or it reads as broken.
- Budget 2–6 exports per component; one canonical use, then the axis that most
  changes appearance.

## Known render warns

These are legitimate and should not be chased on a re-sync:

- `[RENDER_THIN]` / `[RENDER_BLANK]` on any component whose whole job is a
  single small element (`Icon` at 20px, `EditButton` at 30px, `LabelledText`).
  Authoring their previews is the fix, not a config change.
- The **review sheets** (`_screenshots/review/*.png`) leave a lot of white
  under each cell. That is the capture harness's fixed cell height, not the
  component. Judge card quality from `_screenshots/<group>__<Name>.png` — the
  shipped card — which tiles its cells properly.

## Two clocks — the one thing that trips everybody

`package-capture.mjs` pins the browser clock to **2024-05-15**
(`page.clock.setFixedTime`). `package-validate.mjs` does **not** — and neither
does the claude.ai/design pane, which renders each `<Name>.html` live. So:

| Artifact | Clock | Who reads it |
|---|---|---|
| `_screenshots/review/*.png` (capture) | pinned to 2024-05-15 | graders, during a sync |
| `_screenshots/*.png` (validate) and the shipped card | real clock | the design agent, and people |

**Date fixtures near the present**, not near the capture clock. The shipped
card is the deliverable; a 2024-anchored fixture ships a card reading
"לפני שנתיים", and for anything driven by `urgencyOf` or routine scheduling it
renders the *wrong state branch* — a past event where an upcoming one was
meant. The cost is only that relative figures look inflated in the review
sheets ("בעוד 640 ימים"); grade composition there and discount the number.

The corollary is a re-sync risk: **cards with countdowns go stale.** A sync a
year from now should refresh the fixture dates in the previews that render
relative time, not just carry them forward.

Known inconsistency to tidy on the next pass: the badge previews
(`SpaceBadge`, `BlockedBadge`, `DemoBadgeInline`, …) were authored against the
capture clock and carry 2024 dates. Harmless — those cards are chips, and the
date is incidental — but they are the odd ones out.

## Composition gotchas found while authoring

- **`.focus-card` is `flex-direction: column` and beats Bootstrap's flex
  utilities**, because `index.css` is concatenated after Bootstrap.
  `focus-card d-flex justify-content-between` silently stacks. For a horizontal
  strip, port the app's own wrapper classes (`.focus-header__row`,
  `.focus-header__identity`) instead of layering Bootstrap utilities on a
  `focus-*` class.
- **Leave the overridable `t()` prop off in at least one cell.** `ErrorState`
  without `title`, `LoadingState` without `label`, `ShowMore`'s own count —
  that is the only way a sheet proves the translated copy resolves inside the
  provider.
- **Fixture copy for interface-shaped props should be Hebrew.** An empty-state
  title or an `InfoNote` line is interface copy a caller passes in; in the
  running app it is Hebrew. Latin text belongs only where it is genuinely user
  content (project names), and there it needs `dir="auto"`.
- **`LabelledText` already puts `dir="auto"` on its value** — a preview must
  not add another.
- **A component whose whole output is one line needs an in-situ cell.**
  `SectionHeading` alone reads as broken in a sheet; the same heading above
  real rows reads as correct.
- **`Link` is not exported from the barrel.** A preview that needs an anchor
  uses a plain `<a href="/projects">`; `MemoryRouter` is in the provider, so it
  is safe. Never `href="#"` — `npm run check:links` bans it in app source and
  it would be a fake link here too.
- **Mixed RTL/LTR inside one card is correct.** An English project title flush
  left beside Hebrew chips flush right is `dir="auto"` doing its job, not a
  broken cell. Never "fix" it by dropping `dir="auto"`.

## Bugs this sync found in app source

- **`client/src/components/ui/RelatedLinks.tsx` uses a translation key that does
  not exist.** It calls `t("common:media.noLink")`, but `common.json` has only
  `media.{imageUnavailable, imageFailed, noImage}` in both locales. The string
  it wants is `common:mock.noLink` ("אין קישור" / "No link") — the key
  `DemoBadgeInline` uses correctly. A `RelatedLinks` row for an item with no
  `url` therefore prints the literal text `media.noLink` beside the warning
  icon. Confirmed in a capture. One-word fix (`media` → `mock`), or add the key
  to both locales.
  Until it is fixed, `RelatedLinks`'s preview deliberately has **no** no-link
  cell — that branch is the component's most interesting one, so add a
  `OneWithoutDestination` cell once the key resolves.

- **`client/src/index.css:2259` gives `.focus-progress-block` a 220px minimum
  height.** The rule is `flex: 1 1 220px`, written for a row-direction parent —
  but `.focus-chip-card` is `flex-direction: column`, so the flex *basis*
  becomes a minimum height. Every `PageChipList` card carrying a progress bar
  gets ~180px of dead white. Visible in `_screenshots/sections__PageChipList.png`,
  and it contradicts CLAUDE.md's "nothing has a `min-height`". The preview is
  graded `good` because it faithfully reproduces what the app does — the fix
  belongs in the app, not in the card.

## Fixture rules learned the hard way

- **Pre-formatted values must be the formatter's literal output.** `StatRow`
  takes values that are already formatted, and a hand-written `"₪18,400"`
  renders in the wrong shape for `he-IL` with the sign at the wrong end of the
  run. Generate the fixture with
  `new Intl.NumberFormat("he-IL", {style:"currency", currency:"ILS", maximumFractionDigits:0})`
  and paste the exact string, bidi marks included. The same rule applies to any
  component taking pre-formatted numbers.
- **A class name that does not exist fails silently.** `focus-eyebrow` was an
  invention and produced an unstyled line; the real ones are scoped
  (`focus-saved__eyebrow`, `focus-dense-row__eyebrow`). Lifting a scoped class
  out of its parent also misbehaves. Grep `index.css` before using a class, and
  prefer the generic `focus-chip focus-chip--muted` inside a hand-built wrapper.
- `initialsOf` is first-word-initial + last-word-initial ("Maya Ben Ari" → `MA`)
  — useful when choosing fixture names for `Avatar`.

## States that cannot be captured statically

- `ShowMore` holds its expanded flag in `useState`, so the sheet shows the
  collapsed state — which is the state worth showing, since the button and its
  count *are* the component.
- `SavedItemCard`'s internal preview modal needs a click, as do the expanded
  states of `RelatedLinks`.
- `Avatar`'s `<img>` branch needs a remote address, and a failed load falls back
  to initials — which would make the render hash depend on the network. Initials
  are the branch worth showing.

Neither is worth a config change; both are recorded here so a future sync does
not go looking for a bug.

## The pinned clock defeats branch verification (open question)

Worth knowing before the next sync: because the capture clock sits at
2024-05-15 and fixtures are dated near the present, `urgencyOf` returns
`neutral` for *every* event fixture and `isOverdue` is `false` for *every*
routine fixture. So `EventList`'s urgency cells and `RoutineList`'s overdue cell
cannot be verified from a review sheet at all — the branches were checked
analytically against the real clock instead, and the expected branch per fixture
is written into each grade note.

The shipped cards are correct (real clock). But if a future sync wants the
urgency states visible in review sheets, the honest fix is to stop pinning the
capture clock — determinism is already lost, since fixtures age against a pinned
clock too.

Also: `span="auto"` cannot show two columns at the 900px capture viewport —
`.focus-sections` needs ~890px of content width. `cfg.overrides.<Name>.viewport`
accepts e.g. `"1100x700"` if that ever needs demonstrating.

`UpcomingEntry` lives in `lib/pageSelectors.ts`, not `types/`. `PageChipList`'s
checklist cells depend on fixture page ids matching the app's seeded checklists.

## Router primitives are exported from the barrel on purpose

`client/design-sync/entry.tsx` re-exports `Routes`, `Route`, `Outlet`, `Link`
and `NavLink` from `react-router-dom`, and `config.json` excludes all five from
the component list (`componentSrcMap: null`) so they get no cards.

This is load-bearing, and the failure it prevents is silent. A preview that
imports `react-router-dom` directly gets a **second copy** of react-router with
its own context; `<Routes>` from that copy cannot see the `MemoryRouter` inside
`FocusPreviewProvider`, and the cell renders **completely blank** with no error.
That is exactly how the first `AppShell` preview failed. Import them from
`"focus-client"`.

## Card overrides in config.json, and why

- `AppShell`: `cardMode: single`, `viewport: 1280x800`. The sidebar is
  `d-none d-lg-flex`, so at the default 900px capture width the shell renders
  *without its sidebar* — the one feature the card exists to show.
- `SidebarNav`: `cardMode: column`, so the nav gets full card width.
- `ConfirmDialog`: `cardMode: single`, `viewport: 900x620`, so the open modal
  renders inside the card instead of covering it with backdrop.

## Two harness behaviours worth knowing

- **A scoped `package-capture.mjs --components …` run PRUNES the review sheets
  of every component not named.** Grade files survive; the PNGs do not. Capture
  everything you intend to look at in a single run, or you will re-capture.
- Grades are cleared when preview-affecting config changes, not just when a
  preview changes. Adding `overrides` and `readmeHeader` cleared one component's
  grade on the final driver run.

## Fixture typing

`SavedItem.source` is **required** (`SavedItemSource`), not optional. A fixture
that sets `source: undefined` makes the component render the literal string
`sources.undefined`. Type fixtures against `client/src/types` and let TypeScript
catch this — several previews import the real types for exactly this reason.

## What this run changed in app source

One line, with the user's approval: `client/src/components/ui/RelatedLinks.tsx`
now calls `t("common:mock.noLink")` instead of the non-existent
`t("common:media.noLink")`. That unblocked the `OneWithoutDestination` cell,
which is the component's most interesting branch.

**Still open, and NOT fixed** (reported, no approval sought — they are app
concerns rather than sync concerns): the `.focus-progress-block` 220px
minimum-height bug described above.

## How this run actually went

Previews were authored by parallel subagents in two waves. Four of the six
agents were killed mid-flight by a session limit; their preview files had been
written but not graded, and the orchestrator finished them serially. If a future
sync fans out again, note that a dead agent leaves usable `.tsx` files behind —
check `.design-sync/previews/` against `.design-sync/.cache/review/*.grade.json`
to find what still needs grading, rather than re-authoring.

**This repository is not a git repository**, so none of the durable sync inputs
(`config.json`, `NOTES.md`, `conventions.md`, `previews/`) could be committed.
They are on disk only. Running `git init` and committing `.design-sync/` and
`client/design-sync/` is the single highest-value thing to do before the next
sync — without it, a fresh clone loses 50 authored previews.

## Re-sync risks

- **`focus-styles.css` is generated and gitignored.** A fresh clone must run
  `node client/design-sync/build-css.mjs` before the converter, or `cfg.cssEntry`
  will not exist and every design ships unstyled.
- **Bootstrap's version is baked into that file.** Bumping `bootstrap` in
  `client/package.json` changes 327KB of the bundle's CSS without touching a
  single component; expect a full re-verify when it moves.
- **The barrel can drift.** A component added to `components/ui/` is invisible
  to the design system until it is exported from `client/design-sync/entry.tsx`.
  Nothing warns about this.
- **The provider chain can drift.** If `src/App.tsx` gains a provider,
  `previewEnv.tsx` must gain it too, or newly-added components render blank
  with a missing-context error.
- Groups come from directory names. `components/ui/` yields the group
  `general`, because `ui` and `components` are both generic container names to
  the converter. Everything under `features/sections/` and `components/layout/`
  groups correctly.
