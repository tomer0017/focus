import { describe, expect, it } from "vitest";
import { collectRelevance, groupRelevance, openReminderCount } from "./relevance";
import type { RelevanceInput } from "./relevance";
import type { ScheduledItem } from "../types/scheduled";
import type { Commitment, MoneyEntry } from "../types/finance";
import type { FamilyProfile } from "../types/family";
import type { PageSummary } from "../types/page";

const NOW = new Date(2026, 2, 10, 12, 0, 0);
const inDays = (days: number, hour = 12): string =>
  new Date(2026, 2, 10 + days, hour, 0, 0).toISOString();
const dayKey = (days: number): string => {
  const date = new Date(2026, 2, 10 + days);
  const pad = (value: number): string => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
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

function scheduled(overrides: Partial<ScheduledItem> = {}): ScheduledItem {
  return {
    id: "s1",
    title: "Visit",
    category: "contact",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function commitment(overrides: Partial<Commitment> = {}): Commitment {
  return {
    id: "c1",
    kind: "subscription",
    title: "Streaming",
    cycle: "monthly",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function page(overrides: Partial<PageSummary> = {}): PageSummary {
  return {
    id: "p1",
    type: "project",
    spaceId: "personal",
    status: "active",
    title: "A project",
    lastUpdatedAt: inDays(-1),
    favorite: false,
    visibility: "private",
    ...overrides,
  };
}

function profile(overrides: Partial<FamilyProfile> = {}): FamilyProfile {
  return {
    id: "mom",
    name: "אמא",
    type: "adult",
    activeSections: [],
    notes: [],
    birthday: { enabled: true },
    savedItemIds: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("what is left out", () => {
  it("says nothing at all when nothing is asking", () => {
    expect(collectRelevance(empty(), NOW)).toHaveLength(0);
  });

  it("leaves out a distant scheduled item", () => {
    const input = { ...empty(), scheduled: [scheduled({ dueAt: inDays(90) })] };
    expect(collectRelevance(input, NOW)).toHaveLength(0);
  });

  it("leaves out an insurance renewal eight months away", () => {
    // The single clearest statement of the rule: relevance is not "everything
    // we know about".
    const input = {
      ...empty(),
      commitments: [commitment({ nextChargeAt: inDays(240), remindDaysBefore: 30 })],
    };
    expect(collectRelevance(input, NOW)).toHaveLength(0);
  });

  it("leaves out a snoozed item until its snooze expires", () => {
    const item = scheduled({ dueAt: inDays(-1), status: "snoozed", snoozedUntil: inDays(2) });
    expect(collectRelevance({ ...empty(), scheduled: [item] }, NOW)).toHaveLength(0);

    const later = new Date(2026, 2, 14, 12, 0, 0);
    expect(collectRelevance({ ...empty(), scheduled: [item] }, later)).toHaveLength(1);
  });

  it("leaves out a completed item", () => {
    const input = { ...empty(), scheduled: [scheduled({ dueAt: inDays(-1), status: "completed" })] };
    expect(collectRelevance(input, NOW)).toHaveLength(0);
  });

  it("leaves out a cancelled commitment", () => {
    const input = {
      ...empty(),
      commitments: [commitment({ nextChargeAt: inDays(3), status: "cancelled" })],
    };
    expect(collectRelevance(input, NOW)).toHaveLength(0);
  });
});

describe("what gets in", () => {
  it("puts an overdue item under Today and marks it overdue", () => {
    const items = collectRelevance({ ...empty(), scheduled: [scheduled({ dueAt: inDays(-3) })] }, NOW);
    expect(items).toHaveLength(1);
    expect(items[0].bucket).toBe("today");
    expect(items[0].overdue).toBe(true);
  });

  it("puts something a few days off under This week", () => {
    const items = collectRelevance({ ...empty(), scheduled: [scheduled({ dueAt: inDays(4) })] }, NOW);
    expect(items[0].bucket).toBe("week");
  });

  it("files a recurring item that is not yet due under Comes round again", () => {
    const items = collectRelevance(
      { ...empty(), scheduled: [scheduled({ dueAt: inDays(14), recurrence: { kind: "monthly" } })] },
      NOW
    );
    expect(items[0].bucket).toBe("recurring");
  });

  it("surfaces a birthday once it enters its preparation window", () => {
    const soon = collectRelevance(
      {
        ...empty(),
        // 28 March is 18 days off, and a 30-day window is open.
        profiles: [
          profile({ birthDate: "1966-03-28", birthday: { enabled: true, prepDaysBefore: 30 } }),
        ],
      },
      NOW
    );
    expect(soon).toHaveLength(1);
    expect(soon[0].source).toBe("birthday");
    expect(soon[0].href).toBe("/family/mom");
  });

  it("keeps a birthday with no preparation window quiet until the week before", () => {
    const quiet = collectRelevance(
      { ...empty(), profiles: [profile({ birthDate: "1966-03-28", birthday: { enabled: true } })] },
      NOW
    );
    expect(quiet).toHaveLength(0);
  });

  it("puts an unpaid bill under Waiting on you, whatever its date", () => {
    const money: MoneyEntry = {
      id: "m1",
      direction: "expense",
      amount: 640,
      category: "Electricity",
      occurredOn: dayKey(2),
      recurring: true,
      paid: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const items = collectRelevance({ ...empty(), money: [money] }, NOW);
    expect(items[0].bucket).toBe("waiting");
  });

  it("nudges a learning page only after a long silence", () => {
    const fresh = page({ type: "learning", lastUpdatedAt: inDays(-3) });
    expect(collectRelevance({ ...empty(), pages: [fresh] }, NOW)).toHaveLength(0);

    const stale = page({
      type: "learning",
      lastUpdatedAt: inDays(-90),
      learning: { lastStudiedAt: inDays(-90) },
    });
    const items = collectRelevance({ ...empty(), pages: [stale] }, NOW);
    expect(items).toHaveLength(1);
    expect(items[0].bucket).toBe("recurring");
  });

  it("still nudges a page that was tidied recently but not actually studied", () => {
    // `lastUpdatedAt` moves when the notes are edited, and tidying is not
    // studying — which is the whole reason `lastStudiedAt` is a separate fact.
    const tidied = page({
      type: "learning",
      lastUpdatedAt: inDays(-1),
      learning: { lastStudiedAt: inDays(-120) },
    });
    expect(collectRelevance({ ...empty(), pages: [tidied] }, NOW)).toHaveLength(1);
  });
});

describe("grouping", () => {
  it("sorts overdue first inside a group, then by date", () => {
    const grouped = groupRelevance(
      collectRelevance(
        {
          ...empty(),
          scheduled: [
            scheduled({ id: "today", title: "B", dueAt: inDays(0) }),
            scheduled({ id: "late", title: "A", dueAt: inDays(-5) }),
          ],
        },
        NOW
      )
    );
    expect(grouped.today.map((entry) => entry.id)).toEqual(["scheduled-late", "scheduled-today"]);
  });

  it("gives every row a unique id, so nothing is rendered twice", () => {
    const items = collectRelevance(
      {
        ...empty(),
        scheduled: [scheduled({ id: "a", dueAt: inDays(0) }), scheduled({ id: "b", dueAt: inDays(1) })],
        commitments: [commitment({ nextChargeAt: inDays(2), renewalAt: inDays(5) })],
      },
      NOW
    );
    const ids = items.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("openReminderCount", () => {
  it("counts only what is due today or already owed", () => {
    const items = collectRelevance(
      {
        ...empty(),
        scheduled: [
          scheduled({ id: "now", dueAt: inDays(-1) }),
          scheduled({ id: "later", dueAt: inDays(5) }),
          scheduled({ id: "much-later", dueAt: inDays(18) }),
        ],
      },
      NOW
    );
    // A badge that always shows a number is furniture.
    expect(openReminderCount(items)).toBe(1);
  });
});
