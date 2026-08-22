import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { Icon } from "./Icon";
import { ProgressBar } from "./ProgressBar";
import {
  addGroup,
  addItem,
  groupProgress,
  moveItem,
  progressOf,
  removeGroup,
  removeItem,
  setGroupCollapsed,
  toggleItem,
  updateItem,
} from "../../lib/checklist";
import type { Checklist as ChecklistModel, ChecklistItem } from "../../types";

interface ChecklistProps {
  checklist: ChecklistModel;
  /** Applies a pure operation and persists it. */
  onChange: (change: (checklist: ChecklistModel) => ChecklistModel) => void;
  /** Extra controls for the header, e.g. "save as template". */
  action?: React.ReactNode;
  /**
   * `view` keeps the boxes tickable and hides every structural control —
   * no delete, no reorder, no open input. Ticking something off is not
   * editing the list's structure, and needing "edit mode" to do it would be
   * absurd.
   */
  mode?: "view" | "edit";
  /** Hides the progress bar, for places that show their own. */
  hideProgress?: boolean;
  /** Drops the group header and "add a group", for a single-group list. */
  hideGroupChrome?: boolean;
}

/**
 * The one checklist component. Trips, projects and events all render this.
 *
 * Every control is a real control: the tick is an `<input type="checkbox">`
 * with a label, not a styled span, and reordering is two buttons rather than a
 * drag handle — which means the whole list works from a keyboard without a
 * second code path.
 */
