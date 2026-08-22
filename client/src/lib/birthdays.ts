/**
 * Birthdays, derived rather than stored.
 *
 * The tempting implementation is to write a `FocusEvent` for each year when a
 * profile is saved. It is also the wrong one: it duplicates on every migration,
 * leaves last year's event lying around, needs a sweep to create next year's,
 * and puts the birth date in two places that can disagree. A birth date is a
 * fact; the birthday is arithmetic on it.
 *
 * So `birthdayEventFor` computes **one** event — the next occurrence — and it
 * is recomputed on every read. There is nothing to duplicate because there is
 * nothing stored, which is what makes acceptance test 29 pass by construction
 * rather than by a de-duplication pass.
 */
import { fromDateKey, isValidDateKey, toDateKey } from "./dateKey";
import type { FamilyProfile } from "../types/family";
import type { FocusEvent } from "../types/event";

/** Derived events all carry this prefix, so nothing else can collide with one. */
export const BIRTHDAY_EVENT_PREFIX = "birthday:";

export function birthdayEventId(profileId: string): string {
  return `${BIRTHDAY_EVENT_PREFIX}${profileId}`;
}

/** The profile id inside a derived birthday event id, when it is one. */
export function profileIdFromBirthdayEvent(eventId: string): string | undefined {
  return eventId.startsWith(BIRTHDAY_EVENT_PREFIX)
    ? eventId.slice(BIRTHDAY_EVENT_PREFIX.length)
    : undefined;
}

/**
 * The next birthday on or after today.
 *
 * "On or after" rather than "after": the birthday is not over at midnight, and
 * an app that jumps to next year at 00:01 on the day itself is worse than
 * useless. 29 February is folded onto 1 March in common years — every stored
 * date has to produce a date, and silently returning nothing would drop the
 * person off the calendar three years in four.
 */
export function nextBirthday(birthDate: string, now: Date = new Date()): Date | undefined {
  if (!isValidDateKey(birthDate)) return undefined;
  const born = fromDateKey(birthDate);
  if (Number.isNaN(born.getTime())) return undefined;

  const month = born.getMonth();
  const day = born.getDate();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const occurrenceIn = (year: number): Date => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(day, lastDay));
  };

  const thisYear = occurrenceIn(today.getFullYear());
  return thisYear >= today ? thisYear : occurrenceIn(today.getFullYear() + 1);
}

/**
 * The age being turned at the next birthday.
 *
 * Undefined when the birth date is in the future, which is a data-entry slip
 * rather than a negative age worth rendering.
 */
export function ageAtNextBirthday(birthDate: string, now: Date = new Date()): number | undefined {
  const next = nextBirthday(birthDate, now);
  if (!next) return undefined;
  const born = fromDateKey(birthDate);
  const age = next.getFullYear() - born.getFullYear();
  return age >= 0 ? age : undefined;
}

/** Age today, in whole years. */
export function currentAge(birthDate: string, now: Date = new Date()): number | undefined {
  const turning = ageAtNextBirthday(birthDate, now);
  if (turning === undefined) return undefined;
  const next = nextBirthday(birthDate, now);
  if (!next) return undefined;
  const isToday = toDateKey(next) === toDateKey(now);
  return isToday ? turning : turning - 1;
}

/**
 * The birthday of one profile, as an event the rest of the app already knows
 * how to render.
 *
 * Returning a `FocusEvent` rather than a new shape is the 80/20 move: urgency,
 * countdowns, colour rules, the events list and the overview strip all work
 * unchanged, and a birthday gets preparation windows for free.
 *
 * The event carries **no sections**. Gift ideas, a budget and a greeting belong
 * to a real event the user chose to create, not to a row computed from a date;
 * a derived object with editable children would be a lie, because there is
 * nowhere to store the edit.
 */
export function birthdayEventFor(
  profile: FamilyProfile,
  now: Date = new Date()
): FocusEvent | undefined {
  if (!profile.birthday?.enabled || !profile.birthDate) return undefined;
  const next = nextBirthday(profile.birthDate, now);
  if (!next) return undefined;

  return {
    id: birthdayEventId(profile.id),
    kind: "birthday",
    // The profile's own name, unchanged. The screen adds "'s birthday" in the
    // interface language; storing a composed title would translate a name.
    title: profile.name,
    startsAt: next.toISOString(),
    spaceId: "personal",
    sections: [],
    createdAt: profile.createdAt,
    prepDaysBefore: profile.birthday.prepDaysBefore,
    importance: profile.birthday.importance,
    reminders: [],
    derived: true,
  };
}

/** Every profile's next birthday, soonest first. */
export function birthdayEvents(profiles: FamilyProfile[], now: Date = new Date()): FocusEvent[] {
  return profiles
    .map((profile) => birthdayEventFor(profile, now))
    .filter((event): event is FocusEvent => event !== undefined)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/**
 * Stored events plus derived birthdays, with derived ones losing any clash.
 *
 * A user who created their own "Mum's 70th" — with a venue, a gift list and a
 * budget — must not also get a bare computed row beside it. Their event wins:
 * it holds work, and the derived one holds a date that is already on it.
 */
export function withBirthdays(
  events: FocusEvent[],
  profiles: FamilyProfile[],
  now: Date = new Date()
): FocusEvent[] {
  const existing = new Set(events.map((event) => event.id));
  return [
    ...events,
    ...birthdayEvents(profiles, now).filter((event) => !existing.has(event.id)),
  ];
}

/**
 * Where an event's card should lead.
 *
 * A **derived** birthday has no stored event, so `/events/birthday:mom` would
 * be a link to nothing; it leads to the profile the date came from, which is
 * also where you would go to change it. An event the user stored under that
 * same id is a real event with sections, and keeps its own screen.
 */
export function eventHref(event: FocusEvent): string {
  const profileId = isDerivedBirthday(event)
    ? profileIdFromBirthdayEvent(event.id)
    : undefined;
  return profileId ? `/family/${profileId}` : `/events/${event.id}`;
}

/**
 * True for an event this module computed, not one the user created.
 *
 * Reads the flag rather than the id prefix: the prefix is the *slot*, and a
 * stored event may legitimately occupy it in order to win the collision.
 */
export function isDerivedBirthday(event: FocusEvent): boolean {
  return event.derived === true;
}
