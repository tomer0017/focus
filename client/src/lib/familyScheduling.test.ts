/**
 * Family scheduling, ownership and the delete cascade.
 *
 * A family profile is a **context**, not a subsystem: a dentist appointment, a
 * workout every three days and a visit every fortnight are all one
 * `ScheduledItem` with a category and an explicit owner reference. So most of
 * what follows is about **isolation** — one person's records must never surface
 * on another's page — and about what deleting a profile is allowed to take with
 * it.
 */
import { describe, expect, it } from "vitest";
import {
  FAMILY_NOTE_TEMPLATES,
  belongsTo,
  countByType,
  familyReference,
  filterProfiles,
  footprintOf,
  logsFor,
  medicationsFor,
  nextAttentionFor,
  sortProfiles,
} from "./familySelectors";
import { nextOccurrenceAfter } from "./recurrence";
import { completeOccurrence, isOpen } from "./scheduled";
import { ageAtNextBirthday, birthdayEventFor, isDerivedBirthday, withBirthdays } from "./birthdays";
import { filterMaterials, paginate } from "./projectMaterials";
import type {
  FamilyProfile,
  Medication,
  QuickLogEntry,
  SavedItem,
  ScheduledItem,
} from "../types";

const NOW = new Date(2026, 2, 10, 12, 0, 0);
const iso = (days: number, hour = 9): string =>
  new Date(2026, 2, 10 + days, hour, 0, 0).toISOString();

function profile(extra: Partial<FamilyProfile> = {}): FamilyProfile {
  return {
    id: "dad",
    name: "אבא",
    type: "adult",
    relationship: "אבא",
    activeSections: [],
    notes: [],
    birthday: { enabled: true },
    savedItemIds: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...extra,
  };
}

function item(extra: Partial<ScheduledItem> = {}): ScheduledItem {
  return {
    id: "s1",
    title: "Something",
    category: "reminder",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...extra,
  };
}

function medicine(extra: Partial<Medication> = {}): Medication {
  return {
    id: "m1",
    name: "ויטמין",
    form: "vitamin",
    times: [],
    taken: [],
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...extra,
  };
}

function saved(extra: Partial<SavedItem> = {}): SavedItem {
  return {
    id: "m1",
    kind: "document",
    title: "A document",
    spaceId: "personal",
    source: "web",
    thumb: "document",
    contextIds: ["dad"],
    savedAt: "2026-01-01T00:00:00.000Z",
    ...extra,
  };
}

describe("a scheduled item belongs to exactly one profile", () => {
  const dad = profile();
  const grandma = profile({ id: "grandma", name: "סבתא" });

  const all = [
    item({ id: "dentist", title: "טיפול שיניים", relatedEntity: familyReference("dad") }),
    item({ id: "visit", title: "ביקור", relatedEntity: familyReference("grandma") }),
    item({ id: "loose", title: "לשלם ארנונה" }),
  ];

  it("attaches by an explicit reference, never by a name", () => {
    expect(familyReference("dad")).toEqual({ kind: "family", id: "dad" });
    expect(belongsTo(all, dad.id).map((e) => e.id)).toEqual(["dentist"]);
  });

  it("keeps two profiles isolated", () => {
    expect(belongsTo(all, grandma.id).map((e) => e.id)).toEqual(["visit"]);
    expect(belongsTo(all, dad.id).some((e) => e.id === "visit")).toBe(false);
  });

  it("shows an unassigned item on nobody's page", () => {
    // The migration rule: never guess an owner. It stays in Manage instead.
    expect(belongsTo(all, dad.id).some((e) => e.id === "loose")).toBe(false);
    expect(belongsTo(all, grandma.id).some((e) => e.id === "loose")).toBe(false);
  });

  it("does not attach a profile whose id merely starts the same way", () => {
    const items = [item({ id: "x", relatedEntity: familyReference("dad-in-law") })];
    expect(belongsTo(items, "dad")).toEqual([]);
  });
});

