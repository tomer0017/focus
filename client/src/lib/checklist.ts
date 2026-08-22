import type { Checklist, ChecklistGroup, ChecklistItem, ChecklistTemplate } from "../types";

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
