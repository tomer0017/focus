import { describe, expect, it } from "vitest";
import {
  belongsTo,
  hasSection,
  initialsOf,
  lastActivityFor,
  logsFor,
  nextAttentionFor,
  nextDateFor,
  sectionsOf,
  sortProfiles,
} from "./familySelectors";
import type { FamilyProfile } from "../types/family";
import type { QuickLogEntry } from "../types/quickLog";
import type { ScheduledItem } from "../types/scheduled";

const NOW = new Date(2026, 2, 10, 12, 0, 0);
const inDays = (days: number): string => new Date(2026, 2, 10 + days, 12, 0, 0).toISOString();

function profile(overrides: Partial<FamilyProfile> = {}): FamilyProfile {
  return {
    id: "grandma",
    name: "סבתא רחל",
    type: "adult",
    activeSections: [
      { id: "s2", kind: "notes", order: 1 },
      { id: "s1", kind: "reminders", order: 0 },
    ],
    notes: [],
    birthday: { enabled: false },
    savedItemIds: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: inDays(-20),
    ...overrides,
  };
}

function scheduled(overrides: Partial<ScheduledItem> = {}): ScheduledItem {
  return {
    id: "s1",
    title: "Visit",
    category: "contact",
    status: "active",
    relatedEntity: { kind: "family", id: "grandma" },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("belongsTo", () => {
  it("matches only items pointing at this profile", () => {
    const items = [
      scheduled({ id: "mine" }),
      scheduled({ id: "someone-else", relatedEntity: { kind: "family", id: "dad" } }),
      scheduled({ id: "unattached", relatedEntity: undefined }),
      // Same id, different kind — a page called "grandma" is not the profile.
      scheduled({ id: "wrong-kind", relatedEntity: { kind: "page", id: "grandma" } }),
    ];
    expect(belongsTo(items, "grandma").map((entry) => entry.id)).toEqual(["mine"]);
  });
});

describe("sections", () => {
  it("returns sections in their stored order, not their array order", () => {
    expect(sectionsOf(profile()).map((section) => section.kind)).toEqual(["reminders", "notes"]);
  });

  it("reports whether a section is switched on", () => {
    expect(hasSection(profile(), "notes")).toBe(true);
    expect(hasSection(profile(), "feeding")).toBe(false);
  });
});

describe("nextAttentionFor", () => {
  it("prefers something already due over something merely scheduled", () => {
    const attention = nextAttentionFor(
      profile(),
      [scheduled({ id: "later", dueAt: inDays(5) }), scheduled({ id: "due", dueAt: inDays(-2) })],
      NOW
    );
    expect(attention!.item.id).toBe("due");
    expect(attention!.overdue).toBe(true);
  });

  it("falls back to the soonest dated item", () => {
    const attention = nextAttentionFor(profile(), [scheduled({ id: "later", dueAt: inDays(9) })], NOW);
    expect(attention!.item.id).toBe("later");
    expect(attention!.overdue).toBe(false);
    expect(attention!.daysAway).toBe(9);
  });

  it("says nothing at all when nothing is outstanding", () => {
    // A profile with nothing to do gets a shorter card, not a placeholder line.
    expect(nextAttentionFor(profile(), [], NOW)).toBeUndefined();
  });

  it("ignores completed items", () => {
    expect(
      nextAttentionFor(profile(), [scheduled({ dueAt: inDays(-1), status: "completed" })], NOW)
    ).toBeUndefined();
  });
});

describe("nextDateFor", () => {
  it("returns whichever comes first, a birthday or a scheduled item", () => {
    const withBirthday = profile({
      birthDate: "1937-03-15",
      birthday: { enabled: true },
    });
    const soon = nextDateFor(withBirthday, [scheduled({ dueAt: inDays(1) })], NOW);
    expect(soon!.label).toBe("scheduled");

    const later = nextDateFor(withBirthday, [scheduled({ dueAt: inDays(20) })], NOW);
    expect(later!.label).toBe("birthday");
  });

  it("ignores dates that have already passed", () => {
    expect(nextDateFor(profile(), [scheduled({ dueAt: inDays(-4) })], NOW)).toBeUndefined();
  });
});

describe("lastActivityFor", () => {
  const logs: QuickLogEntry[] = [
    { id: "l1", kind: "visit", occurredAt: inDays(-11), relatedEntity: { kind: "family", id: "grandma" } },
  ];

  it("takes the most recent of completions, log entries and edits", () => {
    const last = lastActivityFor(
      profile(),
      [scheduled({ lastCompletedAt: inDays(-3) })],
      logs
    );
    expect(last).toBe(inDays(-3));
  });

  it("is undefined only when there is genuinely nothing", () => {
    // `updatedAt` always exists, so this is never empty for a real profile —
    // which is what keeps the card from inventing a "never" it cannot know.
    expect(lastActivityFor(profile(), [], [])).toBe(inDays(-20));
  });
});

describe("logsFor", () => {
  const logs: QuickLogEntry[] = [
    { id: "a", kind: "feeding", occurredAt: inDays(-1), relatedEntity: { kind: "family", id: "grandma" } },
    { id: "b", kind: "visit", occurredAt: inDays(-3), relatedEntity: { kind: "family", id: "grandma" } },
    { id: "c", kind: "feeding", occurredAt: inDays(-2), relatedEntity: { kind: "family", id: "baby" } },
  ];

  it("returns this profile's entries, newest first", () => {
    expect(logsFor(logs, "grandma").map((entry) => entry.id)).toEqual(["a", "b"]);
  });

  it("narrows by kind when asked", () => {
    expect(logsFor(logs, "grandma", "visit").map((entry) => entry.id)).toEqual(["b"]);
  });
});

describe("sortProfiles", () => {
  it("puts people before animals, then sorts by name", () => {
    const ordered = sortProfiles([
      profile({ id: "dog", name: "Luna", type: "pet" }),
      profile({ id: "baby", name: "Noam", type: "baby" }),
      profile({ id: "b", name: "Bob", type: "adult" }),
      profile({ id: "a", name: "Ann", type: "adult" }),
    ]);
    expect(ordered.map((entry) => entry.id)).toEqual(["a", "b", "baby", "dog"]);
  });
});

describe("initialsOf", () => {
  it("takes the first and last initials", () => {
    expect(initialsOf("Ann Baker")).toBe("AB");
    expect(initialsOf("Ann Marie Baker")).toBe("AB");
  });

  it("takes two characters from a single name", () => {
    expect(initialsOf("Luna")).toBe("Lu");
  });

  it("handles Hebrew and never returns an empty string", () => {
    expect(initialsOf("סבתא רחל")).toBe("סר");
    expect(initialsOf("   ")).toBe("?");
  });
});
