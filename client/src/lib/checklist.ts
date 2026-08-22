import type {
  Checklist,
  ChecklistContext,
  ChecklistGroup,
  ChecklistItem,
  ChecklistTemplate,
  PageSummary,
} from "../types";

/** Ids only need to be unique in one browser; no id service exists yet. */
export function checklistId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export interface ChecklistProgress {
  done: number;
  total: number;
  /** 0–1. Zero when the list is empty, rather than NaN. */
  fraction: number;
}

export function progressOf(checklist: Checklist | undefined): ChecklistProgress {
  if (!checklist) return { done: 0, total: 0, fraction: 0 };

  let done = 0;
  let total = 0;
  for (const group of checklist.groups) {
    for (const item of group.items) {
      total += 1;
      if (item.done) done += 1;
    }
  }
  return { done, total, fraction: total === 0 ? 0 : done / total };
}

export function groupProgress(group: ChecklistGroup): ChecklistProgress {
  const total = group.items.length;
  const done = group.items.filter((item) => item.done).length;
  return { done, total, fraction: total === 0 ? 0 : done / total };
}


/* ------------------------------------------------- purpose and scope -- */

/**
 * What a list owned by an entity is for, from the owner key alone.
 *
 * This is not inference from a route or a name. A checklist owner key *is* an
 * `EntityReference` in string form — `checklistOwnerFor` is what wrote it — so
 * reading `trip:japan-2027` back as "a packing list, scoped to a trip" is
 * reading the parent the writer recorded, and nothing else could be true of it.
 *
 * `page:` is deliberately absent: a page-owned list is a shopping list, a
 * packing list or a plain to-do list depending on what the user made, and only
 * the page knows which. That is why `PageSummary.checklist` exists.
 */
const CONTEXT_BY_OWNER_KIND: Record<string, ChecklistContext> = {
  trip: { purpose: "packing", scope: "trip" },
  event: { purpose: "event", scope: "event" },
  project: { purpose: "tasks", scope: "project" },
  family: { purpose: "general", scope: "person" },
};

/**
 * The honest answer for a page-owned list that has never said what it is.
 *
 * `general`/`page` rather than a guess. A list nobody classified is not a
 * household shopping list, and treating it as one is exactly the mistake that
 * put a camping trip on the supermarket screen.
 */
export const UNCLASSIFIED_CONTEXT: ChecklistContext = { purpose: "general", scope: "page" };

/**
 * What a list on a page of each type is, when the page has not said.
 *
 * `checklist` is deliberately missing. Every other page type implies its list —
 * a project's list is that project's tasks — but a page that *is* a list could
 * equally be the weekly shop or a camping kit, and only the user knows which.
 */
const CONTEXT_BY_PAGE_TYPE: Partial<Record<PageSummary["type"], ChecklistContext>> = {
  project: { purpose: "tasks", scope: "project" },
  learning: { purpose: "tasks", scope: "page" },
  event: { purpose: "event", scope: "event" },
  routine: { purpose: "tasks", scope: "page" },
  collection: { purpose: "general", scope: "page" },
  showcase: { purpose: "general", scope: "page" },
};

/**
 * What a checklist is for and whose it is — the single judge.
 *
 * Every screen that lists checklists goes through this, the same way every
 * screen that asks "is this urgent?" goes through `urgencyOf`. Two judges would
 * drift apart, and the drift would be invisible until a list turned up
 * somewhere it does not belong.
 *
 * `page` is the page the owner key points at, when the caller has it. Passing
 * it is what lets a page-owned list answer for itself; without it the answer
 * falls back to unclassified, which shows the list on no screen that filters.
 */
export function checklistContextOf(
  ownerId: string,
  page?: PageSummary | undefined
): ChecklistContext {
  const [kind] = ownerId.split(":");

  if (kind !== "page") {
    return CONTEXT_BY_OWNER_KIND[kind] ?? UNCLASSIFIED_CONTEXT;
  }

  // What the page declared, when it declared anything.
  if (page?.checklist) return page.checklist;

  // Otherwise the page's *type* answers, and it is stored data rather than a
  // route or a title: the list on a project page is that project's tasks, by
  // definition of what a project page is. Only a page whose entire identity is
  // "a list" is genuinely ambiguous — a shopping list and a packing list are
  // the same shape — and that is the one case left unclassified below.
  if (page) return CONTEXT_BY_PAGE_TYPE[page.type] ?? UNCLASSIFIED_CONTEXT;

  return UNCLASSIFIED_CONTEXT;
}

/** True when a list matches both axes a screen is asking for. */
export function matchesChecklistContext(
  context: ChecklistContext,
  wanted: Partial<ChecklistContext>
): boolean {
  if (wanted.purpose && context.purpose !== wanted.purpose) return false;
  if (wanted.scope && context.scope !== wanted.scope) return false;
  return true;
}

