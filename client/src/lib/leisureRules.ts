/**
 * "What suits right now?" — a scoring function, not a model.
 *
 * There is no AI here and there is no need for one. The question is narrow
 * enough to answer with arithmetic: does it fit the time, the energy, the
 * company, the place and the budget the user just described. Anything that
 * fails a hard constraint is out; what is left is ranked, and exactly one thing
 * is offered.
 *
 * One suggestion is the whole design. A list of eight is another list to read,
 * and the user asked this question precisely because they did not want to read
 * a list.
 */
import type {
  LeisureContext,
  LeisureCost,
  LeisureEnergy,
  LeisureItem,
} from "../types/leisure";
import { isSettled } from "./leisureCollections";

/** Ordered so "I have low energy" can accept anything at or below it. */
const ENERGY_RANK: Record<LeisureEnergy, number> = { low: 0, medium: 1, high: 2 };
const COST_RANK: Record<LeisureCost, number> = { free: 0, cheap: 1, moderate: 2, expensive: 3 };

/** How long a "not now" lasts. Long enough to mean it, short enough to forget. */
export const DISMISS_HOURS = 24 * 3;

/** How long after being suggested an item stays out of the running. */
export const SUGGESTION_COOLDOWN_HOURS = 24 * 5;

/** Why an item was chosen. Rendered as one short line beside the suggestion. */
export type MatchReason = "fitsTime" | "lowEnergy" | "atHome" | "outside" | "withCompany" | "cheap" | "untried";

export interface Suggestion {
  item: LeisureItem;
  score: number;
  /** At most two, so the explanation stays a sentence and not a report. */
  reasons: MatchReason[];
}

/** True while the item has been told to stay quiet. */
export function isDismissed(item: LeisureItem, now: Date = new Date()): boolean {
  return Boolean(item.dismissedUntil && item.dismissedUntil > now.toISOString());
}

/**
 * True while the item is inside its post-suggestion cooldown.
 *
 * This is the rule that stops the card offering the same film every evening for
 * a week, which is the failure mode that makes people stop looking at it.
 */
export function isCoolingDown(item: LeisureItem, now: Date = new Date()): boolean {
  if (!item.lastSuggestedAt) return false;
  const until = new Date(item.lastSuggestedAt).getTime() + SUGGESTION_COOLDOWN_HOURS * 3600_000;
  return until > now.getTime();
}

/**
 * Whether an item is even a candidate.
 *
 * Hard constraints only. Something that takes two hours does not "partially
 * fit" ninety minutes, and offering it anyway is how a suggester loses trust in
 * one go.
 */
function passes(item: LeisureItem, context: LeisureContext): boolean {
  // Finished with, whichever axis says so: read, watched, visited, bought or
  // given up on. Reading only `status` would keep offering a book somebody
  // marked completed on its own, per-kind control.
  if (item.status === "done" || isSettled(item)) return false;

  if (context.minutes !== undefined && item.minutes !== undefined && item.minutes > context.minutes) {
    return false;
  }
  if (
    context.energy !== undefined &&
    item.energy !== undefined &&
    ENERGY_RANK[item.energy] > ENERGY_RANK[context.energy]
  ) {
    return false;
  }
  if (context.place !== undefined && item.place !== undefined && item.place !== context.place) {
    return false;
  }
  if (
    context.cost !== undefined &&
    item.cost !== undefined &&
    COST_RANK[item.cost] > COST_RANK[context.cost]
  ) {
    return false;
  }
  if (
    context.company !== undefined &&
    item.company !== undefined &&
    item.company.length > 0 &&
    !item.company.includes(context.company)
  ) {
    return false;
  }
  return true;
}

