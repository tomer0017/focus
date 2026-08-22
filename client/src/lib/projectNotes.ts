import type { PageSummary, ProjectNote } from "../types";

/**
 * Free-form project notes, and the bridge back to the fixed rubrics.
 *
 * The page used to render nine fixed headings. That suited a long build and
 * suited nothing else: "replace the sofa" needs a picture, a set of
 * measurements and three product links, and being asked "what does success
 * look like?" only produces filler. Notes let the page be as small as the
 * project is.
 *
 * Nothing is thrown away to get there. The legacy fields stay on `PageSummary`
 * and stay in storage; `notesForPage` reads them when a page has no notes of
 * its own, so a project written months ago still opens with its content
 * intact. The conversion is an *adapter*, not a destructive migration — see
 * the note on `notes` in `types/page.ts` for why `undefined` and `[]` mean
 * different things.
 */

/** A starting point offered when adding a note. Never applied on its own. */
export interface ProjectNoteTemplate {
  id: string;
  /** Key in the `pages` namespace for the title this seeds. */
  titleKey: string;
  /** Key in the `pages` namespace for the helper text shown in the empty box. */
  hintKey: string;
}

/**
 * Offered when adding a note, and only offered: choosing one fills in a title
 * and a placeholder, and the user can rewrite or delete every part of it. A
 * project that takes none of them is a normal project, not an unfinished one.
 */
export const PROJECT_NOTE_TEMPLATES: ProjectNoteTemplate[] = [
  { id: "idea", titleKey: "notes.templates.idea.title", hintKey: "notes.templates.idea.hint" },
  {
    id: "process",
    titleKey: "notes.templates.process.title",
    hintKey: "notes.templates.process.hint",
  },
  { id: "state", titleKey: "notes.templates.state.title", hintKey: "notes.templates.state.hint" },
  {
    id: "stuck",
    titleKey: "notes.templates.stuck.title",
    hintKey: "notes.templates.stuck.hint",
  },
  {
    id: "decisions",
    titleKey: "notes.templates.decisions.title",
    hintKey: "notes.templates.decisions.hint",
  },
  {
    id: "measurements",
    titleKey: "notes.templates.measurements.title",
    hintKey: "notes.templates.measurements.hint",
  },
  { id: "budget", titleKey: "notes.templates.budget.title", hintKey: "notes.templates.budget.hint" },
  {
    id: "toCheck",
    titleKey: "notes.templates.toCheck.title",
    hintKey: "notes.templates.toCheck.hint",
  },
  {
    id: "nextAction",
    titleKey: "notes.templates.nextAction.title",
    hintKey: "notes.templates.nextAction.hint",
  },
];

export function noteTemplate(id: string): ProjectNoteTemplate | undefined {
  return PROJECT_NOTE_TEMPLATES.find((template) => template.id === id);
}

/** Ids are generated here so every call site makes them the same way. */
export function noteId(): string {
  return `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * The legacy narrative fields, in the order they used to be read on the page,
 * paired with the note title each becomes.
 *
 * `currentState`, `stoppedAt`, `blocker` and `nextAction` are deliberately
 * absent, and stay structured fields. They are not page decoration: the
 * dashboard's "what is stuck" and "where do I resume" sections read them, the
 * board card prints the next action, and `isBlocked()` is defined in terms of
 * `blocker`. Turning those four into prose would empty half the overview. The
 * six below are read by nothing but this page, which is exactly what makes
 * them notes.
 */
const LEGACY_FIELDS: { field: keyof PageSummary; titleKey: string }[] = [
  { field: "description", titleKey: "notes.legacy.why" },
  { field: "outcome", titleKey: "notes.legacy.outcome" },
  { field: "doneSoFar", titleKey: "notes.legacy.doneSoFar" },
  { field: "afterThat", titleKey: "notes.legacy.afterThat" },
  { field: "lastDecision", titleKey: "notes.legacy.lastDecision" },
];

/**
 * What the page should render.
 *
 * A page the user has edited returns its own notes — including an empty list,
 * which is a real answer and not a missing one. A page that has never been
 * edited is read through the legacy fields, and **only fields that hold
 * something become notes**: an empty rubric does not become an empty note,
 * which is the whole point of the change.
 */
export function notesForPage(page: PageSummary): ProjectNote[] {
  if (page.notes) return [...page.notes].sort((a, b) => a.order - b.order);

  return LEGACY_FIELDS.reduce<ProjectNote[]>((notes, { field, titleKey }) => {
    const value = page[field];
    if (typeof value !== "string" || !value.trim()) return notes;
    notes.push({
      id: `legacy-${field}`,
      titleKey,
      content: value,
      order: notes.length,
    });
    return notes;
  }, []);
}

/** The title to show: the user's own words if they wrote any, else the key. */
export function noteTitle(note: ProjectNote, translate: (key: string) => string): string {
  const own = note.title?.trim();
  if (own) return own;
  return note.titleKey ? translate(`pages:${note.titleKey}`) : "";
}

/** Renumbers a list so `order` stays canonical after an add, drop or move. */
export function renumber(notes: ProjectNote[]): ProjectNote[] {
  return notes.map((note, index) => ({ ...note, order: index }));
}

/** Moves the note at `index` by one place, if there is a place to move it to. */
export function moveNote(notes: ProjectNote[], index: number, direction: -1 | 1): ProjectNote[] {
  const target = index + direction;
  if (index < 0 || target < 0 || target >= notes.length) return notes;
  const next = [...notes];
  [next[index], next[target]] = [next[target], next[index]];
  return renumber(next);
}
