/**
 * Migration tests.
 *
 * These run the real repositories against a stubbed `localStorage`, which is
 * the only honest way to test a migration: the thing being verified is what
 * happens to a payload written by an older build, and that payload only exists
 * in storage.
 *
 * The rule under test is the one in CLAUDE.md: **a migration never destroys.**
 * It fills in defaults. It must not drop a field, change an id, clear a
 * `focus.*` key, or collapse "absent" into "empty" where the two mean different
 * things.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "../lib/storage/keys";
import { STORAGE_VERSION } from "../lib/storage/localStore";

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  get keys(): string[] {
    return [...this.data.keys()];
  }
}

let storage: MemoryStorage;

function write(key: string, data: unknown): void {
  storage.setItem(key, JSON.stringify({ v: STORAGE_VERSION, data }));
}

beforeEach(() => {
  storage = new MemoryStorage();
  (globalThis as { window?: unknown }).window = { localStorage: storage };
});

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

/** Imported lazily so each test gets repositories reading the current stub. */
async function repositories() {
  return import("./manage");
}

describe("scheduled items", () => {
  it("fills in the arrays every screen maps over", async () => {
    const { scheduledRepository } = await repositories();
    write(STORAGE_KEYS.scheduled, [
      { id: "old", title: "Old item", category: "reminder", createdAt: "x", updatedAt: "x" },
    ]);

    const [item] = scheduledRepository.load();
    expect(item.reminderOffsets).toEqual([]);
    expect(item.savedItemIds).toEqual([]);
    expect(item.status).toBe("active");
    expect(item.completionCount).toBe(0);
  });

  it("leaves an undated item undated", async () => {
    // Absent means "an undated reminder", not "due at the epoch".
    const { scheduledRepository } = await repositories();
    write(STORAGE_KEYS.scheduled, [
      { id: "old", title: "No date", category: "reminder", createdAt: "x", updatedAt: "x" },
    ]);
    expect(scheduledRepository.load()[0].dueAt).toBeUndefined();
  });

  it("keeps ids and every stored field", async () => {
    const { scheduledRepository } = await repositories();
    write(STORAGE_KEYS.scheduled, [
      {
        id: "keep-me",
        title: "Blood test",
        category: "checkup",
        status: "active",
        dueAt: "2026-05-01T06:00:00.000Z",
        result: "Repeat one of them in two months",
        appointment: { prepare: "Fasting" },
        createdAt: "x",
        updatedAt: "x",
      },
    ]);

    const [item] = scheduledRepository.load();
    expect(item.id).toBe("keep-me");
    expect(item.result).toBe("Repeat one of them in two months");
    expect(item.appointment?.prepare).toBe("Fasting");
    expect(item.dueAt).toBe("2026-05-01T06:00:00.000Z");
  });
});

describe("money", () => {
  it("never guesses that an unconfirmed entry was paid", async () => {
    // Defaulting to true would hide a real bill.
    const { moneyRepository } = await repositories();
    write(STORAGE_KEYS.money, [
      { id: "m", direction: "expense", amount: 100, occurredOn: "2026-03-01", createdAt: "x", updatedAt: "x" },
    ]);
    const [entry] = moneyRepository.load();
    expect(entry.paid).toBe(false);
    expect(entry.recurring).toBe(false);
  });
});

describe("medications", () => {
  it("fills in the arrays but leaves weekdays absent", async () => {
    // Absent and empty both mean "every day", so neither is rewritten into the
    // other — rewriting would look like a change the user never made.
    const { medicationsRepository } = await repositories();
    write(STORAGE_KEYS.medications, [
      { id: "m", name: "A tablet", form: "medication", createdAt: "x", updatedAt: "x" },
    ]);
    const [medication] = medicationsRepository.load();
    expect(medication.times).toEqual([]);
    expect(medication.taken).toEqual([]);
    expect(medication.status).toBe("active");
    expect(medication.weekdays).toBeUndefined();
  });

  it("keeps recorded doses", async () => {
    const { medicationsRepository } = await repositories();
    write(STORAGE_KEYS.medications, [
      {
        id: "m",
        name: "A tablet",
        form: "medication",
        times: ["08:00"],
        taken: ["2026-03-01@08:00"],
        status: "active",
        createdAt: "x",
        updatedAt: "x",
      },
    ]);
    expect(medicationsRepository.load()[0].taken).toEqual(["2026-03-01@08:00"]);
  });
});

