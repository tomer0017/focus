import { describe, expect, it } from "vitest";
import {
  ageAtNextBirthday,
  birthdayEventFor,
  birthdayEvents,
  currentAge,
  eventHref,
  isDerivedBirthday,
  nextBirthday,
  withBirthdays,
} from "./birthdays";
import type { FamilyProfile } from "../types/family";
import type { FocusEvent } from "../types/event";

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

const on = (year: number, month: number, day: number): Date =>
  new Date(year, month - 1, day, 12, 0, 0);

describe("nextBirthday", () => {
  it("finds this year's date when it is still ahead", () => {
    const next = nextBirthday("1960-09-14", on(2026, 8, 20));
    expect(next!.getFullYear()).toBe(2026);
    expect(next!.getMonth()).toBe(8);
    expect(next!.getDate()).toBe(14);
  });

  it("rolls to next year once the date has passed", () => {
    const next = nextBirthday("1960-03-02", on(2026, 8, 20));
    expect(next!.getFullYear()).toBe(2027);
  });

  it("counts the day itself as the next birthday, not next year's", () => {
    // An app that jumps to next year at 00:01 on somebody's birthday is worse
    // than useless on the one day it matters.
    const next = nextBirthday("1960-08-20", on(2026, 8, 20));
    expect(next!.getFullYear()).toBe(2026);
    expect(next!.getDate()).toBe(20);
  });

  it("folds 29 February onto 1 March in a common year", () => {
    const next = nextBirthday("1996-02-29", on(2027, 1, 10));
    // February 2027 has 28 days, so the clamp lands on the 28th rather than
    // dropping the person off the calendar for three years in four.
    expect(next!.getMonth()).toBe(1);
    expect(next!.getDate()).toBe(28);
  });

  it("returns nothing for a malformed date", () => {
    expect(nextBirthday("not-a-date")).toBeUndefined();
    expect(nextBirthday("2026-13")).toBeUndefined();
  });
});

describe("ages", () => {
  it("reports the age being turned, and the age today", () => {
    expect(ageAtNextBirthday("1960-09-14", on(2026, 8, 20))).toBe(66);
    expect(currentAge("1960-09-14", on(2026, 8, 20))).toBe(65);
  });

  it("counts the birthday itself as the new age", () => {
    expect(currentAge("1960-08-20", on(2026, 8, 20))).toBe(66);
  });

  it("declines to render a negative age for a date in the future", () => {
    // A birth date in the future is a data-entry slip. Returning nothing lets
    // the screen omit the age rather than print "turning -3".
    expect(ageAtNextBirthday("2030-01-01", on(2026, 8, 20))).toBeUndefined();
    expect(currentAge("2030-01-01", on(2026, 8, 20))).toBeUndefined();
  });
});

describe("birthdayEventFor", () => {
  it("produces one event, carrying the preparation window through", () => {
    const event = birthdayEventFor(
      profile({ birthDate: "1960-09-14", birthday: { enabled: true, prepDaysBefore: 21, importance: "high" } }),
      on(2026, 8, 20)
    );
    expect(event!.kind).toBe("birthday");
    expect(event!.prepDaysBefore).toBe(21);
    expect(event!.importance).toBe("high");
    // No sections: there is nowhere to store an edit to a derived object.
    expect(event!.sections).toEqual([]);
  });

  it("uses the name unchanged, so no language is baked into the title", () => {
    const event = birthdayEventFor(profile({ birthDate: "1960-09-14" }), on(2026, 8, 20));
    expect(event!.title).toBe("אמא");
  });

  it("marks itself derived, which is what tells it apart from a stored event", () => {
    const event = birthdayEventFor(profile({ birthDate: "1960-09-14" }), on(2026, 8, 20));
    expect(isDerivedBirthday(event!)).toBe(true);
    expect(eventHref(event!)).toBe("/family/mom");
  });

  it("produces nothing without a date or when switched off", () => {
    expect(birthdayEventFor(profile(), on(2026, 8, 20))).toBeUndefined();
    expect(
      birthdayEventFor(
        profile({ birthDate: "1960-09-14", birthday: { enabled: false } }),
        on(2026, 8, 20)
      )
    ).toBeUndefined();
  });

  it("is stable: computing it twice gives the same id and the same date", () => {
    const p = profile({ birthDate: "1960-09-14" });
    const a = birthdayEventFor(p, on(2026, 8, 20));
    const b = birthdayEventFor(p, on(2026, 8, 20));
    expect(a!.id).toBe(b!.id);
    expect(a!.startsAt).toBe(b!.startsAt);
  });
});

describe("withBirthdays", () => {
  const stored: FocusEvent = {
    id: "birthday:mom",
    kind: "birthday",
    title: "Mum's 70th, at the restaurant",
    startsAt: on(2026, 9, 14).toISOString(),
    spaceId: "personal",
    sections: [],
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  it("adds one derived birthday per profile and no more", () => {
    const merged = withBirthdays([], [profile({ birthDate: "1960-09-14" })], on(2026, 8, 20));
    expect(merged).toHaveLength(1);
  });

  it("never duplicates across repeated calls — the whole reason nothing is stored", () => {
    const profiles = [profile({ birthDate: "1960-09-14" })];
    const once = withBirthdays([], profiles, on(2026, 8, 20));
    const twice = withBirthdays([], profiles, on(2026, 8, 20));
    expect(once).toHaveLength(1);
    expect(twice).toHaveLength(1);
    // And feeding the result back in does not accumulate either.
    expect(withBirthdays(once, profiles, on(2026, 8, 20))).toHaveLength(1);
  });

  it("lets a real event the user built win over the derived one", () => {
    const merged = withBirthdays([stored], [profile({ birthDate: "1960-09-14" })], on(2026, 8, 20));
    expect(merged).toHaveLength(1);
    expect(merged[0].title).toBe("Mum's 70th, at the restaurant");
  });

  it("does not treat the winning stored event as derived", () => {
    /*
     * It occupies the `birthday:mom` slot in order to win the collision, but it
     * is a real event with sections and a screen of its own. Telling the two
     * apart by their shared id would rewrite its title and send its card to the
     * profile instead.
     */
    const merged = withBirthdays([stored], [profile({ birthDate: "1960-09-14" })], on(2026, 8, 20));
    expect(isDerivedBirthday(merged[0])).toBe(false);
    expect(eventHref(merged[0])).toBe("/events/birthday:mom");
  });

  it("sorts derived birthdays soonest first", () => {
    const events = birthdayEvents(
      [
        profile({ id: "a", name: "A", birthDate: "1960-12-01" }),
        profile({ id: "b", name: "B", birthDate: "1960-09-01" }),
      ],
      on(2026, 8, 20)
    );
    expect(events.map((event) => event.title)).toEqual(["B", "A"]);
  });
});