export function Checklist({
  checklist,
  onChange,
  action,
  mode = "edit",
  hideProgress = false,
  hideGroupChrome = false,
}: ChecklistProps) {
  const editable = mode === "edit";
  const { t } = useTranslation(["checklist", "common"]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState("");
  const [addingGroup, setAddingGroup] = useState(false);

  const total = progressOf(checklist);

  /** A group's name: the user's, or the template's, translated. */
  const groupLabel = (group: ChecklistModel["groups"][number]): string =>
    group.title ?? (group.titleKey ? t(`checklist:${group.titleKey}`) : t("checklist:untitledGroup"));

  const itemLabel = (item: ChecklistItem): string =>
    item.text ?? (item.textKey ? t(`checklist:items.${item.textKey}`) : "");

  return (
    <div className="focus-checklist-panel">
      {!hideProgress && (
        <div className="focus-checklist-panel__head">
          <ProgressBar
            done={total.done}
            total={total.total}
            label={checklist.title ?? t("checklist:progressLabel")}
          />
          {action}
        </div>
      )}

      {checklist.groups.map((group) => {
        const progress = groupProgress(group);
        const collapsed = group.collapsed === true;

        return (
          <section key={group.id} className="focus-cl-group">
            {!hideGroupChrome && (
            <div className="focus-cl-group__head">
              <button
                type="button"
                className="focus-cl-group__toggle"
                aria-expanded={!collapsed}
                onClick={() => onChange((current) => setGroupCollapsed(current, group.id, !collapsed))}
              >
                <Icon name={collapsed ? "chevronDown" : "chevronUp"} size={15} />
                <span className="focus-cl-group__title" dir="auto">
                  {groupLabel(group)}
                </span>
                <span className="focus-cl-group__count">
                  {progress.done}/{progress.total}
                </span>
              </button>

              {editable && (
                <button
                  type="button"
                  className="focus-icon-button text-secondary"
                  onClick={() => onChange((current) => removeGroup(current, group.id))}
                  aria-label={t("checklist:removeGroup", { name: groupLabel(group) })}
                >
                  <Icon name="trash" size={14} />
                </button>
              )}
            </div>
            )}

            {!collapsed && (
              <>
                <ul className="list-unstyled focus-cl-items mb-2">
                  {group.items.map((item, index) => {
                    const editKey = `${group.id}:${item.id}`;
                    const isEditing = editing === editKey;

                    return (
                      <li key={item.id} className="focus-cl-item">
                        <input
                          id={`cl-${item.id}`}
                          type="checkbox"
                          className="form-check-input focus-cl-item__box"
                          checked={item.done}
                          onChange={() => onChange((current) => toggleItem(current, group.id, item.id))}
                        />

                        {isEditing && editable ? (
                          <form
                            className="focus-inline-form flex-grow-1"
                            onSubmit={(event) => {
                              event.preventDefault();
                              const value = drafts[editKey]?.trim();
                              if (value) {
                                onChange((current) =>
                                  updateItem(current, group.id, item.id, { text: value })
                                );
                              }
                              setEditing(null);
                            }}
                          >
                            <label className="visually-hidden" htmlFor={`cl-edit-${item.id}`}>
                              {t("checklist:editItem")}
                            </label>
                            <input
                              id={`cl-edit-${item.id}`}
                              className="form-control form-control-sm"
                              dir="auto"
                              autoFocus
                              value={drafts[editKey] ?? itemLabel(item)}
                              onChange={(event) =>
                                setDrafts((current) => ({ ...current, [editKey]: event.target.value }))
                              }
                            />
                            <Button type="submit" size="sm" variant="outline-primary">
                              {t("common:actions.save")}
                            </Button>
                          </form>
                        ) : (
                          <label
                            htmlFor={`cl-${item.id}`}
                            className={`focus-cl-item__label ${item.done ? "is-done" : ""}`}
                          >
                            <span dir="auto">{itemLabel(item)}</span>
                            {item.note && (
                              <span className="focus-cl-item__note" dir="auto">
                                {item.note}
                              </span>
                            )}
                          </label>
                        )}

                        {editable && (
                        <span className="focus-cl-item__controls">
                          <button
                            type="button"
                            className="focus-icon-button text-secondary"
                            disabled={index === 0}
                            onClick={() => onChange((current) => moveItem(current, group.id, item.id, -1))}
                            aria-label={t("checklist:moveUp", { name: itemLabel(item) })}
                          >
                            <Icon name="chevronUp" size={13} />
                          </button>
                          <button
                            type="button"
                            className="focus-icon-button text-secondary"
                            disabled={index === group.items.length - 1}
                            onClick={() => onChange((current) => moveItem(current, group.id, item.id, 1))}
                            aria-label={t("checklist:moveDown", { name: itemLabel(item) })}
                          >
                            <Icon name="chevronDown" size={13} />
                          </button>
                          <button
                            type="button"
                            className="focus-icon-button text-secondary"
                            onClick={() => {
                              setDrafts((current) => ({ ...current, [editKey]: itemLabel(item) }));
                              setEditing(isEditing ? null : editKey);
                            }}
                            aria-label={t("checklist:editItemNamed", { name: itemLabel(item) })}
                          >
                            <Icon name="edit" size={13} />
                          </button>
                          <button
                            type="button"
                            className="focus-icon-button text-secondary"
                            onClick={() => onChange((current) => removeItem(current, group.id, item.id))}
                            aria-label={t("checklist:removeItem", { name: itemLabel(item) })}
                          >
                            <Icon name="trash" size={13} />
                          </button>
                        </span>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {editable && (
                <form
                  className="focus-inline-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const value = drafts[group.id] ?? "";
                    onChange((current) => addItem(current, group.id, value));
                    setDrafts((current) => ({ ...current, [group.id]: "" }));
                  }}
                >
                  <label className="visually-hidden" htmlFor={`cl-add-${group.id}`}>
                    {t("checklist:addItem")}
                  </label>
                  <input
                    id={`cl-add-${group.id}`}
                    className="form-control form-control-sm"
                    dir="auto"
                    placeholder={t("checklist:addItem")}
                    value={drafts[group.id] ?? ""}
                    onChange={(event) =>
                      setDrafts((current) => ({ ...current, [group.id]: event.target.value }))
                    }
                  />
                  <Button type="submit" size="sm" variant="outline-primary">
                    {t("checklist:add")}
                  </Button>
                </form>
                )}
              </>
            )}
          </section>
        );
      })}

      {!editable || hideGroupChrome ? null : addingGroup ? (
        <form
          className="focus-inline-form focus-cl-add-group"
          onSubmit={(event) => {
            event.preventDefault();
            onChange((current) => addGroup(current, newGroup));
            setNewGroup("");
            setAddingGroup(false);
          }}
        >
          <label className="visually-hidden" htmlFor="cl-new-group">
            {t("checklist:addGroup")}
          </label>
          <input
            id="cl-new-group"
            className="form-control form-control-sm"
            dir="auto"
            autoFocus
            placeholder={t("checklist:addGroup")}
            value={newGroup}
            onChange={(event) => setNewGroup(event.target.value)}
          />
          <Button type="submit" size="sm" variant="outline-primary">
            {t("checklist:add")}
          </Button>
        </form>
      ) : (
        <Button
          variant="link"
          size="sm"
          className="focus-cl-add-group"
          onClick={() => setAddingGroup(true)}
        >
          <Icon name="plus" size={14} />
          {t("checklist:addGroup")}
        </Button>
      )}
    </div>
  );
}