/** Points for the ways an item actively fits, rather than merely not clashing. */
function scoreOf(item: LeisureItem, context: LeisureContext): { score: number; reasons: MatchReason[] } {
  let score = 0;
  const reasons: MatchReason[] = [];

  if (context.minutes !== undefined && item.minutes !== undefined) {
    // Closer to the time available beats "technically shorter".
    const slack = context.minutes - item.minutes;
    if (slack >= 0 && slack <= 30) {
      score += 3;
      reasons.push("fitsTime");
    } else if (slack >= 0) {
      score += 1;
    }
  }
  if (context.energy === "low" && item.energy === "low") {
    score += 3;
    reasons.push("lowEnergy");
  }
  if (context.place !== undefined && item.place === context.place) {
    score += 2;
    reasons.push(context.place === "home" ? "atHome" : "outside");
  }
  if (context.company !== undefined && item.company?.includes(context.company)) {
    score += 2;
    reasons.push("withCompany");
  }
  if (context.cost !== undefined && (item.cost === "free" || item.cost === "cheap")) {
    score += 1;
    reasons.push("cheap");
  }
  // Something already planned is a stronger answer than a raw idea.
  if (item.status === "planned") score += 2;
  // Never suggested before beats suggested a month ago.
  if (!item.lastSuggestedAt) {
    score += 1;
    reasons.push("untried");
  }

  return { score, reasons: reasons.slice(0, 2) };
}

/**
 * The single best fit, or nothing.
 *
 * Returning `undefined` is a real answer and the screen renders it as one. An
 * app that always has a suggestion is an app whose suggestions mean nothing;
 * "nothing here fits ninety minutes at home" is honest and takes one line.
 *
 * `load: "busy"` silences it outright. Somebody who has just told the app they
 * are swamped does not want to be sold an evening out.
 */
export function suggestOne(
  items: LeisureItem[],
  context: LeisureContext,
  now: Date = new Date()
): Suggestion | undefined {
  if (context.load === "busy") return undefined;

  const candidates = items
    .filter((item) => !isDismissed(item, now) && !isCoolingDown(item, now) && passes(item, context))
    .map((item) => ({ item, ...scoreOf(item, context) }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        // A stable tiebreak, so the same inputs give the same answer twice.
        a.item.title.localeCompare(b.item.title)
    );

  return candidates[0];
}

/** Stamps the cooldown after an item has been offered. */
export function markSuggested(item: LeisureItem, now: Date = new Date()): LeisureItem {
  return { ...item, lastSuggestedAt: now.toISOString(), updatedAt: now.toISOString() };
}

/** "Not now" — quiet for a few days, still on the list. */
export function dismissFor(
  item: LeisureItem,
  hours: number = DISMISS_HOURS,
  now: Date = new Date()
): LeisureItem {
  return {
    ...item,
    dismissedUntil: new Date(now.getTime() + hours * 3600_000).toISOString(),
    updatedAt: now.toISOString(),
  };
}

/** Accepted: it becomes a plan, and stops being suggested. */
export function acceptSuggestion(item: LeisureItem, now: Date = new Date()): LeisureItem {
  return { ...item, status: "planned", updatedAt: now.toISOString() };
}

export function markDone(item: LeisureItem, now: Date = new Date()): LeisureItem {
  return { ...item, status: "done", doneAt: now.toISOString(), updatedAt: now.toISOString() };
}

/* ------------------------------------------------------------- filtering -- */

export interface LeisureFilter {
  kind?: LeisureItem["kind"];
  energy?: LeisureEnergy;
  place?: LeisureItem["place"];
  status?: LeisureItem["status"];
  query?: string;
}

export function filterLeisure(items: LeisureItem[], filter: LeisureFilter): LeisureItem[] {
  const term = filter.query?.trim().toLowerCase();

  return items.filter((item) => {
    if (filter.kind && item.kind !== filter.kind) return false;
    if (filter.energy && item.energy !== filter.energy) return false;
    if (filter.place && item.place !== filter.place) return false;
    if (filter.status && item.status !== filter.status) return false;
    if (term) {
      const haystack = [item.title, item.note, ...item.tags].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
}