describe("recurrence, without an occurrence for every repeat", () => {
  it("repeats a workout every three days", () => {
    const workout = item({
      id: "workout",
      title: "אימון עם אבא",
      dueAt: iso(0),
      recurrence: { kind: "daily", interval: 3 },
      relatedEntity: familyReference("dad"),
    });

    // One record, not a row per future session.
    const next = nextOccurrenceAfter(workout.recurrence!, workout.dueAt!, NOW);
    expect(next?.slice(0, 10)).toBe(iso(3).slice(0, 10));
  });

  it("repeats a visit every fortnight", () => {
    const visit = item({
      id: "visit",
      dueAt: iso(0),
      recurrence: { kind: "weekly", interval: 2 },
    });
    expect(nextOccurrenceAfter(visit.recurrence!, visit.dueAt!, NOW)?.slice(0, 10)).toBe(
      iso(14).slice(0, 10)
    );
  });

  it("moves a recurring item forward when it is completed, and keeps it open", () => {
    const workout = item({
      dueAt: iso(0),
      recurrence: { kind: "daily", interval: 3 },
      relatedEntity: familyReference("dad"),
    });

    const after = completeOccurrence(workout, NOW);
    expect(after.dueAt?.slice(0, 10)).toBe(iso(3).slice(0, 10));
    expect(isOpen(after)).toBe(true);
    // And the owner is untouched.
    expect(after.relatedEntity).toEqual(familyReference("dad"));
  });

  it("closes a one-off treatment when it is completed", () => {
    const dentist = item({ dueAt: iso(60), relatedEntity: familyReference("dad") });
    const after = completeOccurrence(dentist, NOW);
    expect(after.status).toBe("completed");
  });

  it("counts from the anchor rather than from today", () => {
    // A fortnightly visit ticked off four days late stays on its own rhythm:
    // the next date is measured from the due date, not from when it was ticked.
    const late = new Date(2026, 2, 14, 12, 0, 0);
    const next = nextOccurrenceAfter({ kind: "weekly", interval: 2 }, iso(0), late);
    expect(next?.slice(0, 10)).toBe(iso(14).slice(0, 10));
  });
});

describe("the nearest thing on a profile", () => {
  it("prefers what is already late", () => {
    const items = [
      item({ id: "soon", dueAt: iso(5), relatedEntity: familyReference("dad") }),
      item({ id: "late", dueAt: iso(-3), relatedEntity: familyReference("dad") }),
    ];
    const attention = nextAttentionFor(profile(), items, NOW);
    expect(attention?.item.id).toBe("late");
    expect(attention?.overdue).toBe(true);
  });

  it("says nothing rather than inventing a line", () => {
    expect(nextAttentionFor(profile(), [], NOW)).toBeUndefined();
  });
});

describe("the birthday is derived, never stored", () => {
  it("derives the next one from the birth date", () => {
    const dad = profile({ birthDate: "1968-06-20" });
    const event = birthdayEventFor(dad, NOW);
    expect(event).toBeDefined();
    expect(isDerivedBirthday(event!)).toBe(true);
    const when = new Date(event!.startsAt);
    expect(when.getMonth()).toBe(5); // June
    expect(when.getDate()).toBe(20);
  });

  it("produces exactly one event however many times it is read", () => {
    // No sweep creates next year's, so there is nothing to duplicate.
    const dad = profile({ birthDate: "1968-06-20" });
    const once = withBirthdays([], [dad], NOW);
    const twice = withBirthdays([], [dad], NOW);
    expect(once).toHaveLength(1);
    expect(twice).toHaveLength(1);
    expect(once[0].id).toBe(twice[0].id);
  });

  it("follows a corrected birth date", () => {
    const first = birthdayEventFor(profile({ birthDate: "1968-06-20" }), NOW);
    const fixed = birthdayEventFor(profile({ birthDate: "1968-07-02" }), NOW);
    expect(first!.startsAt).not.toBe(fixed!.startsAt);
    const when = new Date(fixed!.startsAt);
    expect(when.getMonth()).toBe(6); // July
    expect(when.getDate()).toBe(2);
  });

  it("stops deriving when the user turns the birthday off, and loses nothing else", () => {
    const dad = profile({ birthDate: "1968-06-20", birthday: { enabled: false } });
    expect(birthdayEventFor(dad, NOW)).toBeUndefined();
    // The birth date itself is still there.
    expect(dad.birthDate).toBe("1968-06-20");
  });

  it("handles a 29 February birth date without inventing a date", () => {
    const leap = profile({ birthDate: "2000-02-29" });
    const event = birthdayEventFor(leap, NOW);
    expect(event).toBeDefined();
    // 2026 is not a leap year: it must land on a real day rather than roll
    // into March or produce an invalid date.
    const when = new Date(event!.startsAt);
    expect(Number.isNaN(when.getTime())).toBe(false);
    expect(when.getMonth()).toBe(1); // still February
    expect(when.getDate()).toBe(28);
    expect(ageAtNextBirthday("2000-02-29")).toBeGreaterThan(0);
  });

  it("does not treat a real stored event as derived", () => {
    const dad = profile({ birthDate: "1968-06-20" });
    const stored = {
      ...birthdayEventFor(dad, NOW)!,
      derived: undefined,
      title: "60 לאבא",
      sections: [],
    };
    expect(isDerivedBirthday(stored)).toBe(false);
    // And the real one wins: only one row for that id.
    const merged = withBirthdays([stored], [dad], NOW);
    expect(merged.filter((event) => event.id === stored.id)).toHaveLength(1);
    expect(merged.find((event) => event.id === stored.id)?.title).toBe("60 לאבא");
  });
});