/**
 * The lists that belong on the household shopping screen, and only those.
 *
 * The query this replaces was `pages.filter(page => page.type === "checklist")`,
 * which asked for the storage shape rather than the purpose and so returned the
 * camping packing list alongside the weekly shop. A trip list stays in its trip
 * and an event list stays in its event; moving something between them is an
 * explicit action, never a side effect of a query.
 */
export function selectHouseholdShoppingLists(pages: PageSummary[]): PageSummary[] {
  return pages.filter(
    (page) =>
      page.type === "checklist" &&
      matchesChecklistContext(checklistContextOf(`page:${page.id}`, page), {
        purpose: "shopping",
        scope: "household",
      })
  );
}

/* ------------------------------------------------------------- pure edits -- */

function mapGroups(
  checklist: Checklist,
  update: (group: ChecklistGroup) => ChecklistGroup
): Checklist {
  return {
    ...checklist,
    groups: checklist.groups.map(update),
    updatedAt: new Date().toISOString(),
  };
}

export function toggleItem(checklist: Checklist, groupId: string, itemId: string): Checklist {
  return mapGroups(checklist, (group) =>
    group.id !== groupId
      ? group
      : {
          ...group,
          items: group.items.map((item) =>
            item.id === itemId ? { ...item, done: !item.done } : item
          ),
        }
  );
}

export function addItem(checklist: Checklist, groupId: string, text: string): Checklist {
  const trimmed = text.trim();
  if (!trimmed) return checklist;

  return mapGroups(checklist, (group) =>
    group.id !== groupId
      ? group
      : { ...group, items: [...group.items, { id: checklistId("item"), text: trimmed, done: false }] }
  );
}

export function updateItem(
  checklist: Checklist,
  groupId: string,
  itemId: string,
  patch: Partial<ChecklistItem>
): Checklist {
  return mapGroups(checklist, (group) =>
    group.id !== groupId
      ? group
      : {
          ...group,
          items: group.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  ...patch,
                  // Editing the words makes them the user's, so the template
                  // key stops applying.
                  ...(patch.text !== undefined ? { textKey: undefined } : {}),
                }
              : item
          ),
        }
  );
}

export function removeItem(checklist: Checklist, groupId: string, itemId: string): Checklist {
  return mapGroups(checklist, (group) =>
    group.id !== groupId
      ? group
      : { ...group, items: group.items.filter((item) => item.id !== itemId) }
  );
}

/** Moves an item one place within its group. Order is the user's, so it sticks. */
export function moveItem(
  checklist: Checklist,
  groupId: string,
  itemId: string,
  direction: -1 | 1
): Checklist {
  return mapGroups(checklist, (group) => {
    if (group.id !== groupId) return group;

    const index = group.items.findIndex((item) => item.id === itemId);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= group.items.length) return group;

    const items = [...group.items];
    [items[index], items[target]] = [items[target], items[index]];
    return { ...group, items };
  });
}

export function setGroupCollapsed(
  checklist: Checklist,
  groupId: string,
  collapsed: boolean
): Checklist {
  return mapGroups(checklist, (group) =>
    group.id === groupId ? { ...group, collapsed } : group
  );
}

export function addGroup(checklist: Checklist, title: string): Checklist {
  const trimmed = title.trim();
  if (!trimmed) return checklist;

  return {
    ...checklist,
    groups: [...checklist.groups, { id: checklistId("group"), title: trimmed, items: [] }],
    updatedAt: new Date().toISOString(),
  };
}

export function removeGroup(checklist: Checklist, groupId: string): Checklist {
  return {
    ...checklist,
    groups: checklist.groups.filter((group) => group.id !== groupId),
    updatedAt: new Date().toISOString(),
  };
}

/* --------------------------------------------------------------- templates -- */

/** A fresh checklist from a template, with new ids so nothing is shared. */
export function fromTemplate(ownerId: string, template: ChecklistTemplate): Checklist {
  return {
    ownerId,
    templateId: template.id,
    groups: template.groups.map((group) => ({
      ...group,
      id: checklistId("group"),
      items: group.items.map((item) => ({ ...item, id: checklistId("item"), done: false })),
    })),
    updatedAt: new Date().toISOString(),
  };
}

/** A template captured from a list the user built, with everything unticked. */
export function toTemplate(checklist: Checklist, name: string): ChecklistTemplate {
  return {
    id: checklistId("template"),
    name: name.trim(),
    groups: checklist.groups.map((group) => ({
      ...group,
      id: checklistId("group"),
      collapsed: false,
      items: group.items.map((item) => ({ ...item, id: checklistId("item"), done: false })),
    })),
  };
}

/** A copy of another list, unticked — "same packing list as last time". */
export function duplicate(source: Checklist, ownerId: string): Checklist {
  return {
    ownerId,
    templateId: source.templateId,
    title: source.title,
    groups: source.groups.map((group) => ({
      ...group,
      id: checklistId("group"),
      items: group.items.map((item) => ({ ...item, id: checklistId("item"), done: false })),
    })),
    updatedAt: new Date().toISOString(),
  };
}

export function emptyChecklist(ownerId: string): Checklist {
  return { ownerId, groups: [], updatedAt: new Date().toISOString() };
}
