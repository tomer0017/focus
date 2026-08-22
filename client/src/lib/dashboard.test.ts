/**
 * The overview's decision logic.
 *
 * These tests are about restraint. Nearly every failure this screen can have is
 * a failure of *including* something: a renewal eight months out, a haircut that
 * sits there every day of the year, the same appointment arriving from two
 * sources, seventy projects when three would do. So most of what follows checks
 * that something is **absent**.
 */
import { describe, expect, it } from "vitest";
import {
  FOCUS_LIMIT,
  NEEDS_YOU_LIMIT,
  NEXT_DAYS_LIMIT,
  dedupeBySource,
  focusLineFor,
  selectFocusLearning,
  selectFocusProjects,
  selectNeedsYouNow,
  selectNextDays,
  severityOf,
  stateOf,
} from "./dashboard";
import { collectRelevance, type RelevanceInput, type RelevanceItem } from "./relevance";
import { DEFAULT_PREP_DAYS, urgencyOf } from "./eventTiming";
import type { FocusEvent, PageSummary } from "../types";

const NOW = new Date(2026, 2, 10, 12, 0, 0);
const inDays = (days: number, hour = 18): string =>
  new Date(2026, 2, 10 + days, hour, 0, 0).toISOString();
const dayKey = (days: number): string => {
  const d = new Date(2026, 2, 10 + days);
  const pad = (v: number): string => String(v).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

function empty(): RelevanceInput {
  return {
    scheduled: [],
    events: [],
    profiles: [],
    commitments: [],
    money: [],
    medications: [],
    pages: [],
    trips: [],
  };
}

function row(extra: Partial<RelevanceItem> = {}): RelevanceItem {
  return {
    id: "r1",
    source: "scheduled",
    title: "Thing",
    overdue: false,
    completable: true,
    snoozable: true,
    bucket: "today",
    ...extra,
  };
}

function page(extra: Partial<PageSummary> = {}): PageSummary {
  return {
    id: "p1",
    type: "project",
    spaceId: "home",
    status: "active",
    title: "A project",
    lastUpdatedAt: "2026-03-01T00:00:00.000Z",
    favorite: false,
    visibility: "private",
    ...extra,
  };
}

function event(extra: Partial<FocusEvent> = {}): FocusEvent {
  return {
    id: "e1",
    kind: "custom",
    title: "Something",
    startsAt: inDays(30),
    spaceId: "personal",
    sections: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    ...extra,
  };
}

describe("severity decides the order, not the calendar", () => {
  it("puts a late thing before anything due today", () => {
    const late = row({ id: "late", overdue: true, daysAway: -4, at: inDays(-4) });
    const today = row({ id: "today", daysAway: 0, at: inDays(0, 8) });

    const { visible } = selectNeedsYouNow([today, late]);
    expect(visible.map((entry) => entry.id)).toEqual(["late", "today"]);
  });

  it("puts today before tomorrow", () => {
    const today = row({ id: "today", daysAway: 0, at: inDays(0) });
    const tomorrow = row({ id: "tomorrow", daysAway: 1, at: inDays(1), bucket: "week" });

    expect(severityOf(today)).toBeLessThan(severityOf(tomorrow));
  });

  it("never lets a distant date cross a severity band", () => {
    // 99 days away and merely "soon" still sorts after anything due today.
    const distant = row({ id: "far", daysAway: 99, bucket: "week" });
    const today = row({ id: "today", daysAway: 0 });
    expect(severityOf(today)).toBeLessThan(severityOf(distant));
  });

  it("says the state in a word", () => {
    expect(stateOf(row({ overdue: true }))).toBe("overdue");
    expect(stateOf(row({ daysAway: 0 }))).toBe("today");
    expect(stateOf(row({ daysAway: 3 }))).toBe("soon");
  });
});

describe("nothing appears twice", () => {
  it("de-duplicates on the source's identity, not the title", () => {
    const a = row({ id: "a", reference: { kind: "scheduled", id: "s1" } });
    const b = row({ id: "b", reference: { kind: "scheduled", id: "s1" } });
    expect(dedupeBySource([a, b])).toHaveLength(1);
  });

  it("keeps two different things that happen to share a title", () => {
    const a = row({ id: "a", title: "בדיקה", reference: { kind: "scheduled", id: "s1" } });
    const b = row({ id: "b", title: "בדיקה", reference: { kind: "scheduled", id: "s2" } });
    expect(dedupeBySource([a, b])).toHaveLength(2);
  });

  it("never repeats a row between the two time areas", () => {
    const urgent = row({ id: "u", daysAway: 0, reference: { kind: "scheduled", id: "s1" } });
    const soon = row({
      id: "s",
      daysAway: 3,
      bucket: "week",
      reference: { kind: "scheduled", id: "s2" },
    });

    const now = selectNeedsYouNow([urgent, soon]);
    const next = selectNextDays([urgent, soon], { exclude: now.visible });

    expect(now.visible.map((e) => e.id)).toEqual(["u"]);
    expect(next.visible.map((e) => e.id)).toEqual(["s"]);
  });
});

describe("the horizon", () => {
  it("leaves out anything past a fortnight", () => {
    const soon = row({ id: "soon", daysAway: 9, bucket: "upcoming" });
    const far = row({ id: "far", daysAway: 40, bucket: "upcoming" });

    expect(selectNextDays([soon, far]).visible.map((e) => e.id)).toEqual(["soon"]);
  });

  it("leaves out anything with no date at all", () => {
    // An idle learning page belongs on the learning screen, not in a list of
    // dates.
    const idle = row({ id: "idle", daysAway: undefined, bucket: "recurring" });
    expect(selectNextDays([idle]).visible).toEqual([]);
  });

  it("does not show a recurring commitment that is still far off", () => {
    // A haircut every three weeks must not be a permanent fixture.
    const input = empty();
    input.scheduled = [
      {
        id: "haircut",
        title: "תספורת",
        category: "appointment",
        status: "active",
        dueAt: inDays(19),
        recurrence: { kind: "weekly", interval: 3 },
        createdAt: "x",
        updatedAt: "x",
      },
    ];

    const items = collectRelevance(input, NOW);
    expect(selectNextDays(items, { horizonDays: 14 }).visible).toEqual([]);
  });

  it("shows a commitment once it is two days out", () => {
    const input = empty();
    input.scheduled = [
      {
        id: "gym",
        title: "חדר כושר",
        category: "reminder",
        status: "active",
        dueAt: inDays(2),
        createdAt: "x",
        updatedAt: "x",
      },
    ];

    const items = collectRelevance(input, NOW);
    expect(selectNextDays(items).visible.map((e) => e.title)).toEqual(["חדר כושר"]);
  });

  it("leaves out anything already completed", () => {
    const input = empty();
    input.scheduled = [
      {
        id: "done",
        title: "כבר טופל",
        category: "reminder",
        status: "completed",
        dueAt: inDays(1),
        createdAt: "x",
        updatedAt: "x",
      },
    ];

    const items = collectRelevance(input, NOW);
    expect(items).toEqual([]);
  });
});

describe("events enter on their own preparation window", () => {
  it("brings a holiday in five days before, and not nine", () => {
    expect(DEFAULT_PREP_DAYS.holiday).toBe(5);
    // Five days out it is asking. It arrives as `soon` rather than `preparing`
    // because anything inside a week is already the louder state — the table
    // entry states the policy, the week rule does the work.
    expect(urgencyOf(event({ kind: "holiday", startsAt: inDays(5) }), NOW)).toBe("soon");
    expect(urgencyOf(event({ kind: "holiday", startsAt: inDays(9) }), NOW)).toBe("neutral");
  });

  it("brings a wedding in a month before, which no week rule would catch", () => {
    // This is where the table actually changes behaviour.
    expect(urgencyOf(event({ kind: "wedding", startsAt: inDays(25) }), NOW)).toBe("preparing");
    expect(urgencyOf(event({ kind: "wedding", startsAt: inDays(45) }), NOW)).toBe("neutral");
  });

  it("brings a birthday in a fortnight before", () => {
    expect(urgencyOf(event({ kind: "birthday", startsAt: inDays(13) }), NOW)).toBe("preparing");
    expect(urgencyOf(event({ kind: "birthday", startsAt: inDays(20) }), NOW)).toBe("neutral");
  });

  it("lets the user's own window override the default", () => {
    // The rule the whole module exists for: only the owner knows a 60th
    // birthday needs a hall booked two months out.
    expect(
      urgencyOf(event({ kind: "birthday", startsAt: inDays(55), prepDaysBefore: 60 }), NOW)
    ).toBe("preparing");
  });

  it("keeps a big event quiet when its owner marked it unimportant", () => {
    expect(
      urgencyOf(
        event({ kind: "wedding", startsAt: inDays(25), importance: "low" }),
        NOW
      )
    ).toBe("neutral");
  });

  it("still says nothing about a distant event with no kind opinion", () => {
    expect(urgencyOf(event({ kind: "custom", startsAt: inDays(60) }), NOW)).toBe("neutral");
  });
});

describe("a departure asks ten days out", () => {
  const trip = (days: number, status: "planned" | "done" = "planned") => ({
    id: "t1",
    title: "יפן",
    countries: ["יפן"],
    startDate: dayKey(days),
    endDate: dayKey(days + 10),
    status,
    flights: [],
    stays: [],
    destinations: [],
    days: [],
    food: [],
    outfits: [],
    createdAt: "x",
  });

  it("appears inside the window", () => {
    const input = empty();
    input.trips = [trip(8)];
    expect(collectRelevance(input, NOW).map((e) => e.title)).toEqual(["יפן"]);
  });

  it("stays quiet outside it", () => {
    const input = empty();
    input.trips = [trip(40)];
    expect(collectRelevance(input, NOW)).toEqual([]);
  });

  it("says nothing about a trip already taken", () => {
    const input = empty();
    input.trips = [trip(5, "done")];
    expect(collectRelevance(input, NOW)).toEqual([]);
  });
});

describe("what I am working on", () => {
  it("shows at most three projects", () => {
    const many = Array.from({ length: 70 }, (_, i) =>
      page({ id: `p${i}`, title: `Project ${i}` })
    );
    const { visible, more } = selectFocusProjects(many);
    expect(visible).toHaveLength(FOCUS_LIMIT);
    expect(more).toBe(67);
  });

  it("shows at most three learning pages", () => {
    const many = Array.from({ length: 40 }, (_, i) =>
      page({ id: `l${i}`, type: "learning", title: `Topic ${i}` })
    );
    expect(selectFocusLearning(many).visible).toHaveLength(FOCUS_LIMIT);
  });

  it("never lists a parked or finished project as active", () => {
    const pages = [
      page({ id: "live", status: "active" }),
      page({ id: "parked", status: "paused" }),
      page({ id: "done", status: "completed" }),
    ];
    expect(selectFocusProjects(pages).visible.map((e) => e.id)).toEqual(["live"]);
  });

  it("never lists a finished learning page", () => {
    const pages = [
      page({ id: "learning", type: "learning", status: "active" }),
      page({ id: "finished", type: "learning", status: "completed" }),
    ];
    expect(selectFocusLearning(pages).visible.map((e) => e.id)).toEqual(["learning"]);
  });

  it("leads with a blocked project and says so", () => {
    const pages = [
      page({ id: "fine", lastUpdatedAt: "2026-03-09T00:00:00.000Z" }),
      page({ id: "stuck", blocker: "מחכה להצעת מחיר", lastUpdatedAt: "2026-01-01T00:00:00.000Z" }),
    ];
    const { visible } = selectFocusProjects(pages);
    expect(visible[0].id).toBe("stuck");
    // Blocked is a fact about an active project, never a fourth status.
    expect(visible[0].state).toBe("blocked");
    expect(visible[1].state).toBe("active");
  });

  it("keeps projects and learning pages in their own lists", () => {
    const pages = [page({ id: "proj" }), page({ id: "learn", type: "learning" })];
    expect(selectFocusProjects(pages).visible.map((e) => e.id)).toEqual(["proj"]);
    expect(selectFocusLearning(pages).visible.map((e) => e.id)).toEqual(["learn"]);
  });
});

describe("the line each row shows", () => {
  it("prefers what to do next", () => {
    expect(focusLineFor(page({ nextAction: "לקנות צירים", stoppedAt: "באמצע" }))).toBe(
      "לקנות צירים"
    );
  });

  it("falls back to where you stopped", () => {
    expect(focusLineFor(page({ stoppedAt: "באמצע המדידות" }))).toBe("באמצע המדידות");
  });

  it("reads a 'where I stopped' note when neither field is filled", () => {
    // Read through the page, never copied into another model.
    const withNote = page({
      notes: [
        {
          id: "n1",
          titleKey: "learning.notes.stoppedAt.title",
          content: "יחידה 4, תרגיל שני",
          order: 0,
        },
      ],
    });
    expect(focusLineFor(withNote)).toBe("יחידה 4, תרגיל שני");
  });

  it("says nothing rather than inventing a line", () => {
    expect(focusLineFor(page({ notes: [] }))).toBeUndefined();
  });
});

describe("the caps hold under a heavy load", () => {
  it("shows five urgent rows and counts the rest", () => {
    const items = Array.from({ length: 100 }, (_, i) =>
      row({
        id: `r${i}`,
        daysAway: 0,
        at: inDays(0, i % 24),
        reference: { kind: "scheduled", id: `s${i}` },
      })
    );
    const { visible, more } = selectNeedsYouNow(items);
    expect(visible).toHaveLength(NEEDS_YOU_LIMIT);
    expect(more).toBe(95);
  });

  it("shows six upcoming rows and counts the rest", () => {
    const items = Array.from({ length: 50 }, (_, i) =>
      row({
        id: `n${i}`,
        bucket: "week",
        daysAway: 1 + (i % 13),
        reference: { kind: "scheduled", id: `x${i}` },
      })
    );
    const { visible, more } = selectNextDays(items);
    expect(visible).toHaveLength(NEXT_DAYS_LIMIT);
    expect(more).toBe(44);
  });
});
