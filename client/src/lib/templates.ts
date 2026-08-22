/**
 * Templates, and the one rule that makes them safe.
 *
 * **A template is a starting point and nothing else.** Using one produces a new
 * object with fresh ids; editing what came out never reaches back into the
 * template, and editing the template never reaches into a list somebody is
 * already shopping from. That independence is not a nicety — a "weekly shop"
 * template that mutates when you tick things off is a template you can only use
 * once.
 *
 * The picker is shared across every domain because the shape of the decision is
 * identical everywhere: a few recommended ones, the ones you used last, and
 * then the rest. Showing forty at once is how a template system stops being
 * used.
 */
import { checklistId } from "./checklist";
import type { Checklist, ChecklistTemplate } from "../types/checklist";

/** Which kind of thing a template produces. */
export type TemplateDomain = "checklist" | "scheduled" | "family" | "learning" | "menu";

/**
 * What using a template actually creates.
 *
 * Deliberately explicit rather than a generic factory: "insurance" and "weekly
 * shop" both start from a template, and they create entirely different records
 * through entirely different forms. A discriminated union lets one picker feed
 * five flows without any of them pretending to be each other.
 */
export type TemplateTarget =
  | { create: "commitment"; kind: "insurance" | "subscription" }
  | { create: "scheduled"; category: "appointment" | "checkup" | "vaccination" | "treatment" | "contact" | "reminder" | "bill" }
  | { create: "medication" }
  | { create: "checklist"; templateId: string }
  | { create: "menu"; kind: "shabbat" | "shabbatGuests" | "holiday" | "free" }
  | { create: "profileBirthday" };

export interface TemplateOption {
  id: string;
  domain: TemplateDomain;
  /** Translation key in the `manage` namespace. Built-ins carry no words. */
  nameKey: string;
  /** One line saying what it is for. */
  hintKey?: string;
  target: TemplateTarget;
  /** Offered first, before "all templates" is expanded. */
  recommended?: boolean;
}

/**
 * The optional second step of quick create.
 *
 * The first step is always the four primitives — a reminder, a list, an event,
 * a note — because somebody who just wants to write "call the garage" must not
 * be handed a form with a company name and a billing cycle on it. Templates are
 * for when you know you are creating an insurance policy.
 */
export const QUICK_CREATE_TEMPLATES: TemplateOption[] = [
  {
    id: "tpl-insurance",
    domain: "scheduled",
    nameKey: "templates.insurance",
    hintKey: "templates.insuranceHint",
    target: { create: "commitment", kind: "insurance" },
    recommended: true,
  },
  {
    id: "tpl-subscription",
    domain: "scheduled",
    nameKey: "templates.subscription",
    hintKey: "templates.subscriptionHint",
    target: { create: "commitment", kind: "subscription" },
    recommended: true,
  },
  {
    id: "tpl-appointment",
    domain: "scheduled",
    nameKey: "templates.appointment",
    hintKey: "templates.appointmentHint",
    target: { create: "scheduled", category: "appointment" },
    recommended: true,
  },
  {
    id: "tpl-checkup",
    domain: "scheduled",
    nameKey: "templates.checkup",
    hintKey: "templates.checkupHint",
    target: { create: "scheduled", category: "checkup" },
  },
  {
    id: "tpl-medication",
    domain: "scheduled",
    nameKey: "templates.medication",
    hintKey: "templates.medicationHint",
    target: { create: "medication" },
    recommended: true,
  },
  {
    id: "tpl-shop-weekly",
    domain: "checklist",
    nameKey: "templates.shopWeekly",
    hintKey: "templates.shopWeeklyHint",
    target: { create: "checklist", templateId: "shop-weekly" },
    recommended: true,
  },
  {
    id: "tpl-shop-monthly",
    domain: "checklist",
    nameKey: "templates.shopMonthly",
    target: { create: "checklist", templateId: "shop-monthly" },
  },
  {
    id: "tpl-shop-holiday",
    domain: "checklist",
    nameKey: "templates.shopHoliday",
    target: { create: "checklist", templateId: "shop-holiday" },
  },
  {
    id: "tpl-menu-shabbat",
    domain: "menu",
    nameKey: "templates.menuShabbat",
    hintKey: "templates.menuShabbatHint",
    target: { create: "menu", kind: "shabbat" },
    recommended: true,
  },
  {
    id: "tpl-birthday",
    domain: "family",
    nameKey: "templates.birthday",
    hintKey: "templates.birthdayHint",
    target: { create: "profileBirthday" },
  },
];

/* ------------------------------------------------------------- selection -- */

/** How many "recently used" entries the picker remembers. */
export const RECENT_LIMIT = 4;

/**
 * The three lists a picker shows, from one array plus a usage history.
 *
 * Recent wins over recommended: a template you reached for last week is a
 * better guess than one somebody else marked as popular, and an option that
 * appears twice on one screen is the duplication rule broken.
 */
export function partitionTemplates<T extends { id: string; recommended?: boolean }>(
  templates: T[],
  recentIds: string[]
): { recommended: T[]; recent: T[]; all: T[] } {
  const byId = new Map(templates.map((template) => [template.id, template]));
  const recent = recentIds
    .map((id) => byId.get(id))
    .filter((template): template is T => template !== undefined)
    .slice(0, RECENT_LIMIT);
  const recentSet = new Set(recent.map((template) => template.id));

  return {
    recent,
    recommended: templates.filter(
      (template) => template.recommended && !recentSet.has(template.id)
    ),
    all: templates,
  };
}

/** Most recent first, no duplicates, capped. */
export function rememberTemplate(recentIds: string[], id: string): string[] {
  return [id, ...recentIds.filter((entry) => entry !== id)].slice(0, RECENT_LIMIT);
}

/* -------------------------------------------------------------- cloning -- */

/**
 * A checklist from a template, with every id regenerated and every box clear.
 *
 * `fromTemplate` in `lib/checklist.ts` already does this and is what the app
 * uses; this wrapper exists so a caller can assert the independence it relies
 * on without reaching into the checklist module for one function. It also
 * carries the template's own name across, which the trip flow did not need and
 * a shopping list does: "Weekly shop" is what the list should be called.
 */
export function checklistFromTemplate(
  ownerId: string,
  template: ChecklistTemplate,
  title?: string
): Checklist {
  return {
    ownerId,
    templateId: template.id,
    title: title ?? template.name,
    groups: template.groups.map((group) => ({
      ...group,
      id: checklistId("group"),
      collapsed: false,
      items: group.items.map((item) => ({
        ...item,
        id: checklistId("item"),
        done: false,
      })),
    })),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * True when two checklists share no object identity at any level.
 *
 * Exported because it is what the independence test asserts, and because
 * "shares nothing" is a claim worth being able to check rather than assume.
 */
export function sharesNoIdentity(a: Checklist, b: Checklist): boolean {
  const idsOf = (list: Checklist): string[] =>
    list.groups.flatMap((group) => [group.id, ...group.items.map((item) => item.id)]);
  const left = new Set(idsOf(a));
  return idsOf(b).every((id) => !left.has(id));
}
