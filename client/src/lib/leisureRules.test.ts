import { describe, expect, it } from "vitest";
import {
  acceptSuggestion,
  dismissFor,
  filterLeisure,
  isCoolingDown,
  isDismissed,
  markDone,
  markSuggested,
  suggestOne,
  SUGGESTION_COOLDOWN_HOURS,
} from "./leisureRules";
import type { LeisureItem } from "../types/leisure";

const NOW = new Date(2026, 2, 10, 20, 0, 0);
const hoursFromNow = (hours: number): string =>
  new Date(NOW.getTime() + hours * 3600_000).toISOString();

function item(overrides: Partial<LeisureItem> = {}): LeisureItem {
  return {
    id: "l1",
    kind: "movie",
    title: "A film",
    tags: [],
    status: "idea",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("hard constraints", () => {
  it("never offers something longer than the time available", () => {
    const found = suggestOne([item({ minutes: 150 })], { minutes: 60 }, NOW);
    expect(found).toBeUndefined();
  });

  it("never offers something that asks for more energy than you have", () => {
    expect(suggestOne([item({ energy: "high" })], { energy: "low" }, NOW)).toBeUndefined();
    // The other direction is fine: low-energy things suit a high-energy evening.
    expect(suggestOne([item({ energy: "low" })], { energy: "high" }, NOW)).toBeDefined();
  });

  it("respects where you are", () => {
    expect(suggestOne([item({ place: "out" })], { place: "home" }, NOW)).toBeUndefined();
  });

  it("respects a budget", () => {
    expect(suggestOne([item({ cost: "expensive" })], { cost: "cheap" }, NOW)).toBeUndefined();
    expect(suggestOne([item({ cost: "free" })], { cost: "cheap" }, NOW)).toBeDefined();
  });

  it("respects who you are with, when the item says", () => {
    expect(
      suggestOne([item({ company: ["family"] })], { company: "alone" }, NOW)
    ).toBeUndefined();
    // An item that names nobody suits anybody.
    expect(suggestOne([item({ company: [] })], { company: "alone" }, NOW)).toBeDefined();
  });

  it("treats a missing tag as no constraint rather than as a failure to match", () => {
    expect(suggestOne([item()], { minutes: 30, energy: "low", place: "home" }, NOW)).toBeDefined();
  });

  it("never offers something already done", () => {
    expect(suggestOne([item({ status: "done" })], {}, NOW)).toBeUndefined();
  });
});

describe("one answer, or none", () => {
  it("returns exactly one suggestion", () => {
    const found = suggestOne([item({ id: "a" }), item({ id: "b" }), item({ id: "c" })], {}, NOW);
    expect(found).toBeDefined();
    expect(typeof found!.item.id).toBe("string");
  });

  it("returns nothing rather than something that does not fit", () => {
    // Honest is better than always having an answer.
    expect(suggestOne([item({ minutes: 200 })], { minutes: 30 }, NOW)).toBeUndefined();
  });

  it("says nothing at all when the user says they are swamped", () => {
    expect(suggestOne([item()], { load: "busy" }, NOW)).toBeUndefined();
  });

  it("is deterministic: the same inputs give the same answer twice", () => {
    const items = [item({ id: "b", title: "B" }), item({ id: "a", title: "A" })];
    expect(suggestOne(items, {}, NOW)!.item.id).toBe(suggestOne(items, {}, NOW)!.item.id);
  });

  it("prefers a closer fit to the time available", () => {
    const found = suggestOne(
      [item({ id: "short", minutes: 10 }), item({ id: "snug", minutes: 85 })],
      { minutes: 90 },
      NOW
    );
    expect(found!.item.id).toBe("snug");
  });

  it("explains itself in at most two reasons", () => {
    const found = suggestOne(
      [item({ minutes: 85, energy: "low", place: "home", cost: "free", company: ["alone"] })],
      { minutes: 90, energy: "low", place: "home", cost: "cheap", company: "alone" },
      NOW
    );
    expect(found!.reasons.length).toBeLessThanOrEqual(2);
  });
});

describe("cooldown", () => {
  it("skips something suggested recently", () => {
    const recent = markSuggested(item(), NOW);
    expect(isCoolingDown(recent, NOW)).toBe(true);
    expect(suggestOne([recent], {}, NOW)).toBeUndefined();
  });

  it("lets it come back once the cooldown lapses", () => {
    const recent = markSuggested(item(), NOW);
    const later = new Date(NOW.getTime() + (SUGGESTION_COOLDOWN_HOURS + 1) * 3600_000);
    expect(isCoolingDown(recent, later)).toBe(false);
    expect(suggestOne([recent], {}, later)).toBeDefined();
  });

  it("keeps a dismissed item quiet without removing it from the list", () => {
    const dismissed = dismissFor(item(), 72, NOW);
    expect(isDismissed(dismissed, NOW)).toBe(true);
    expect(suggestOne([dismissed], {}, NOW)).toBeUndefined();
    expect(dismissed.status).toBe("idea");

    const later = new Date(NOW.getTime() + 73 * 3600_000);
    expect(isDismissed(dismissed, later)).toBe(false);
  });

  it("offers a different item rather than nothing when one is cooling down", () => {
    const cooling = markSuggested(item({ id: "cooling" }), NOW);
    const fresh = item({ id: "fresh" });
    expect(suggestOne([cooling, fresh], {}, NOW)!.item.id).toBe("fresh");
  });

  it("never suggests the same thing twice in a row across a stamped round", () => {
    let items = [item({ id: "a", title: "A" }), item({ id: "b", title: "B" })];
    const first = suggestOne(items, {}, NOW)!;
    items = items.map((entry) =>
      entry.id === first.item.id ? markSuggested(entry, NOW) : entry
    );
    const second = suggestOne(items, {}, NOW)!;
    expect(second.item.id).not.toBe(first.item.id);
  });
});

describe("transitions", () => {
  it("accepting plans it", () => {
    expect(acceptSuggestion(item(), NOW).status).toBe("planned");
  });

  it("marking done stamps the date", () => {
    const done = markDone(item(), NOW);
    expect(done.status).toBe("done");
    expect(done.doneAt).toBe(NOW.toISOString());
  });

  it("dismissal sets a date in the future", () => {
    expect(dismissFor(item(), 24, NOW).dismissedUntil).toBe(hoursFromNow(24));
  });
});

describe("filterLeisure", () => {
  const items = [
    item({ id: "film", kind: "movie", energy: "low", place: "home", tags: ["quiet evening"] }),
    item({ id: "walk", kind: "idea", energy: "medium", place: "out", status: "planned" }),
  ];

  it("filters by kind, energy, place and status", () => {
    expect(filterLeisure(items, { kind: "movie" }).map((entry) => entry.id)).toEqual(["film"]);
    expect(filterLeisure(items, { place: "out" }).map((entry) => entry.id)).toEqual(["walk"]);
    expect(filterLeisure(items, { status: "planned" }).map((entry) => entry.id)).toEqual(["walk"]);
  });

  it("searches the title, the note and the user's own tags", () => {
    expect(filterLeisure(items, { query: "quiet" }).map((entry) => entry.id)).toEqual(["film"]);
  });

  it("returns everything when nothing is asked for", () => {
    expect(filterLeisure(items, {})).toHaveLength(2);
  });
});
