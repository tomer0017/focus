/**
 * "What needs me now?" — the one screen the whole extension exists for.
 *
 * The mistake this module is written to avoid is showing everything. Focus can
 * now see insurance, subscriptions, appointments, medications, birthdays, pet
 * treatments, shopping lists, learning projects and evening ideas; dumping all
 * of that onto one screen would produce a worse inbox than the one the user is
 * already ignoring.
 *
 * So relevance is a filter, not a projection. An item appears when it has
 * *become* relevant — its reminder window has opened, its date is close, or it
 * is already late — and stays invisible otherwise. An insurance renewal in
 * eight months is not on this screen. Neither is a project nobody touched in a
 * fortnight, unless the user asked to be reminded about it.
 */
import { daysUntil } from "./format";
import { todayKey } from "./dateKey";
import { urgencyOf } from "./eventTiming";
import { byDueDate, daysUntilDue, isDue, isOpen, isOverdue, isSnoozed } from "./scheduled";
import { dosesForDay } from "./medications";
import { upcomingCharges } from "./money";
import { unpaidEntries } from "./money";
import { birthdayEvents, isDerivedBirthday, profileIdFromBirthdayEvent } from "./birthdays";
import { hrefForReference, type EntityReference } from "../types/reference";
import type { FamilyProfile } from "../types/family";
import type { FocusEvent } from "../types/event";
import type { Commitment, MoneyEntry } from "../types/finance";
import type { Medication } from "../types/health";
import type { PageSummary } from "../types/page";
import type { ScheduledItem } from "../types/scheduled";

/**
 * Five groups, in the order a person actually triages.
 *
 * `waiting` is the one that is not about time: a bill nobody has marked paid, a
 * shopping list that is ready. It sits third because it is real work with no
 * deadline attached, and it would otherwise never surface anywhere.
 */
export type RelevanceBucket = "today" | "week" | "waiting" | "upcoming" | "recurring";

export const RELEVANCE_BUCKETS: RelevanceBucket[] = [
  "today",
  "week",
  "waiting",
  "upcoming",
  "recurring",
];

/** Where a row came from — drives its icon and its one-word source label. */
export type RelevanceSource =
  | "scheduled"
  | "event"
  | "birthday"
  | "commitment"
  | "money"
  | "medication"
  | "checklist"
  | "learning";

export interface RelevanceItem {
  /** Unique across every source, so React keys and de-duplication both work. */
  id: string;
  source: RelevanceSource;
  /** User content. Rendered with `dir="auto"`. */
  title: string;
  /** One line of user content under the title, when there is one worth showing. */
  detail?: string;
  /** ISO 8601 of what it is about. */
  at?: string;
  daysAway?: number;
  overdue: boolean;
  /** Where "open" leads. Absent when the thing has no screen of its own. */
  href?: string;
  /** The entity to act on, for marking done and snoozing. */
  reference?: EntityReference;
  completable: boolean;
  snoozable: boolean;
  bucket: RelevanceBucket;
}

/** How many rows a group shows before "show more". */
export const BUCKET_LIMIT = 3;

/** How far ahead "coming up" looks. Beyond this, nothing is relevant yet. */
const UPCOMING_HORIZON_DAYS = 21;

/** How long a learning project may sit untouched before it is worth a nudge. */
const LEARNING_IDLE_DAYS = 30;

function bucketFor(daysAway: number | undefined, overdue: boolean): RelevanceBucket {
  if (overdue || daysAway === undefined) return "today";
  if (daysAway <= 0) return "today";
  if (daysAway <= 7) return "week";
  return "upcoming";
}

export interface RelevanceInput {
  scheduled: ScheduledItem[];
  events: FocusEvent[];
  profiles: FamilyProfile[];
  commitments: Commitment[];
  money: MoneyEntry[];
  medications: Medication[];
  pages: PageSummary[];
}

/**
 * Everything currently asking for something, in one flat list.
 *
 * Flat rather than pre-grouped because the caller decides how to slice it: the
 * overview groups by bucket, the reminder centre splits due from snoozed, and
 * both want the same rows.
 */
