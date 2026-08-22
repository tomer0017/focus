/**
 * Reading a family profile: which sections it shows, and what it is asking for.
 *
 * All of it is derived. A profile stores a name, a type, a birth date, some
 * notes and a list of switched-on sections — everything else on the screen is
 * computed from the items that happen to point at it, which is why deleting a
 * profile cannot silently take a vet appointment with it.
 */
import { birthdayEventFor } from "./birthdays";
import { byDueDate, isOpen, isDue } from "./scheduled";
import { daysUntil } from "./format";
import { referenceKey } from "../types/reference";
import type { EntityReference } from "../types/reference";
import type { FamilyProfile, FamilySection, FamilySectionKind } from "../types/family";
import type { ScheduledItem } from "../types/scheduled";
import type { QuickLogEntry } from "../types/quickLog";
import type { Checklist, ChecklistItem } from "../types/checklist";
import type { Medication } from "../types/health";
import type { ProjectNoteTemplate } from "./projectNotes";

export function familyReference(profileId: string): EntityReference {
  return { kind: "family", id: profileId };
}

/** Everything pointing at this profile. One predicate, used by every section. */
export function belongsTo<T extends { relatedEntity?: EntityReference }>(
  items: T[],
  profileId: string
): T[] {
  const key = referenceKey(familyReference(profileId));
  return items.filter((item) => item.relatedEntity && referenceKey(item.relatedEntity) === key);
}

export function sectionsOf(profile: FamilyProfile): FamilySection[] {
  return [...profile.activeSections].sort((a, b) => a.order - b.order);
}

export function hasSection(profile: FamilyProfile, kind: FamilySectionKind): boolean {
  return profile.activeSections.some((section) => section.kind === kind);
}

/**
 * The one line a profile card prints under the name: what this person or
 * animal actually needs from you.
 *
 * Due beats upcoming, and nothing beats an invented placeholder — a profile
 * with nothing outstanding says nothing, and the card gets shorter.
 */
export interface ProfileAttention {
  item: ScheduledItem;
  daysAway: number | undefined;
  overdue: boolean;
}

export function nextAttentionFor(
  profile: FamilyProfile,
  scheduled: ScheduledItem[],
  now: Date = new Date()
): ProfileAttention | undefined {
  const mine = belongsTo(scheduled, profile.id).filter(isOpen).sort(byDueDate);
  const due = mine.find((item) => isDue(item, now));
  const chosen = due ?? mine.find((item) => Boolean(item.dueAt));
  if (!chosen) return undefined;

  const daysAway = chosen.dueAt ? daysUntil(chosen.dueAt, now) : undefined;
  return { item: chosen, daysAway, overdue: daysAway !== undefined && daysAway < 0 };
}

/** The next dated thing on a profile: a birthday, or the soonest open item. */
export function nextDateFor(
  profile: FamilyProfile,
  scheduled: ScheduledItem[],
  now: Date = new Date()
): { at: string; label: "birthday" | "scheduled"; title: string } | undefined {
  const birthday = birthdayEventFor(profile, now);
  const soonest = belongsTo(scheduled, profile.id)
    .filter((item) => isOpen(item) && item.dueAt && item.dueAt >= now.toISOString())
    .sort(byDueDate)[0];

  const candidates: { at: string; label: "birthday" | "scheduled"; title: string }[] = [];
  if (birthday) candidates.push({ at: birthday.startsAt, label: "birthday", title: profile.name });
  if (soonest?.dueAt) candidates.push({ at: soonest.dueAt, label: "scheduled", title: soonest.title });

  return candidates.sort((a, b) => a.at.localeCompare(b.at))[0];
}

/**
 * When this profile was last touched in any way that counts.
 *
 * A completion, a log entry or an edit — whichever is most recent. Rendered as
 * a plain fact ("last visit: 12 days ago") and never as a judgement: nobody
 * needs their personal operating system telling them they have not called their
 * grandmother enough.
 */
