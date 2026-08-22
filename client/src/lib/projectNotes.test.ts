import { describe, expect, it } from "vitest";
import { moveNote, notesForPage, noteTitle, renumber } from "./projectNotes";
import type { PageSummary, ProjectNote } from "../types/page";

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