export function collectRelevance(input: RelevanceInput, now: Date = new Date()): RelevanceItem[] {
  const items: RelevanceItem[] = [];
  const nowIso = now.toISOString();

  /* --------------------------------------------------------- scheduled -- */

  for (const item of input.scheduled) {
    if (!isOpen(item) || isSnoozed(item, now)) continue;

    const daysAway = daysUntilDue(item, now);
    const overdue = isOverdue(item, now);
    // Not yet inside its own reminder window, and not close enough to matter.
    if (!isDue(item, now) && (daysAway === undefined || daysAway > UPCOMING_HORIZON_DAYS)) continue;

    const recurring = Boolean(item.recurrence && item.recurrence.kind !== "once");
    const bucket = bucketFor(daysAway, overdue);

    items.push({
      id: `scheduled-${item.id}`,
      source: "scheduled",
      title: item.title,
      detail: item.appointment?.location ?? item.note,
      at: item.dueAt,
      daysAway,
      overdue,
      href: item.relatedEntity ? hrefForReference(item.relatedEntity) : undefined,
      reference: { kind: "scheduled", id: item.id },
      completable: true,
      snoozable: true,
      // A recurring item that is not yet due belongs under "coming round again"
      // rather than under a date — that is the group's entire purpose.
      bucket: recurring && bucket === "upcoming" ? "recurring" : bucket,
    });
  }

  /* ------------------------------------------------------------ events -- */

  const derivedBirthdays = birthdayEvents(input.profiles, now);
  const storedIds = new Set(input.events.map((event) => event.id));
  const allEvents = [
    ...input.events,
    ...derivedBirthdays.filter((event) => !storedIds.has(event.id)),
  ];

  for (const event of allEvents) {
    const urgency = urgencyOf(event, now);
    // `neutral` is the whole point of the urgency rules: an event that has not
    // entered its preparation window is not asking for anything yet.
    if (urgency === "neutral" || urgency === "done") continue;

    const daysAway = daysUntil(event.startsAt, now);
    if (daysAway > UPCOMING_HORIZON_DAYS && urgency !== "preparing") continue;

    // Derived means computed here; a stored event under the same id is a real
    // event and keeps its own screen.
    const derived = isDerivedBirthday(event);
    items.push({
      id: `event-${event.id}`,
      source: derived ? "birthday" : "event",
      title: event.title,
      detail: event.nextAction,
      at: event.startsAt,
      daysAway,
      overdue: daysAway < 0,
      href: derived
        ? `/family/${profileIdFromBirthdayEvent(event.id)}`
        : `/events/${event.id}`,
      reference: derived ? undefined : { kind: "event", id: event.id },
      completable: false,
      snoozable: false,
      bucket: bucketFor(daysAway, false),
    });
  }

  /* ------------------------------------------------------- commitments -- */

  for (const charge of upcomingCharges(input.commitments, now, UPCOMING_HORIZON_DAYS)) {
    items.push({
      id: `commitment-${charge.commitment.id}-${charge.isRenewal ? "renewal" : "charge"}`,
      source: "commitment",
      title: charge.commitment.title,
      detail: charge.commitment.provider,
      at: charge.at,
      daysAway: charge.daysAway,
      overdue: false,
      href: "/manage?view=money",
      reference: { kind: "commitment", id: charge.commitment.id },
      completable: false,
      snoozable: false,
      bucket: bucketFor(charge.daysAway, false),
    });
  }

  /* ------------------------------------------------------------- money -- */

  for (const entry of unpaidEntries(input.money)) {
    const daysAway = daysUntil(`${entry.occurredOn}T12:00:00`, now);
    // An unpaid bill due next month is not owed attention yet.
    if (daysAway > 7) continue;
    items.push({
      id: `money-${entry.id}`,
      source: "money",
      title: entry.category ?? entry.note ?? "",
      detail: entry.note,
      at: `${entry.occurredOn}T12:00:00`,
      daysAway,
      overdue: daysAway < 0,
      href: "/manage?view=money",
      reference: undefined,
      completable: false,
      snoozable: false,
      // Money that is late is work with no deadline left — it is simply owed.
      bucket: "waiting",
    });
  }

  /* -------------------------------------------------------- medication -- */

  const doses = dosesForDay(input.medications, todayKey(now)).filter((dose) => !dose.taken);
  if (doses.length > 0) {
    const next = doses[0];
    items.push({
      id: `medication-${todayKey(now)}`,
      source: "medication",
      title: next.name,
      detail: next.time,
      at: nowIso,
      daysAway: 0,
      overdue: false,
      href: "/manage?view=health",
      reference: undefined,
      completable: false,
      snoozable: false,
      bucket: "today",
    });
  }

  /* ------------------------------------------- checklists and learning -- */

  for (const page of input.pages) {
    if (page.status === "completed") continue;

    if (page.type === "checklist" && page.dueAt) {
      const daysAway = daysUntil(page.dueAt, now);
      if (daysAway < 0 || daysAway > 7) continue;
      items.push({
        id: `checklist-${page.id}`,
        source: "checklist",
        title: page.title,
        at: page.dueAt,
        daysAway,
        overdue: false,
        href: `/pages/${page.id}`,
        reference: { kind: "page", id: page.id },
        completable: false,
        snoozable: false,
        bucket: bucketFor(daysAway, false),
      });
      continue;
    }

    if (page.type === "learning" && page.status === "active") {
      const last = page.learning?.lastStudiedAt ?? page.lastUpdatedAt;
      const idleDays = -daysUntil(last, now);
      if (idleDays < LEARNING_IDLE_DAYS) continue;
      items.push({
        id: `learning-${page.id}`,
        source: "learning",
        title: page.title,
        detail: page.stoppedAt ?? page.nextAction,
        at: last,
        daysAway: undefined,
        overdue: false,
        href: `/pages/${page.id}`,
        reference: { kind: "page", id: page.id },
        completable: false,
        snoozable: false,
        // Not urgent and never dated — it belongs with the things that come
        // round, not with today.
        bucket: "recurring",
      });
    }
  }

  return items;
}