export function lastActivityFor(
  profile: FamilyProfile,
  scheduled: ScheduledItem[],
  logs: QuickLogEntry[]
): string | undefined {
  const moments = [
    profile.updatedAt,
    ...belongsTo(scheduled, profile.id)
      .map((item) => item.lastCompletedAt)
      .filter((value): value is string => Boolean(value)),
    ...belongsTo(logs, profile.id).map((entry) => entry.occurredAt),
  ].filter(Boolean);

  return moments.sort().at(-1);
}

/** Quick-log entries for a profile, newest first. */
export function logsFor(
  logs: QuickLogEntry[],
  profileId: string,
  kind?: QuickLogEntry["kind"]
): QuickLogEntry[] {
  return belongsTo(logs, profileId)
    .filter((entry) => !kind || entry.kind === kind)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

export function medicationsFor(medications: Medication[], profileId: string): Medication[] {
  return belongsTo(medications, profileId);
}

/** Profiles in a stable order: people before animals, then by name. */
export function sortProfiles(profiles: FamilyProfile[]): FamilyProfile[] {
  const rank: Record<FamilyProfile["type"], number> = { adult: 0, child: 1, baby: 2, pet: 3 };
  return [...profiles].sort(
    (a, b) => rank[a.type] - rank[b.type] || a.name.localeCompare(b.name)
  );
}

/** Initials for a profile with no picture. Never a grey box with nothing in it. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return [...parts[0]].slice(0, 2).join("");
  return [...parts[0]][0] + [...parts[parts.length - 1]][0];
}

/**
 * The topic a profile section belongs to, for the profile's tabs.
 *
 * A profile used to render every switched-on section in one grid. Three or four
 * is fine; a grandmother with appointments, medicines, a shopping list,
 * documents and notes is five unrelated subjects on one screen, and a baby with
 * feeds and tastings adds a running log to that. Grouping them means the screen
 * asks one thing at a time.
 *
 * There is no medical grouping happening here — `health`, `medications` and
 * `vaccinations` sit together because that is where somebody looks for them,
 * not because the app understands any of them.
 */
export type FamilyTopic = "dates" | "health" | "logs" | "notes";

export function familyTopicOf(kind: FamilySectionKind): FamilyTopic {
  switch (kind) {
    case "dates":
    case "reminders":
    case "checkups":
      return "dates";
    case "health":
    case "medications":
    case "vaccinations":
      return "health";
    case "feeding":
    case "tasting":
    case "history":
      return "logs";
    default:
      return "notes";
  }
}

/** Translation key for a topic tab, in the `family` namespace. */
export const FAMILY_TOPIC_KEY: Record<FamilyTopic, string> = {
  dates: "topics.dates",
  health: "topics.health",
  logs: "topics.logs",
  notes: "topics.notes",
};

/* ------------------------------------------------------------- the index -- */

export interface ProfileFilter {
  /** A profile type, or absent for "everyone". */
  type?: FamilyProfile["type"];
  query?: string;
}

/**
 * The profiles the index shows.
 *
 * Search matches the name, the relationship and the species — "the dog" and
 * "Mum" are how people look for a profile, and neither is the name. It runs
 * over everyone rather than the current type filter, because you rarely
 * remember whether you filed the vet's patient as a pet or as a child.
 */
export function filterProfiles(
  profiles: FamilyProfile[],
  { type, query }: ProfileFilter
): FamilyProfile[] {
  const term = query?.trim().toLowerCase();

  return profiles.filter((profile) => {
    if (type && profile.type !== type) return false;
    if (term) {
      const haystack = [profile.name, profile.relationship, profile.species]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
}

/** How many profiles of each type — the counts beside the filter chips. */
export function countByType(
  profiles: FamilyProfile[]
): Record<FamilyProfile["type"], number> {
  const counts = { adult: 0, child: 0, baby: 0, pet: 0 };
  for (const profile of profiles) counts[profile.type] += 1;
  return counts;
}

/**
 * Everything that would be affected by deleting a profile.
 *
 * Counted rather than summarised, because "this will also delete 3 reminders
 * and 1 medicine" is a decision and "are you sure?" is a reflex. Saved items
 * are counted separately and are **never** deleted: one may belong to three
 * other things, so only the link to this profile is removed.
 */
export interface ProfileFootprint {
  scheduled: number;
  medications: number;
  logs: number;
  notes: number;
  /** Links to material. Removed from the profile; the items themselves stay. */
  materials: number;
  /** Everything the cascade would actually delete. */
  owned: number;
}

export function footprintOf(
  profile: FamilyProfile,
  scheduled: ScheduledItem[],
  medications: Medication[],
  logs: QuickLogEntry[],
  savedItems: { contextIds: string[] }[]
): ProfileFootprint {
  const own = {
    scheduled: belongsTo(scheduled, profile.id).length,
    medications: medicationsFor(medications, profile.id).length,
    logs: logsFor(logs, profile.id).length,
    notes: profile.notes.length,
    materials: savedItems.filter((item) => item.contextIds.includes(profile.id)).length,
  };

  return { ...own, owned: own.scheduled + own.medications + own.logs };
}

/* --------------------------------------------------------- note prompts -- */

/**
 * The starting points offered when writing a note on a profile.
 *
 * A title and a prompt, nothing more — the same rule every template in the app
 * follows. Scoped to family for the reason learning and training have their own
 * sets: "questions for the doctor" is the right prompt here and nonsense on a
 * shopping list.
 *
 * "Medicines and allergies" is the user's own words about their own family.
 * Focus stores it and shows it back; it never reads it, acts on it, or turns it
 * into a reminder. This is not a medical record.
 */
export const FAMILY_NOTE_TEMPLATES: ProjectNoteTemplate[] = [
  { id: "worthKnowing", titleKey: "familyNotes.worthKnowing.title", hintKey: "familyNotes.worthKnowing.hint" },
  { id: "medicines", titleKey: "familyNotes.medicines.title", hintKey: "familyNotes.medicines.hint" },
  { id: "toBuy", titleKey: "familyNotes.toBuy.title", hintKey: "familyNotes.toBuy.hint" },
  { id: "likes", titleKey: "familyNotes.likes.title", hintKey: "familyNotes.likes.hint" },
  { id: "stoppedAt", titleKey: "familyNotes.stoppedAt.title", hintKey: "familyNotes.stoppedAt.hint" },
  { id: "forTheDoctor", titleKey: "familyNotes.forTheDoctor.title", hintKey: "familyNotes.forTheDoctor.hint" },
  { id: "background", titleKey: "familyNotes.background.title", hintKey: "familyNotes.background.hint" },
];

/* ------------------------------------------------------- task preview -- */

export interface TaskPreviewEntry {
  item: ChecklistItem;
  groupId: string;
}

/**
 * The handful of tasks a profile shows before you open the whole list.
 *
 * The subtlety is `pinned`, and it comes from a browser pass rather than from
 * reasoning: showing "outstanding items" alone means a row **disappears the
 * instant you tick it**. Nothing confirms the tick registered, and a mistaken
 * one cannot be undone without opening the full list — so ticking, the one
 * thing this preview exists for, was the one thing it handled badly.
 *
 * `pinned` holds the ids ticked while the preview has been on screen. They keep
 * their place, ticked, until the page is left. Unticking releases the pin
 * because the row is outstanding again and holds its place on its own.
 */
export function taskPreview(
  checklist: Checklist | undefined,
  pinned: ReadonlySet<string>,
  limit: number
): { visible: TaskPreviewEntry[]; outstanding: number } {
  const all = (checklist?.groups ?? []).flatMap((group) =>
    group.items.map((item) => ({ item, groupId: group.id }))
  );

  const candidates = all.filter((entry) => !entry.item.done || pinned.has(entry.item.id));

  return {
    visible: candidates.slice(0, limit),
    // The honest count of what is still to do — pinned rows are done and are
    // not counted, so "and 4 more" never includes something already ticked.
    outstanding: all.filter((entry) => !entry.item.done).length,
  };
}