describe("family profiles", () => {
  it("gives a profile with no sections the default set for its type", async () => {
    const { familyRepository } = await repositories();
    write(STORAGE_KEYS.family, [
      { id: "p", name: "Mum", type: "adult", createdAt: "x", updatedAt: "x" },
    ]);
    const [profile] = familyRepository.load();
    expect(profile.activeSections.length).toBeGreaterThan(0);
    expect(profile.notes).toEqual([]);
    expect(profile.savedItemIds).toEqual([]);
  });

  it("preserves a section list the user shortened", async () => {
    const { familyRepository } = await repositories();
    write(STORAGE_KEYS.family, [
      {
        id: "p",
        name: "Mum",
        type: "adult",
        activeSections: [{ id: "only", kind: "notes", order: 0 }],
        notes: [],
        savedItemIds: [],
        birthday: { enabled: false },
        createdAt: "x",
        updatedAt: "x",
      },
    ]);
    expect(familyRepository.load()[0].activeSections).toHaveLength(1);
  });

  it("does not switch a birthday on for a profile with no birth date", async () => {
    const { familyRepository } = await repositories();
    write(STORAGE_KEYS.family, [
      { id: "p", name: "Luna", type: "pet", createdAt: "x", updatedAt: "x" },
    ]);
    expect(familyRepository.load()[0].birthday.enabled).toBe(false);
  });

  it("switches it on when there is a date to derive one from", async () => {
    const { familyRepository } = await repositories();
    write(STORAGE_KEYS.family, [
      { id: "p", name: "Mum", type: "adult", birthDate: "1960-09-14", createdAt: "x", updatedAt: "x" },
    ]);
    expect(familyRepository.load()[0].birthday.enabled).toBe(true);
  });

  it("drops a placeholder photo address rather than rendering a broken picture", async () => {
    const { familyRepository } = await repositories();
    write(STORAGE_KEYS.family, [
      {
        id: "p",
        name: "Mum",
        type: "adult",
        photoUrl: "https://example.com/mum.jpg",
        createdAt: "x",
        updatedAt: "x",
      },
    ]);
    expect(familyRepository.load()[0].photoUrl).toBeUndefined();
  });
});

describe("menus", () => {
  it("numbers dishes that had no order and fills in their shopping lines", async () => {
    const { menusRepository } = await repositories();
    write(STORAGE_KEYS.menus, [
      {
        id: "m",
        kind: "shabbat",
        dishes: [{ id: "d1", course: "main", title: "Chicken" }],
        createdAt: "x",
        updatedAt: "x",
      },
    ]);
    const [dish] = menusRepository.load()[0].dishes;
    expect(dish.order).toBe(0);
    expect(dish.shoppingItems).toEqual([]);
    expect(dish.id).toBe("d1");
  });
});

describe("leisure", () => {
  it("fills in tags and status without touching the title", async () => {
    const { leisureRepository } = await repositories();
    write(STORAGE_KEYS.leisure, [
      { id: "l", kind: "movie", title: "A film", createdAt: "x", updatedAt: "x" },
    ]);
    const [item] = leisureRepository.load();
    expect(item.tags).toEqual([]);
    expect(item.status).toBe("idea");
    expect(item.title).toBe("A film");
  });
});

describe("the seed", () => {
  it("is itself migrated, so the migration runs on a first visit", async () => {
    // Running it over the seed too means the migration is exercised on day one
    // rather than months later on somebody else's machine.
    const { scheduledRepository, familyRepository } = await repositories();
    expect(scheduledRepository.load().every((item) => Array.isArray(item.savedItemIds))).toBe(true);
    expect(familyRepository.load().every((profile) => Array.isArray(profile.notes))).toBe(true);
  });
});