/** The flat list, split into its groups and sorted inside each. */
export function groupRelevance(
  items: RelevanceItem[]
): Record<RelevanceBucket, RelevanceItem[]> {
  const grouped: Record<RelevanceBucket, RelevanceItem[]> = {
    today: [],
    week: [],
    waiting: [],
    upcoming: [],
    recurring: [],
  };

  for (const item of items) grouped[item.bucket].push(item);

  for (const bucket of RELEVANCE_BUCKETS) {
    grouped[bucket].sort((a, b) => {
      // Late things first inside a group; then soonest; then alphabetically so
      // the order does not shuffle between renders.
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      if (a.at && b.at && a.at !== b.at) return a.at.localeCompare(b.at);
      return a.title.localeCompare(b.title);
    });
  }

  return grouped;
}

export function totalRelevance(grouped: Record<RelevanceBucket, RelevanceItem[]>): number {
  return RELEVANCE_BUCKETS.reduce((sum, bucket) => sum + grouped[bucket].length, 0);
}

/**
 * How many things are actually asking right now — the number on the bell.
 *
 * Only `today` and `waiting` count. A badge that includes everything due in
 * three weeks is a badge that always shows a number, and a badge that always
 * shows a number is furniture.
 */
export function openReminderCount(items: RelevanceItem[]): number {
  return items.filter((item) => item.bucket === "today" || item.bucket === "waiting").length;
}

/** Scheduled items that have been snoozed, for the reminder centre's own list. */
export function snoozedRelevance(scheduled: ScheduledItem[], now: Date = new Date()): ScheduledItem[] {
  return scheduled.filter((item) => isOpen(item) && isSnoozed(item, now)).sort(byDueDate);
}
