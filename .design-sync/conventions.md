# Building with Focus

Focus is a personal operating system — projects, routines, events, trips,
checklists, recipes, notes. Its components assume a **Hebrew, right-to-left**
interface by default, and they are a thin layer over **Bootstrap 5**, not a
replacement for it.

## Wrap everything in `FocusPreviewProvider`

Every Focus component reads i18n from context, and many read a router or a
domain provider. Rendered outside that context they come up **blank** — not
broken-looking, just empty, which is easy to miss.

```jsx
const { FocusPreviewProvider, PageHeader, Section, CompactList, CompactRow } = window.Focus;

<FocusPreviewProvider>
  <PageHeader title="סקירה" lead="מה דורש אותי עכשיו" />
</FocusPreviewProvider>
```

It takes `language` (`"he"` — the default — or `"en"`) and `initialPath`. It
sets `document.documentElement.dir` itself, so direction follows the language
with no second layout.

`Routes`, `Route`, `Outlet`, `Link` and `NavLink` are re-exported from
`window.Focus`. **Use those, never a separate `react-router-dom` import** — a
second copy of react-router has its own context, and `<Routes>` from it renders
nothing at all inside the provider's router.

`AppShell` is a layout route: it renders an `<Outlet />`, so give it routes.

```jsx
<Routes>
  <Route element={<AppShell />}>
    <Route index element={<YourScreen />} />
  </Route>
</Routes>
```

## The styling idiom: Bootstrap plus a thin `focus-*` layer

Both stylesheets ship, Bootstrap first and `focus-*` second — so **`focus-*`
rules win where they overlap**. Use Bootstrap utilities for ordinary spacing and
type (`mb-3`, `gap-2`, `small`, `text-secondary`, `btn btn-sm`), and the
`focus-*` classes below for structure.

One trap: `.focus-card`, `.focus-tile` and `.focus-chip-card` are
`flex-direction: column`. Adding `d-flex justify-content-between` to them
silently stacks instead of laying out a row. For a horizontal strip, use the
app's own wrapper classes rather than Bootstrap flex utilities on a `focus-*`
card.

### Layout

| Class | What it does |
|---|---|
| `focus-container` | The one content column, max 1200px, centred. Wraps every screen. |
| `focus-sections` | The responsive section grid. Wrap `Section` and the `sections/` components in it. |
| `focus-section--full` / `--auto` | A section takes the row, or shares it with the next short one. |
| `focus-shell` · `focus-main` · `focus-content` | The app frame, if you build one by hand instead of using `AppShell`. |
| `focus-grid` + `--saved` `--chips` `--recipes` `--upcoming` `--continue` `--progress` | Card grids that fill a row without one card stretching. |
| `focus-rows` · `focus-dense-rows` | List wrappers. `focus-dense-row` is the row itself. |

### Chips — the label vocabulary

`focus-chip` plus one of `--muted` `--primary` `--success` `--info` `--warning`
`--danger` `--icon`, and the urgency set `--urgency-preparing`
`--urgency-soon` `--urgency-critical` `--urgency-done`.

Prefer the badge components (`StatusBadge`, `SpaceBadge`, `PageTypeBadge`,
`BlockedBadge`, `RoutineDomainBadge`, `EventKindBadge`) — they carry the right
chip class *and* the translated label.

### Tokens

`var(--focus-bg)` `--focus-surface` `--focus-text` `--focus-muted`
`--focus-line` `--focus-line-soft` `--focus-accent` `--focus-accent-soft`
`--focus-warn` `--focus-warn-soft` `--focus-radius` `--focus-radius-sm`
`--focus-sidebar-width`.

Also useful: `focus-clamp-1` / `focus-clamp-2` (a detail line in a list is
clamped — the detail screen is one tap away), `focus-icon-button`,
`focus-chip-button`, `focus-section-action`.

## Rules the components already enforce — don't fight them

- **Nothing has a `min-height`.** A two-line row is two lines tall. Never
  stretch a card to match its neighbour.
- **An empty section renders nothing.** `Section` returns `null` when
  `hasContent` is false — no heading, no "nothing here" panel. Let it.
- **Status is never colour alone.** Every state is written out in words beside
  its colour.
- **Never render a link the app cannot open.** A saved thing with no real
  destination gets no `url` at all and shows a "no link" badge. No `href="#"`,
  no placeholder hosts.
- **Only picture *addresses* are stored**, never bytes. A failed picture shows a
  neutral "did not load" placeholder — never substitute artwork for someone's
  photograph.
- **Focus records; it never interprets.** No dose is calculated, no reaction
  assessed, no bank connected. Medical and money values are the user's own text
  repeated back.

## Direction: one layout, both languages

- **Use CSS logical properties** — `margin-inline-start`, `padding-inline-end`,
  `inset-inline-start`, `text-align: start`.
- **Never use Bootstrap's physical utilities**: `ms-*`, `me-*`, `ps-*`, `pe-*`,
  `text-start`, `text-end`, `float-*`. This project uses the LTR Bootstrap build
  in both directions, so those do not flip. `gap-*`, flexbox and grid are
  direction-aware already and are safe.
- **Put `dir="auto"` on every element holding the user's own words** — titles,
  notes, descriptions, and every input they type into. A URL field is the
  exception: it is `dir="ltr"`.
- **A label and its value are separate blocks.** Use `LabelledText`, never
  `Label: value` on one line — one bidirectional run leaves the browser guessing
  which end the punctuation belongs to.
- Mirror **directional** icons only, via `<Icon flipForRtl />` on arrows. Never
  mirror a clock.

Careful: props documented as *interface* copy (`PageHeader`'s `lead`,
`EmptyState`'s `title`) carry no `dir="auto"` — in the running app they are
Hebrew. Pass Hebrew there. English prose in those slots misplaces its full stop.

## An idiomatic screen

```jsx
const { FocusPreviewProvider, PageHeader, Section, CompactList, CompactRow,
        StatusBadge, BlockedBadge } = window.Focus;

<FocusPreviewProvider>
  <div className="focus-container">
    <PageHeader
      title="פרויקטים"
      lead="מה פעיל, מה תקוע"
      action={<button className="btn btn-primary btn-sm">פרויקט חדש</button>}
    />
    <div className="focus-sections">
      <Section title="דורש תשומת לב" hasContent span="full">
        <CompactList>
          <li>
            <CompactRow
              title="Sorcol"
              eyebrow="פרויקט"
              detail="Waiting on the models for the remaining sizes."
              badges={<><StatusBadge status="active" /><BlockedBadge /></>}
              meta={<span>עודכן לפני יומיים</span>}
              tone="due"
            />
          </li>
        </CompactList>
      </Section>
    </div>
  </div>
</FocusPreviewProvider>
```

## Where the truth is

Read `_ds/<folder>/styles.css` and the files it imports — that is the real
stylesheet, Bootstrap plus `index.css`, and it beats any summary here. Each
component's own `.prompt.md` and `.d.ts` carry its props with the original
rationale comments, which are unusually good in this codebase: they explain
*why* a rule exists, not just what it is.
