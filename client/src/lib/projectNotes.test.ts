import { describe, expect, it } from "vitest";
import { moveNote, notesForPage, noteTitle, renumber } from "./projectNotes";
import type { PageSummary, ProjectNote } from "../types/page";
import { MOCK_PAGES } from "../mocks/pages";

function page(overrides: Partial<PageSummary> = {}): PageSummary {
  return {
    id: "p1",
    type: "project",
    spaceId: "work-tech",
    status: "active",
    title: "Sorcol",
    lastUpdatedAt: "2026-03-01T00:00:00.000Z",
    favorite: false,
    visibility: "private",
    ...overrides,
  };
}

describe("notesForPage — the legacy adapter", () => {
  it("derives notes from the old fields for a page never edited", () => {
    const notes = notesForPage(
      page({ description: "Why it exists", outcome: "What finishing looks like" })
    );
    expect(notes.map((note) => note.content)).toEqual([
      "Why it exists",
      "What finishing looks like",
    ]);
  });

  it("skips an empty rubric rather than turning it into an empty note", () => {
    // The whole point of the change: a page shows nothing it has nothing to
    // say about.
    const notes = notesForPage(page({ description: "Why it exists", outcome: "   " }));
    expect(notes).toHaveLength(1);
  });

  it("derives nothing at all for a page with nothing written on it", () => {
    expect(notesForPage(page())).toEqual([]);
  });

  it("never derives the four structured facts", () => {
    // They are read by the overview and the board, so they stay fields.
    const notes = notesForPage(
      page({
        currentState: "Halfway",
        stoppedAt: "Mid-component",
        blocker: "Waiting on models",
        nextAction: "Print a trial size",
      })
    );
    expect(notes).toEqual([]);
  });

  it("keeps the legacy fields on the page — the adapter destroys nothing", () => {
    const original = page({ description: "Why it exists" });
    notesForPage(original);
    expect(original.description).toBe("Why it exists");
  });
});

describe("notesForPage — absent versus empty", () => {
  it("returns an empty list for a page whose notes the user deleted", () => {
    // `[]` means "I deleted every note" and must stay empty; collapsing it into
    // `undefined` would hand the page back to the adapter and resurrect them.
    expect(notesForPage(page({ notes: [], description: "Why it exists" }))).toEqual([]);
  });

  it("reads the legacy fields only when notes are absent", () => {
    expect(notesForPage(page({ notes: undefined, description: "Why it exists" }))).toHaveLength(1);
  });

  it("prefers the page's own notes once it has any", () => {
    const own: ProjectNote[] = [{ id: "n1", title: "Mine", content: "My words", order: 0 }];
    const notes = notesForPage(page({ notes: own, description: "Why it exists" }));
    expect(notes).toEqual(own);
  });

  it("returns the notes in stored order, not array order", () => {
    const own: ProjectNote[] = [
      { id: "b", content: "second", order: 1 },
      { id: "a", content: "first", order: 0 },
    ];
    expect(notesForPage(page({ notes: own })).map((note) => note.id)).toEqual(["a", "b"]);
  });
});

describe("noteTitle", () => {
  const translate = (key: string): string => `T(${key})`;

  it("prefers the user's own words", () => {
    expect(noteTitle({ id: "n", title: "Measurements", titleKey: "notes.legacy.why", content: "", order: 0 }, translate)).toBe(
      "Measurements"
    );
  });

  it("falls back to the template key when the user has not renamed it", () => {
    expect(noteTitle({ id: "n", titleKey: "notes.legacy.why", content: "", order: 0 }, translate)).toBe(
      "T(pages:notes.legacy.why)"
    );
  });

  it("is empty for a note with neither, rather than inventing a heading", () => {
    expect(noteTitle({ id: "n", content: "", order: 0 }, translate)).toBe("");
  });
});

describe("ordering", () => {
  const notes: ProjectNote[] = [
    { id: "a", content: "a", order: 0 },
    { id: "b", content: "b", order: 1 },
    { id: "c", content: "c", order: 2 },
  ];

  it("renumbers a list so order stays canonical", () => {
    const shuffled = renumber([notes[2], notes[0]]);
    expect(shuffled.map((note) => note.order)).toEqual([0, 1]);
  });

  it("moves a note one place and renumbers", () => {
    const moved = moveNote(notes, 0, 1);
    expect(moved.map((note) => note.id)).toEqual(["b", "a", "c"]);
    expect(moved.map((note) => note.order)).toEqual([0, 1, 2]);
  });

  it("refuses to move past either end", () => {
    expect(moveNote(notes, 0, -1)).toBe(notes);
    expect(moveNote(notes, 2, 1)).toBe(notes);
  });
});

describe("the adapter is stable across reads", () => {
  /*
   * The adapter runs on every render. If it were not idempotent, a project
   * written before notes existed would grow a duplicate set of notes every time
   * somebody refreshed — the exact failure the "fill in, never remove" rule is
   * written to prevent.
   */
  const legacy: PageSummary = {
    id: "old",
    type: "project",
    spaceId: "work-tech",
    status: "active",
    title: "Written before notes existed",
    description: "Why this exists",
    outcome: "What finishing looks like",
    lastDecision: "The one decision worth keeping",
    lastUpdatedAt: "2026-01-01T00:00:00.000Z",
    favorite: false,
    visibility: "private",
  };

  it("produces the same notes however many times it runs", () => {
    const once = notesForPage(legacy);
    const twice = notesForPage(legacy);
    const thrice = notesForPage(legacy);

    expect(twice).toEqual(once);
    expect(thrice).toEqual(once);
    expect(once).toHaveLength(3);
  });

  it("gives each derived note a stable id, so nothing duplicates on a refresh", () => {
    const first = notesForPage(legacy).map((note) => note.id);
    const second = notesForPage(legacy).map((note) => note.id);

    expect(first).toEqual(second);
    expect(new Set(first).size).toBe(first.length);
  });

  it("stops deriving the moment the page has notes of its own", () => {
    // Saving once takes the page off the adapter for good — which is what makes
    // the adapter safe to run on every read.
    const edited: PageSummary = { ...legacy, notes: [] };
    expect(notesForPage(edited)).toEqual([]);
    expect(notesForPage(edited)).toEqual([]);
  });
});

describe("the seeded projects all open", () => {
  it("handles every seeded project, with or without notes and pictures", () => {
    const projects = MOCK_PAGES.filter((page) => page.type === "project");
    expect(projects.length).toBeGreaterThan(0);

    for (const project of projects) {
      // Never throws, always an array, always ordered.
      const notes = notesForPage(project);
      expect(Array.isArray(notes), project.id).toBe(true);
      expect(notes.map((note) => note.order)).toEqual(notes.map((_, index) => index));
      // And an empty rubric never became an empty note.
      for (const note of notes) expect(note.content.trim().length).toBeGreaterThan(0);
    }
  });

  it("covers the three shapes the migration has to survive", () => {
    const projects = MOCK_PAGES.filter((page) => page.type === "project");

    // A project the user has edited down to nothing keeps an empty list.
    expect(projects.some((page) => page.notes?.length === 0)).toBe(true);
    // A project that has never been edited reads its legacy fields.
    expect(projects.some((page) => page.notes === undefined)).toBe(true);
    // A project with no picture at all still opens.
    expect(projects.some((page) => !page.visionImageUrl)).toBe(true);
  });
});