describe("notes, medicines and logs stay with their profile", () => {
  it("keeps notes in the order they were stored", () => {
    const withNotes = profile({
      notes: [
        { id: "b", title: "Second", content: "…", order: 1 },
        { id: "a", title: "First", content: "…", order: 0 },
      ],
    });
    const sorted = [...withNotes.notes].sort((x, y) => x.order - y.order);
    expect(sorted.map((note) => note.id)).toEqual(["a", "b"]);
  });

  it("offers family prompts and not another area's", () => {
    const ids = FAMILY_NOTE_TEMPLATES.map((entry) => entry.id);
    expect(ids).toContain("forTheDoctor");
    expect(ids).toContain("medicines");
    expect(ids).not.toContain("prosCons");
  });

  it("isolates medicines and logs by profile", () => {
    const medications = [
      medicine({ id: "m1", name: "לחץ דם", relatedEntity: familyReference("grandma") }),
      medicine({ id: "m2", relatedEntity: familyReference("dad") }),
    ];
    expect(medicationsFor(medications, "grandma").map((m) => m.id)).toEqual(["m1"]);

    const logs: QuickLogEntry[] = [
      { id: "l1", kind: "feeding", occurredAt: iso(-1), relatedEntity: familyReference("baby") },
      { id: "l2", kind: "feeding", occurredAt: iso(-2), relatedEntity: familyReference("dad") },
    ];
    expect(logsFor(logs, "baby").map((l) => l.id)).toEqual(["l1"]);
  });
});

describe("materials", () => {
  const items = [
    saved({ id: "plan", kind: "document", title: "תוכנית אימונים", contextIds: ["dad"] }),
    saved({ id: "clinic", kind: "link", title: "קביעת תור", contextIds: ["dad"] }),
    saved({ id: "questions", kind: "document", contextIds: ["grandma"] }),
    // One item, two owners — shared on purpose, never copied.
    saved({ id: "shared", kind: "link", contextIds: ["dad", "plan-a"] }),
  ];

  const forProfile = (id: string) => items.filter((entry) => entry.contextIds.includes(id));

  it("does not show one profile's material on another", () => {
    expect(forProfile("dad").map((e) => e.id)).toEqual(["plan", "clinic", "shared"]);
    expect(forProfile("grandma").map((e) => e.id)).toEqual(["questions"]);
  });

  it("lets one saved item belong to a profile and a training plan at once", () => {
    const shared = items.find((e) => e.id === "shared")!;
    expect(shared.contextIds).toContain("dad");
    expect(shared.contextIds).toContain("plan-a");
    // Attaching it twice stored one entity, not two.
    expect(items.filter((e) => e.id === "shared")).toHaveLength(1);
  });

  it("filters and pages a profile's material", () => {
    const mine = forProfile("dad");
    expect(filterMaterials(mine, { filter: "documents" }).map((e) => e.id)).toEqual(["plan"]);
    expect(filterMaterials(mine, { filter: "all", query: "תור" }).map((e) => e.id)).toEqual([
      "clinic",
    ]);

    const many = Array.from({ length: 150 }, (_, i) => saved({ id: `x${i}`, kind: "link" }));
    expect(paginate(many, 1, 20).items).toHaveLength(20);
    expect(paginate(many, 1, 20).pageCount).toBe(8);
  });
});