describe("keys", () => {
  it("clears nothing: a load never removes a stored key", async () => {
    const { scheduledRepository, familyRepository, moneyRepository } = await repositories();
    write(STORAGE_KEYS.scheduled, []);
    write(STORAGE_KEYS.family, []);
    write(STORAGE_KEYS.money, []);
    const before = [...storage.keys].sort();

    scheduledRepository.load();
    familyRepository.load();
    moneyRepository.load();

    expect([...storage.keys].sort()).toEqual(before);
  });

  it("every key is namespaced and unique", async () => {
    const values = Object.values(STORAGE_KEYS);
    expect(values.every((key) => key.startsWith("focus."))).toBe(true);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("trips", () => {
  /** A trip as it was stored before `kind` and note blocks existed. */
  function storedTrip(patch: Record<string, unknown> = {}) {
    return {
      id: "old-trip",
      title: "Lisbon",
      countries: ["Portugal"],
      startDate: "2025-04-02",
      endDate: "2025-04-07",
      status: "done",
      notes: "Four flights of stairs.",
      flights: [],
      stays: [],
      destinations: [
        { id: "lisbon", name: "Lisbon", goodToKnow: ["Free on Sundays"], savedItemIds: ["s1"] },
      ],
      days: [],
      food: [],
      createdAt: "2025-01-01T00:00:00.000Z",
      ...patch,
    };
  }

  it("leaves an unstated kind unstated, so it stays derived", async () => {
    // A kind written in by a migration would freeze the guess: adding a flight
    // afterwards could never change what the screen leads with.
    const { tripsRepository } = await import("./index");
    write(STORAGE_KEYS.trips, [storedTrip()]);
    expect(tripsRepository.load()[0].kind).toBeUndefined();
  });

  it("never turns a never-edited note into an empty list", async () => {
    // `undefined` means "read the old single note"; `[]` means "the user
    // deleted every block". Defaulting to `[]` would wipe the note off every
    // trip written before blocks existed.
    const { tripsRepository } = await import("./index");
    write(STORAGE_KEYS.trips, [storedTrip()]);

    const [trip] = tripsRepository.load();
    expect(trip.noteBlocks).toBeUndefined();
    expect(trip.notes).toBe("Four flights of stairs.");
  });

  it("keeps an emptied block list empty", async () => {
    const { tripsRepository } = await import("./index");
    write(STORAGE_KEYS.trips, [storedTrip({ noteBlocks: [] })]);
    expect(tripsRepository.load()[0].noteBlocks).toEqual([]);
  });

  it("fills in outfits, which arrived after the first trips were stored", async () => {
    const { tripsRepository } = await import("./index");
    write(STORAGE_KEYS.trips, [storedTrip()]);
    expect(tripsRepository.load()[0].outfits).toEqual([]);
  });

  it("changes no id and drops no destination detail", async () => {
    const { tripsRepository } = await import("./index");
    write(STORAGE_KEYS.trips, [storedTrip()]);

    const [trip] = tripsRepository.load();
    expect(trip.id).toBe("old-trip");
    expect(trip.destinations[0].id).toBe("lisbon");
    expect(trip.destinations[0].goodToKnow).toEqual(["Free on Sundays"]);
    expect(trip.destinations[0].savedItemIds).toEqual(["s1"]);
  });
});

describe("project categories", () => {
  it("seeds three categories on a first visit", async () => {
    const { projectCategoriesRepository } = await import("./index");
    const seeded = projectCategoriesRepository.load();
    expect(seeded.map((entry) => entry.id)).toEqual(["personal", "tech", "physical"]);
    // Seeded categories carry a key, never a language.
    expect(seeded.every((entry) => entry.nameKey && !entry.name)).toBe(true);
  });

  it("keeps a renamed category's own words and drops nothing", async () => {
    const { projectCategoriesRepository } = await import("./index");
    write(STORAGE_KEYS.projectCategories, [
      { id: "tech", name: "צד לקוח", order: 0 },
      { id: "mine", name: "Mine", order: 1 },
    ]);

    const stored = projectCategoriesRepository.load();
    expect(stored).toHaveLength(2);
    expect(stored[0].name).toBe("צד לקוח");
    expect(stored[0].nameKey).toBeUndefined();
    expect(stored[1].id).toBe("mine");
  });

  it("fills in an order that predates reordering, without changing ids", async () => {
    const { projectCategoriesRepository } = await import("./index");
    write(STORAGE_KEYS.projectCategories, [{ id: "a" }, { id: "b" }]);

    const stored = projectCategoriesRepository.load();
    expect(stored.map((entry) => entry.order)).toEqual([0, 1]);
    expect(stored.map((entry) => entry.id)).toEqual(["a", "b"]);
  });

  it("never stamps a category onto a stored page", async () => {
    // `categoryOf` derives one on every read instead — see its own tests.
    const { pageOverridesRepository } = await import("./index");
    write(STORAGE_KEYS.pageOverrides, { "old-page": { status: "active" } });
    expect(pageOverridesRepository.load()["old-page"].categoryId).toBeUndefined();
  });
});