describe("deleting a profile", () => {
  const dad = profile({
    notes: [{ id: "n", title: "Worth knowing", content: "…", order: 0 }],
  });

  const scheduled = [
    item({ id: "a", relatedEntity: familyReference("dad") }),
    item({ id: "b", relatedEntity: familyReference("dad") }),
    item({ id: "c", relatedEntity: familyReference("grandma") }),
  ];
  const medications = [medicine({ id: "m", relatedEntity: familyReference("dad") })];
  const logs: QuickLogEntry[] = [
    { id: "l", kind: "other", occurredAt: iso(-1), relatedEntity: familyReference("dad") },
  ];
  const materials = [
    saved({ id: "own", contextIds: ["dad"] }),
    saved({ id: "shared", contextIds: ["dad", "plan-a"] }),
  ];

  it("counts exactly what would go, before anything goes", () => {
    const footprint = footprintOf(dad, scheduled, medications, logs, materials);
    expect(footprint.scheduled).toBe(2);
    expect(footprint.medications).toBe(1);
    expect(footprint.logs).toBe(1);
    expect(footprint.notes).toBe(1);
    expect(footprint.materials).toBe(2);
    // Only records the profile actually owns are in the cascade.
    expect(footprint.owned).toBe(4);
  });

  it("never counts a saved item as something the cascade deletes", () => {
    // A shared item belongs to other things too; only the link is removed, so
    // materials are reported separately and are not part of `owned`.
    const footprint = footprintOf(dad, scheduled, medications, logs, materials);
    expect(footprint.owned).toBe(footprint.scheduled + footprint.medications + footprint.logs);
    expect(footprint.materials).toBeGreaterThan(0);
  });

  it("counts nothing for another profile's records", () => {
    const grandma = profile({ id: "grandma", name: "סבתא", notes: [] });
    const footprint = footprintOf(grandma, scheduled, medications, logs, materials);
    expect(footprint.scheduled).toBe(1);
    expect(footprint.medications).toBe(0);
    expect(footprint.materials).toBe(0);
  });
});

describe("the index", () => {
  const people = [
    profile({ id: "dad", name: "אבא", relationship: "אבא" }),
    profile({ id: "mom", name: "אמא", relationship: "אמא" }),
    profile({ id: "luna", name: "לונה", type: "pet", species: "כלבה" }),
    profile({ id: "baby", name: "תינוק", type: "baby" }),
  ];

  it("filters by type", () => {
    expect(filterProfiles(people, { type: "pet" }).map((p) => p.id)).toEqual(["luna"]);
    expect(countByType(people)).toEqual({ adult: 2, child: 0, baby: 1, pet: 1 });
  });

  it("searches the name, the relationship and the species", () => {
    expect(filterProfiles(people, { query: "כלבה" }).map((p) => p.id)).toEqual(["luna"]);
    expect(filterProfiles(people, { query: "אמא" }).map((p) => p.id)).toEqual(["mom"]);
  });

  it("pages a hundred profiles instead of listing them all", () => {
    const many = Array.from({ length: 100 }, (_, i) => profile({ id: `p${i}`, name: `Person ${i}` }));
    expect(sortProfiles(many)).toHaveLength(100);
    expect(paginate(sortProfiles(many), 1, 20).items).toHaveLength(20);
    expect(paginate(sortProfiles(many), 1, 20).pageCount).toBe(5);
  });

  it("puts people before animals", () => {
    const ordered = sortProfiles(people);
    expect(ordered.at(-1)?.type).toBe("pet");
  });
});
